/**
 * Tests for @nself/graphql-client/admin (P7-ADOPT-09).
 *
 * Coverage:
 *   - headers: admin secret always; role and source-account only when given;
 *     omitted values send no header; reserved header names rejected in config
 *   - browser guard: throws AdminClientInBrowserError (no secret) when window or
 *     document exist; the "browser" export condition maps to a throwing stub
 *   - no leakage: a GraphQL error, a network error and a config error never put
 *     a random 40-char secret into message, String(), JSON, inspect or onError
 */

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inspect } from 'node:util';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  createAdminClient,
  AdminClientInBrowserError,
  AdminClientConfigError,
} from '../index.js';
import * as browserStub from '../browser.js';

const URL_ = 'http://hasura.test/v1/graphql';
const QUERY = '{ notes { id } }';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllGlobals();
});
afterAll(() => server.close());

const newSecret = (): string => randomBytes(20).toString('hex'); // 40 chars

/** Every serialisation path a caller or a logger could reach. */
function dump(label: string, v: unknown): string[] {
  const out = [label, inspect(v, { depth: 12, showHidden: true })];
  try {
    out.push(JSON.stringify(v) ?? '');
  } catch {
    /* non-serialisable is fine */
  }
  out.push(String(v));
  if (v instanceof Error) out.push(v.message, v.stack ?? '');
  return out;
}

function expectNoSecret(secret: string, parts: string[]): void {
  for (const p of parts) expect(p).not.toContain(secret);
}

describe('headers', () => {
  it('sends the admin secret, role and source account id when given', async () => {
    const secret = newSecret();
    let seen: Record<string, string> = {};
    server.use(
      http.post(URL_, ({ request }) => {
        seen = Object.fromEntries(request.headers.entries());
        return HttpResponse.json({ data: { notes: [] } });
      }),
    );
    const client = createAdminClient({
      url: URL_,
      adminSecret: secret,
      role: 'user',
      sourceAccountId: 'app_a',
      headers: { 'x-request-id': 'r1' },
    });
    const res = await client.query(QUERY, {}, { requestPolicy: 'network-only' }).toPromise();
    expect(res.error).toBeUndefined();
    expect(seen['x-hasura-admin-secret']).toBe(secret);
    expect(seen['x-hasura-role']).toBe('user');
    expect(seen['x-hasura-source-account-id']).toBe('app_a');
    expect(seen['x-request-id']).toBe('r1');
    expect(seen['x-hasura-tenant-id']).toBeUndefined();
  });

  it('sends no role or source-account header when omitted', async () => {
    const secret = newSecret();
    let seen: Record<string, string> = {};
    server.use(
      http.post(URL_, ({ request }) => {
        seen = Object.fromEntries(request.headers.entries());
        return HttpResponse.json({ data: { notes: [] } });
      }),
    );
    const client = createAdminClient({ url: URL_, adminSecret: secret });
    await client.query(QUERY, {}, { requestPolicy: 'network-only' }).toPromise();
    expect(seen['x-hasura-admin-secret']).toBe(secret);
    expect(seen).not.toHaveProperty('x-hasura-role');
    expect(seen).not.toHaveProperty('x-hasura-source-account-id');
  });

  it.each(['x-hasura-admin-secret', 'X-Hasura-Role', 'x-hasura-source-account-id'])(
    'rejects reserved header %s in config.headers',
    (name) => {
      expect(() =>
        createAdminClient({ url: URL_, adminSecret: newSecret(), headers: { [name]: 'x' } }),
      ).toThrow(AdminClientConfigError);
    },
  );
});

describe('browser guard', () => {
  it('throws AdminClientInBrowserError when window exists, message has no secret', () => {
    const secret = newSecret();
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {});
    let caught: unknown;
    try {
      createAdminClient({ url: URL_, adminSecret: secret });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(AdminClientInBrowserError);
    expectNoSecret(secret, dump('e', caught));
  });

  it('throws when only window exists', () => {
    vi.stubGlobal('window', {});
    expect(() => createAdminClient({ url: URL_, adminSecret: newSecret() })).toThrow(
      AdminClientInBrowserError,
    );
  });

  it('throws when only document exists', () => {
    vi.stubGlobal('document', {});
    expect(() => createAdminClient({ url: URL_, adminSecret: newSecret() })).toThrow(
      AdminClientInBrowserError,
    );
  });

  it('checks at call time: importing the module does not throw', () => {
    vi.stubGlobal('window', {});
    expect(typeof createAdminClient).toBe('function');
  });

  it('maps the "browser" export condition to a stub that always throws', () => {
    const pkg = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
    ) as { exports: Record<string, unknown> };
    expect(pkg.exports['./admin']).toEqual({
      browser: './src/admin/browser.ts',
      default: './src/admin/index.ts',
    });
    const secret = newSecret();
    expect(() => browserStub.createAdminClient({ url: URL_, adminSecret: secret })).toThrow(
      AdminClientInBrowserError,
    );
    expect(browserStub.AdminClientInBrowserError).toBe(AdminClientInBrowserError);
  });
});

describe('no secret leakage', () => {
  it('scrubs a GraphQL error that echoes the secret', async () => {
    const secret = newSecret();
    const onError = vi.fn();
    server.use(
      http.post(URL_, () =>
        HttpResponse.json({
          errors: [
            {
              message: `bad header ${secret} and ${encodeURIComponent(secret)}`,
              extensions: { code: 'access-denied', echo: { nested: [secret] } },
            },
          ],
        }),
      ),
    );
    const client = createAdminClient({ url: URL_, adminSecret: secret, onError });
    const res = await client.query(QUERY, {}, { requestPolicy: 'network-only' }).toPromise();
    expect(res.error).toBeDefined();
    expect(res.error?.message).toContain('[REDACTED]');
    expect(onError).toHaveBeenCalledTimes(1);
    const [appError] = onError.mock.calls[0] as [unknown];
    expectNoSecret(secret, [
      ...dump('error', res.error),
      ...dump('appError', appError),
      ...dump('client', client),
      JSON.stringify(res.error?.graphQLErrors),
    ]);
  });

  it('scrubs a network error that carries the secret', async () => {
    const secret = newSecret();
    const onError = vi.fn();
    const failure = new TypeError(`fetch failed for header ${secret}`, {
      cause: new Error(`inner ${secret}`),
    });
    vi.stubGlobal('fetch', () => Promise.reject(failure));
    const client = createAdminClient({ url: URL_, adminSecret: secret, onError });
    const res = await client.query(QUERY, {}, { requestPolicy: 'network-only' }).toPromise();
    expect(res.error?.networkError).toBeDefined();
    expect(onError).toHaveBeenCalledTimes(1);
    expectNoSecret(secret, [
      ...dump('error', res.error),
      ...dump('network', res.error?.networkError),
      ...dump('appError', onError.mock.calls[0]?.[0]),
    ]);
  });

  it('keeps the secret out of thrown config errors', () => {
    const secret = newSecret();
    const attempts: Array<() => unknown> = [
      () => createAdminClient({ url: secret, adminSecret: secret }),
      () => createAdminClient({ url: `ftp://${secret}.test`, adminSecret: secret }),
      () => createAdminClient({ url: URL_, adminSecret: `${secret}\n` }),
      () => createAdminClient({ url: URL_, adminSecret: secret, role: `${secret}\r\n` }),
      () =>
        createAdminClient({
          url: URL_,
          adminSecret: secret,
          headers: { 'x-hasura-admin-secret': secret },
        }),
      () => createAdminClient({ url: URL_, adminSecret: '' }),
    ];
    for (const attempt of attempts) {
      let caught: unknown;
      try {
        attempt();
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(AdminClientConfigError);
      expectNoSecret(secret, dump('e', caught));
    }
  });

  it('serialises the client without headers or the secret', () => {
    const secret = newSecret();
    const client = createAdminClient({
      url: URL_,
      adminSecret: secret,
      role: 'user',
      sourceAccountId: 'app_a',
    });
    const json = JSON.stringify(client);
    expect(JSON.parse(json)).toEqual({ kind: 'nself.AdminClient', origin: 'http://hasura.test' });
    expect(String(client)).toBe('[nSelf AdminClient]');
    expect(`${client}`).not.toContain(secret);
    expectNoSecret(secret, dump('client', client));
    expect(Object.keys(client)).not.toContain('toJSON');
  });
});
