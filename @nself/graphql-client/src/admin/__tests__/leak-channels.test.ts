/**
 * Leak-channel tests for @nself/graphql-client/admin (P7-ADOPT-09 review M1, M2, S1-S4).
 *
 * The admin headers must live only in the client's private fetch. These tests
 * look at every channel urql exposes (debug events, operation context, results,
 * errors, responses) and at what the private fetch does with other URLs.
 *
 * Coverage:
 *   - urql debug events (subscribeToDebugTarget, non-production) hold no secret
 *   - result.operation: JSON, inspect and every function in its context
 *   - a request to any other URL never gets the headers and never reaches fetch
 *   - per-operation fetchOptions cannot change role, source account or secret
 *   - redirects are refused, so headers never follow one
 *   - response headers and bodies that echo the secret are scrubbed
 *   - worker scope guard, url credentials, Headers instance in config.headers
 */

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { inspect } from 'node:util';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Client, Operation } from '@urql/core';
import {
  createAdminClient,
  AdminClientConfigError,
  AdminClientInBrowserError,
} from '../index.js';

const URL_ = 'http://hasura.test/v1/graphql';
const EVIL = 'http://evil.test/v1/graphql';
const QUERY = '{ notes { id } }';
const NET = { requestPolicy: 'network-only' } as const;
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllGlobals();
});
afterAll(() => server.close());

const newSecret = (): string => randomBytes(20).toString('hex');
const everything = (v: unknown): string =>
  inspect(v, { depth: 14, showHidden: true }) + (JSON.stringify(v) ?? '');

describe('urql debug events (M1)', () => {
  it('carry no secret across success, GraphQL error, network error and body echo', async () => {
    const secret = newSecret();
    const events: unknown[] = [];
    const client = createAdminClient({ url: URL_, adminSecret: secret, role: 'user' });
    client.subscribeToDebugTarget?.((e) => events.push(e));

    server.use(http.post(URL_, () => HttpResponse.json({ data: { notes: [] } })));
    await client.query(QUERY, {}, NET).toPromise();

    server.use(
      http.post(URL_, () =>
        HttpResponse.json({ errors: [{ message: `echo ${secret}` }] }, { status: 500 }),
      ),
    );
    await client.query(QUERY, {}, NET).toPromise();

    vi.stubGlobal('fetch', () => Promise.reject(new TypeError(`boom ${secret}`)));
    await client.query(QUERY, {}, NET).toPromise();

    const types = events.map((e) => (e as { type: string }).type);
    expect(types).toContain('fetchRequest');
    expect(types).toContain('fetchError');
    expect(everything(events)).not.toContain(secret);
  });
});

describe('result.operation (M2)', () => {
  it('has no secret in JSON, inspect or any function of its context', async () => {
    const secret = newSecret();
    server.use(http.post(URL_, () => HttpResponse.json({ data: { notes: [] } })));
    const client = createAdminClient({ url: URL_, adminSecret: secret, sourceAccountId: 'app_a' });
    const res = await client.query(QUERY, {}, NET).toPromise();
    const op = res.operation as Operation;
    expect(everything(op)).not.toContain(secret);
    expect(everything(res)).not.toContain(secret);

    const outputs: string[] = [];
    const fns = Object.entries(op.context).filter(([, v]) => typeof v === 'function');
    for (const [, fn] of fns) {
      for (const args of [[], [URL_], [URL_, { method: 'POST' }]] as unknown[][]) {
        try {
          const out = await (fn as (...a: unknown[]) => unknown)(...args);
          outputs.push(everything(out));
        } catch (e) {
          outputs.push(everything(e));
        }
      }
    }
    expect(op.context.fetchOptions).toBeUndefined();
    expect(outputs.join('\n')).not.toContain(secret);
  });
});

describe('private fetch scope (headers only for the configured endpoint)', () => {
  it('refuses another URL before any network I/O, headers never attached', async () => {
    const secret = newSecret();
    const spy = vi.fn(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', spy);
    const client = createAdminClient({ url: URL_, adminSecret: secret });

    // 1. A per-operation URL override.
    const res = await client.query(QUERY, {}, { ...NET, url: EVIL }).toPromise();
    expect(res.error?.networkError?.name).toBe('AdminClientRequestRefusedError');
    expect(everything(res.error)).not.toContain(secret);

    // 2. The fetch handed to urql, called directly with other targets.
    const fetchFn = res.operation.context.fetch as typeof fetch;
    for (const target of [EVIL, 'http://hasura.test:81/v1/graphql', 'http://hasura.test/other']) {
      await expect(fetchFn(target)).rejects.toThrow(/refused/);
    }
    await expect(fetchFn(new Request(URL_))).rejects.toThrow(/refused/);
    await expect(fetchFn('/relative')).rejects.toThrow(/refused/);
    await expect(
      (fetchFn as unknown as () => Promise<Response>)(),
    ).rejects.toThrow(/refused/);
    expect(spy).not.toHaveBeenCalled();
  });

  it('attaches the headers to the configured endpoint, with or without a query string', async () => {
    const secret = newSecret();
    const seen: Array<Record<string, string>> = [];
    server.use(
      http.get(URL_, ({ request }) => {
        seen.push(Object.fromEntries(request.headers.entries()));
        return HttpResponse.json({ data: {} });
      }),
    );
    const client = createAdminClient({ url: URL_, adminSecret: secret });
    const res = await client.query(QUERY, {}, { ...NET, preferGetMethod: true }).toPromise();
    expect(res.error).toBeUndefined();
    expect(seen[0]?.['x-hasura-admin-secret']).toBe(secret);
  });

  it('per-operation fetchOptions cannot change or drop the admin headers (S1)', async () => {
    const secret = newSecret();
    let seen: Record<string, string> = {};
    server.use(
      http.post(URL_, ({ request }) => {
        seen = Object.fromEntries(request.headers.entries());
        return HttpResponse.json({ data: {} });
      }),
    );
    const evilHeaders = {
      'x-hasura-role': 'admin',
      'X-Hasura-Source-Account-Id': 'app_b',
      'x-hasura-admin-secret': 'other',
    };
    // Role and source account set in config: they win.
    const a = createAdminClient({
      url: URL_,
      adminSecret: secret,
      role: 'user',
      sourceAccountId: 'app_a',
    });
    await a.query(QUERY, {}, { ...NET, fetchOptions: { headers: evilHeaders } }).toPromise();
    expect(seen['x-hasura-role']).toBe('user');
    expect(seen['x-hasura-source-account-id']).toBe('app_a');
    expect(seen['x-hasura-admin-secret']).toBe(secret);

    // Not set in config: a caller cannot add them.
    const b = createAdminClient({ url: URL_, adminSecret: secret });
    await b.query(QUERY, {}, { ...NET, fetchOptions: { headers: evilHeaders } }).toPromise();
    expect(seen).not.toHaveProperty('x-hasura-role');
    expect(seen).not.toHaveProperty('x-hasura-source-account-id');
    expect(seen['x-hasura-admin-secret']).toBe(secret);
  });

  it('forces redirect: error, even when the caller asks to follow (S9)', async () => {
    const secret = newSecret();
    const spy = vi.fn((_input: unknown, _init?: RequestInit) =>
      Promise.resolve(new Response('{"data":{}}', { headers: { 'content-type': 'application/json' } })),
    );
    vi.stubGlobal('fetch', spy);
    const client = createAdminClient({ url: URL_, adminSecret: secret });
    await client.query(QUERY, {}, { ...NET, fetchOptions: { redirect: 'follow' } }).toPromise();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[1]?.redirect).toBe('error');
  });

  it('does not follow a redirect to another host', async () => {
    const secret = newSecret();
    const elsewhere = vi.fn(() => HttpResponse.json({ data: {} }));
    server.use(
      http.post(URL_, () => new HttpResponse(null, { status: 307, headers: { location: EVIL } })),
      http.post(EVIL, elsewhere),
    );
    const client = createAdminClient({ url: URL_, adminSecret: secret });
    const res = await client.query(QUERY, {}, NET).toPromise();
    expect(res.error).toBeDefined();
    expect(elsewhere).not.toHaveBeenCalled();
    expect(everything(res.error)).not.toContain(secret);
  });

  it('passes only an allowlist of init keys to fetch: no dispatcher or agent (S6)', async () => {
    const secret = newSecret();
    const spy = vi.fn((_input: unknown, _init?: RequestInit) =>
      Promise.resolve(new Response('{"data":{}}', { headers: { 'content-type': 'application/json' } })),
    );
    vi.stubGlobal('fetch', spy);
    const client = createAdminClient({ url: URL_, adminSecret: secret });
    const spyDispatcher = { dispatch: vi.fn() };
    await client
      .query(
        QUERY,
        {},
        {
          ...NET,
          fetchOptions: {
            dispatcher: spyDispatcher,
            agent: spyDispatcher,
            keepalive: true,
            credentials: 'include',
          } as RequestInit,
        },
      )
      .toPromise();
    const init = spy.mock.calls[0]?.[1] as RequestInit;
    const allowed = new Set(['method', 'body', 'signal', 'headers', 'redirect']);
    expect(Object.keys(init).filter((k) => !allowed.has(k))).toEqual([]);
    expect(spyDispatcher.dispatch).not.toHaveBeenCalled();
  });
});

describe('response scrubbing (S4)', () => {
  it('removes the secret from response headers and bodies kept on errors', async () => {
    const secret = newSecret();
    server.use(
      http.post(URL_, () =>
        HttpResponse.json(
          { errors: [{ message: `echo ${secret}` }] },
          { status: 500, headers: { 'x-echo': secret } },
        ),
      ),
    );
    const client = createAdminClient({ url: URL_, adminSecret: secret });
    const res = await client.query(QUERY, {}, NET).toPromise();
    const response = res.error?.response as Response;
    expect(response.headers.get('x-echo')).not.toContain(secret);
    expect(everything(res.error)).not.toContain(secret);
  });
});

describe('guard and config hardening', () => {
  it('throws in a Web or Service Worker scope (S2)', () => {
    vi.stubGlobal('importScripts', () => undefined);
    expect(() => createAdminClient({ url: URL_, adminSecret: newSecret() })).toThrow(
      AdminClientInBrowserError,
    );
  });

  it('rejects a url with credentials, accepts a Headers instance', () => {
    const secret = newSecret();
    expect(() =>
      createAdminClient({ url: `http://u:${secret}@hasura.test/v1/graphql`, adminSecret: secret }),
    ).toThrow(AdminClientConfigError);
    const c: Client = createAdminClient({
      url: URL_,
      adminSecret: secret,
      headers: new Headers({ 'x-request-id': 'r' }) as unknown as Record<string, string>,
    });
    expect(c).toBeDefined();
  });
});
