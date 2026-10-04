/**
 * Hardening tests for @nself/graphql-client/admin (P7-ADOPT-09 recheck M3, S5, S7, S8).
 *
 * Coverage:
 *   - a successful response body is never rewritten (data that holds the secret's
 *     text stays intact)
 *   - error responses: headers scrubbed whatever the content type, JSON bodies
 *     scrubbed per parsed value
 *   - weak or short secrets are rejected with a fixed message
 *   - the browser stub exports the same runtime names as the real module
 */

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { inspect } from 'node:util';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createAdminClient, AdminClientConfigError } from '../index.js';

const URL_ = 'http://hasura.test/v1/graphql';
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

describe('response handling (M3, S5)', () => {
  it('never rewrites a successful response body, whatever the data holds (M3)', async () => {
    const secret = 'k3yw0rd-s3cret-9z!';
    const data = {
      notes: [{ id: 1, title: `my ${secret} note`, notes: 'k3yw0rd', tag: 's3cret' }],
    };
    server.use(http.post(URL_, () => HttpResponse.json({ data })));
    const client = createAdminClient({ url: URL_, adminSecret: secret });
    const res = await client.query(QUERY, {}, NET).toPromise();
    expect(res.error).toBeUndefined();
    expect(res.data).toEqual(data);
  });

  it('scrubs headers of an error response whatever the content type (S5)', async () => {
    const secret = newSecret();
    server.use(
      http.post(URL_, () =>
        new HttpResponse('boom', {
          status: 500,
          headers: { 'content-type': 'application/octet-stream', 'x-echo': secret },
        }),
      ),
    );
    const client = createAdminClient({ url: URL_, adminSecret: secret });
    const res = await client.query(QUERY, {}, NET).toPromise();
    const response = res.error?.response as Response;
    expect(response.headers.get('x-echo')).not.toContain(secret);
    expect(everything(res.error)).not.toContain(secret);
  });

  it('scrubs response headers kept on a 200 that carries GraphQL errors (S5)', async () => {
    const secret = newSecret();
    server.use(
      http.post(URL_, () =>
        HttpResponse.json({ errors: [{ message: 'x' }] }, { headers: { 'x-echo': secret } }),
      ),
    );
    const client = createAdminClient({ url: URL_, adminSecret: secret });
    const res = await client.query(QUERY, {}, NET).toPromise();
    expect((res.error?.response as Response).headers.get('x-echo')).not.toContain(secret);
  });

  it('scrubs a whole-value echo in an error JSON body', async () => {
    const secret = newSecret();
    server.use(
      http.post(URL_, () =>
        HttpResponse.json({ errors: [{ message: secret, extensions: { k: secret } }] }, { status: 500 }),
      ),
    );
    const client = createAdminClient({ url: URL_, adminSecret: secret });
    const res = await client.query(QUERY, {}, NET).toPromise();
    expect(everything(res.error)).not.toContain(secret);
  });
});

describe('statusText scrubbing (S10)', () => {
  it('keeps an echoed secret out of result.error.response.statusText and debug events', async () => {
    const secret = newSecret();
    const events: unknown[] = [];
    server.use(
      http.post(URL_, () =>
        HttpResponse.json({ errors: [{ message: 'x' }] }, { status: 502, statusText: `bad ${secret}` }),
      ),
    );
    const client = createAdminClient({ url: URL_, adminSecret: secret });
    client.subscribeToDebugTarget?.((e) => events.push(e));
    const res = await client.query(QUERY, {}, NET).toPromise();
    const response = res.error?.response as Response;
    expect(response.statusText).not.toContain(secret);
    expect(everything(res.error)).not.toContain(secret);
    expect(everything(events)).not.toContain(secret);
  });
});

describe('weak secrets and stub parity (S7, S8)', () => {
  it.each([
    '1',
    'short-secret',
    'change-me',
    'changeme',
    'password',
    'aaaaaaaaaaaaaaaaaaaa',
    'abababababababababab',
    'changemechangeme',
    'your-randomly-generated-secret-here',
    'your-dev-secret-here',
    'your_admin_secret_here',
    'your-hasura-admin-secret',
    'nself-dev-admin-secret-change-in-prod',
    'nself-hasura-admin-secret-2026',
    'myadminsecretkey-0123456789',
  ])('rejects the weak secret %j with a fixed message', (weak) => {
    let caught: unknown;
    try {
      createAdminClient({ url: URL_, adminSecret: weak });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(AdminClientConfigError);
    // A one-character value would match the digits in the fixed text; longer ones must not.
    if (weak.length > 3) expect((caught as Error).message).not.toContain(weak);
    expect((caught as AdminClientConfigError).field).toBe('adminSecret');
  });

  it('browser stub exports the same runtime names as the real module', async () => {
    const real = await import('../index.js');
    const stub = await import('../browser.js');
    expect(Object.keys(stub).sort()).toEqual(Object.keys(real).sort());
  });
});
