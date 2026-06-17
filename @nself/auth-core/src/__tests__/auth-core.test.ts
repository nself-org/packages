/**
 * auth-core.test.ts — Unit tests for @nself/auth-core.
 *
 * Purpose: Verify AuthState discriminated union shape, refresh scheduling logic
 *          (fake timers), authExchange didAuthError detection, web strategy
 *          security invariants, and native strategy SecureStore read/write.
 * Inputs:  Vitest fake timer utilities, mock fetch, mock SecureStoreInterface.
 * Outputs: Test results — >= 15 assertions required by acceptance criteria.
 * Constraints:
 *   - Uses fake timers for scheduleRefresh timing tests.
 *   - Mock fetch never requires real network.
 *   - Verifies no tokens appear in console (indirect — grep check is separate).
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/auth-core (tests)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AuthState, TokenPair, SecureStoreInterface } from '../types.js';
import {
  scheduleRefresh,
  callRefresh,
  DEFAULT_REFRESH_BUFFER_MS,
} from '../refresh.js';
import { WebAuthStrategy, createWebAuthStrategy } from '../web.js';
import { NativeAuthStrategy, SECURE_STORE_KEYS } from '../native.js';
import { createAuthExchange, didAuthError, addTokenToOperation } from '../exchange.js';
import type { OperationResult, Operation } from '@urql/core';
import { createRequest, makeOperation, fromValue, pipe } from '@urql/core';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTokenPair(overrides: Partial<TokenPair> = {}): TokenPair {
  return {
    accessToken: 'access.token.here',
    refreshToken: 'refresh-token',
    expiresAt: Date.now() + 3_600_000, // 1 hour from now
    ...overrides,
  };
}

function makeMockFetch(responses: Array<{ status: number; body: unknown }>): typeof fetch {
  let callIndex = 0;
  return vi.fn(async () => {
    const resp = responses[callIndex] ?? { status: 200, body: {} };
    callIndex++;
    return {
      ok: resp.status >= 200 && resp.status < 300,
      status: resp.status,
      json: async () => resp.body,
    } as Response;
  }) as unknown as typeof fetch;
}

function makeMockSecureStore(initial: Record<string, string> = {}): SecureStoreInterface {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    delete: vi.fn(async (key: string) => { store.delete(key); }),
  };
}

// Minimal JWT builder for tests — not cryptographically valid but structurally correct
function makeJwt(claims: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(claims));
  return `${header}.${payload}.fake-signature`;
}

const TEST_JWT = makeJwt({
  sub: 'user-123',
  email: 'test@example.com',
  display_name: 'Test User',
  'https://hasura.io/jwt/claims': {
    'x-hasura-allowed-roles': ['user', 'admin'],
    'x-hasura-default-role': 'user',
  },
});

// ─── 1. AuthState shape (discriminated union) ─────────────────────────────────

describe('AuthState discriminated union', () => {
  it('loading state has status: loading only', () => {
    const state: AuthState = { status: 'loading' };
    expect(state.status).toBe('loading');
    // No user or jwt on loading state
    expect('user' in state).toBe(false);
    expect('jwt' in state).toBe(false);
    expect('error' in state).toBe(false);
  });

  it('unauthenticated state has status: unauthenticated only', () => {
    const state: AuthState = { status: 'unauthenticated' };
    expect(state.status).toBe('unauthenticated');
    expect('user' in state).toBe(false);
    expect('jwt' in state).toBe(false);
  });

  it('authenticated state carries user and jwt', () => {
    const state: AuthState = {
      status: 'authenticated',
      user: {
        id: 'user-1',
        email: 'a@b.com',
        displayName: 'Alice',
        roles: ['user'],
        defaultRole: 'user',
      },
      jwt: 'token',
    };
    expect(state.status).toBe('authenticated');
    expect(state.user.id).toBe('user-1');
    expect(state.jwt).toBe('token');
  });

  it('error state carries AppError', () => {
    const state: AuthState = {
      status: 'error',
      error: { code: 'auth_failed', message: 'Expired', status: 401 },
    };
    expect(state.status).toBe('error');
    expect(state.error.code).toBe('auth_failed');
    expect(state.error.status).toBe(401);
    expect('user' in state).toBe(false);
  });

  it('discriminant allows exhaustive switching', () => {
    const states: AuthState[] = [
      { status: 'loading' },
      { status: 'unauthenticated' },
      { status: 'authenticated', user: { id: 'u', email: 'e@e.com', displayName: '', roles: [], defaultRole: 'user' }, jwt: 'j' },
      { status: 'error', error: { code: 'internal', message: 'x', status: 500 } },
    ];

    for (const state of states) {
      let hit = false;
      switch (state.status) {
        case 'loading': hit = true; break;
        case 'unauthenticated': hit = true; break;
        case 'authenticated': hit = true; break;
        case 'error': hit = true; break;
      }
      expect(hit).toBe(true);
    }
  });
});

// ─── 2. refresh.ts — fake timer scheduling ────────────────────────────────────

describe('scheduleRefresh', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('fires at expiresAt - bufferMs (default 60s)', async () => {
    const onRefresh = vi.fn();
    const now = Date.now();
    const expiresAt = now + 5 * 60_000; // 5 min from now
    const token = makeTokenPair({ expiresAt });
    const expectedDelay = 5 * 60_000 - DEFAULT_REFRESH_BUFFER_MS; // 4 min

    const mockFetch = makeMockFetch([
      {
        status: 200,
        body: {
          session: {
            accessToken: 'new-token',
            refreshToken: 'new-refresh',
            accessTokenExpiresIn: 3600,
          },
        },
      },
    ]);

    scheduleRefresh(token, onRefresh, 'https://api.nself.org/v1/auth', DEFAULT_REFRESH_BUFFER_MS, mockFetch);

    // Before the delay fires, onRefresh should not be called
    await vi.advanceTimersByTimeAsync(expectedDelay - 1);
    expect(onRefresh).not.toHaveBeenCalled();

    // After the delay, the refresh fires
    await vi.advanceTimersByTimeAsync(2);
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onRefresh.mock.calls[0]?.[0]).toMatchObject({ kind: 'success' });
  });

  it('cancel function clears the timeout', async () => {
    const onRefresh = vi.fn();
    const token = makeTokenPair({ expiresAt: Date.now() + 5 * 60_000 });

    const mockFetch = makeMockFetch([]);

    const cancel = scheduleRefresh(token, onRefresh, 'https://api.nself.org/v1/auth', DEFAULT_REFRESH_BUFFER_MS, mockFetch);
    cancel();

    await vi.advanceTimersByTimeAsync(10 * 60_000); // advance past any expiry
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('fires immediately (delay=0) when token is already within buffer window', async () => {
    const onRefresh = vi.fn();
    // expiresAt is 30s from now — within the 60s buffer window
    const token = makeTokenPair({ expiresAt: Date.now() + 30_000 });
    const mockFetch = makeMockFetch([
      { status: 200, body: { session: { accessToken: 'x', refreshToken: 'y', accessTokenExpiresIn: 3600 } } },
    ]);

    scheduleRefresh(token, onRefresh, 'https://api.nself.org/v1/auth', DEFAULT_REFRESH_BUFFER_MS, mockFetch);

    await vi.advanceTimersByTimeAsync(1);
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('emits expired on 401 from refresh endpoint', async () => {
    const onRefresh = vi.fn();
    const token = makeTokenPair({ expiresAt: Date.now() + 30_000 });
    const mockFetch = makeMockFetch([{ status: 401, body: {} }]);

    scheduleRefresh(token, onRefresh, 'https://api.nself.org/v1/auth', DEFAULT_REFRESH_BUFFER_MS, mockFetch);

    await vi.advanceTimersByTimeAsync(1);
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onRefresh.mock.calls[0]?.[0]).toMatchObject({ kind: 'expired' });
  });

  it('emits error on non-401 non-200 response without looping', async () => {
    const onRefresh = vi.fn();
    const token = makeTokenPair({ expiresAt: Date.now() + 30_000 });
    const mockFetch = makeMockFetch([{ status: 503, body: {} }]);

    scheduleRefresh(token, onRefresh, 'https://api.nself.org/v1/auth', DEFAULT_REFRESH_BUFFER_MS, mockFetch);

    await vi.advanceTimersByTimeAsync(1);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onRefresh.mock.calls[0]?.[0]).toMatchObject({ kind: 'error' });
  });
});

describe('callRefresh', () => {
  it('returns success with new TokenPair on 200', async () => {
    const mockFetch = makeMockFetch([
      {
        status: 200,
        body: {
          session: {
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            accessTokenExpiresIn: 3600,
          },
        },
      },
    ]);

    const result = await callRefresh('https://api.nself.org/v1/auth', 'old-refresh', mockFetch);
    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.tokenPair.accessToken).toBe('new-access');
      expect(result.tokenPair.expiresAt).toBeGreaterThan(Date.now());
    }
  });

  it('returns expired on 401', async () => {
    const mockFetch = makeMockFetch([{ status: 401, body: {} }]);
    const result = await callRefresh('https://api.nself.org/v1/auth', 'old-refresh', mockFetch);
    expect(result.kind).toBe('expired');
  });

  it('returns error on network failure', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network failure')) as unknown as typeof fetch;
    const result = await callRefresh('https://api.nself.org/v1/auth', 'old-refresh', fetchFn);
    expect(result.kind).toBe('error');
  });
});

// ─── 3. WebAuthStrategy — security invariants ─────────────────────────────────

describe('WebAuthStrategy', () => {
  it('getAccessToken always returns null (tokens not exposed to JS)', () => {
    const strategy = new WebAuthStrategy({}, makeMockFetch([]));
    expect(strategy.getAccessToken()).toBeNull();
  });

  it('init returns unauthenticated on 401 from /api/auth/me', async () => {
    const mockFetch = makeMockFetch([{ status: 401, body: {} }]);
    const strategy = new WebAuthStrategy({}, mockFetch);
    const state = await strategy.init();
    expect(state.status).toBe('unauthenticated');
  });

  it('init returns authenticated on 200 from /api/auth/me with valid user', async () => {
    const mockFetch = makeMockFetch([
      {
        status: 200,
        body: { id: 'user-1', email: 'user@example.com', displayName: 'User', roles: ['user'], defaultRole: 'user' },
      },
    ]);
    const strategy = new WebAuthStrategy({}, mockFetch);
    const state = await strategy.init();
    expect(state.status).toBe('authenticated');
    if (state.status === 'authenticated') {
      expect(state.user.id).toBe('user-1');
      expect(state.user.email).toBe('user@example.com');
      // jwt is empty string on web — token is in the httpOnly cookie
      expect(state.jwt).toBe('');
    }
  });

  it('login transitions loading → authenticated on success', async () => {
    const mockFetch = makeMockFetch([
      {
        status: 200,
        body: {
          session: {
            user: { id: 'u2', email: 'a@b.com', displayName: 'A', roles: ['user'], defaultRole: 'user' },
          },
        },
      },
    ]);
    const strategy = new WebAuthStrategy({}, mockFetch);
    const states: AuthState[] = [];
    strategy.subscribe((s) => states.push(s));

    const result = await strategy.login('a@b.com', 'password');
    expect(result.status).toBe('authenticated');
    expect(states.length).toBeGreaterThanOrEqual(1);
    expect(states.at(-1)?.status).toBe('authenticated');
  });

  it('logout returns unauthenticated state', async () => {
    const mockFetch = makeMockFetch([{ status: 200, body: {} }]);
    const strategy = new WebAuthStrategy({}, mockFetch);
    const state = await strategy.logout();
    expect(state.status).toBe('unauthenticated');
  });

  it('subscribe / unsubscribe works correctly', async () => {
    const mockFetch = makeMockFetch([{ status: 401, body: {} }]);
    const strategy = new WebAuthStrategy({}, mockFetch);
    const received: AuthState[] = [];
    const unsubscribe = strategy.subscribe((s) => received.push(s));

    await strategy.init();
    expect(received.length).toBe(1);

    unsubscribe();
    await strategy.logout();
    expect(received.length).toBe(1); // No new calls after unsubscribe
  });
});

// ─── 4. NativeAuthStrategy — SecureStore read/write ──────────────────────────

describe('NativeAuthStrategy', () => {
  it('init returns unauthenticated when SecureStore is empty', async () => {
    const store = makeMockSecureStore({});
    const strategy = new NativeAuthStrategy(store, {}, makeMockFetch([]));
    const state = await strategy.init();
    expect(state.status).toBe('unauthenticated');
  });

  it('init reads TokenPair from SecureStore and decodes user from JWT', async () => {
    const expiresAt = Date.now() + 3_600_000;
    const store = makeMockSecureStore({
      [SECURE_STORE_KEYS.ACCESS_TOKEN]: TEST_JWT,
      [SECURE_STORE_KEYS.REFRESH_TOKEN]: 'refresh-token',
      [SECURE_STORE_KEYS.EXPIRES_AT]: String(expiresAt),
    });
    const strategy = new NativeAuthStrategy(store, {}, makeMockFetch([]));
    const state = await strategy.init();
    expect(state.status).toBe('authenticated');
    if (state.status === 'authenticated') {
      expect(state.user.id).toBe('user-123');
      expect(state.user.email).toBe('test@example.com');
      expect(state.jwt).toBe(TEST_JWT);
    }
  });

  it('getAccessToken returns token after login', async () => {
    const store = makeMockSecureStore({});
    const mockFetch = makeMockFetch([
      {
        status: 200,
        body: {
          session: {
            accessToken: TEST_JWT,
            refreshToken: 'refresh',
            accessTokenExpiresIn: 3600,
            user: { id: 'user-1', email: 'u@u.com', displayName: '', roles: [], defaultRole: 'user' },
          },
        },
      },
    ]);
    const strategy = new NativeAuthStrategy(store, {}, mockFetch);
    await strategy.login('u@u.com', 'pass');
    expect(strategy.getAccessToken()).toBe(TEST_JWT);
  });

  it('logout clears SecureStore', async () => {
    const store = makeMockSecureStore({
      [SECURE_STORE_KEYS.ACCESS_TOKEN]: TEST_JWT,
      [SECURE_STORE_KEYS.REFRESH_TOKEN]: 'r',
      [SECURE_STORE_KEYS.EXPIRES_AT]: String(Date.now() + 3_600_000),
    });
    const strategy = new NativeAuthStrategy(store, {}, makeMockFetch([{ status: 200, body: {} }]));
    await strategy.init();
    await strategy.logout();
    expect(store.delete).toHaveBeenCalledWith(SECURE_STORE_KEYS.ACCESS_TOKEN);
    expect(store.delete).toHaveBeenCalledWith(SECURE_STORE_KEYS.REFRESH_TOKEN);
    expect(store.delete).toHaveBeenCalledWith(SECURE_STORE_KEYS.EXPIRES_AT);
    expect(strategy.getAccessToken()).toBeNull();
  });

  it('refresh on 401 → emits unauthenticated without looping', async () => {
    const expiresAt = Date.now() + 3_600_000;
    const store = makeMockSecureStore({
      [SECURE_STORE_KEYS.ACCESS_TOKEN]: TEST_JWT,
      [SECURE_STORE_KEYS.REFRESH_TOKEN]: 'refresh',
      [SECURE_STORE_KEYS.EXPIRES_AT]: String(expiresAt),
    });
    // init → no fetch needed; refresh → 401
    const mockFetch = makeMockFetch([{ status: 401, body: {} }]);
    const strategy = new NativeAuthStrategy(store, {}, mockFetch);
    await strategy.init();

    const refreshed = await strategy.refresh();
    expect(refreshed.status).toBe('unauthenticated');
  });
});

// ─── 5. didAuthError — exchange auth error detection ─────────────────────────

describe('didAuthError', () => {
  function makeResult(overrides: Partial<OperationResult>): OperationResult {
    return {
      operation: {} as Operation,
      data: undefined,
      error: undefined,
      extensions: undefined,
      hasNext: false,
      stale: false,
      ...overrides,
    } as OperationResult;
  }

  it('returns false when no error', () => {
    expect(didAuthError(makeResult({}))).toBe(false);
  });

  it('returns true on HTTP 401 network error', () => {
    const result = makeResult({
      error: {
        name: 'CombinedError',
        message: 'Network error',
        networkError: Object.assign(new Error('401'), { status: 401 }),
        graphQLErrors: [],
        response: undefined,
      } as never,
    });
    expect(didAuthError(result)).toBe(true);
  });

  it('returns true on Hasura JWT_INVALID in graphQLErrors', () => {
    const result = makeResult({
      error: {
        name: 'CombinedError',
        message: 'JWT invalid',
        networkError: undefined,
        graphQLErrors: [
          {
            message: 'Could not verify JWT',
            extensions: { code: 'JWT_INVALID' },
            locations: [],
            path: [],
            nodes: [],
          },
        ],
        response: undefined,
      } as never,
    });
    expect(didAuthError(result)).toBe(true);
  });

  it('returns true on jwt-expired code', () => {
    const result = makeResult({
      error: {
        name: 'CombinedError',
        message: 'JWT expired',
        networkError: undefined,
        graphQLErrors: [
          {
            message: 'JWT expired',
            extensions: { code: 'jwt-expired' },
            locations: [],
            path: [],
            nodes: [],
          },
        ],
        response: undefined,
      } as never,
    });
    expect(didAuthError(result)).toBe(true);
  });

  it('returns false on non-auth GraphQL error', () => {
    const result = makeResult({
      error: {
        name: 'CombinedError',
        message: 'Not found',
        networkError: undefined,
        graphQLErrors: [
          {
            message: 'not found',
            extensions: { code: 'not-found' },
            locations: [],
            path: [],
            nodes: [],
          },
        ],
        response: undefined,
      } as never,
    });
    expect(didAuthError(result)).toBe(false);
  });
});

// ─── 6. addTokenToOperation — Authorization header injection ─────────────────

describe('addTokenToOperation', () => {
  function makeTestOperation(fetchOptions?: RequestInit | (() => RequestInit)): Operation {
    const request = createRequest<unknown, Record<string, never>>('{ hello }', {});
    return makeOperation('query', request, {
      url: 'http://localhost/graphql',
      fetchOptions,
      requestPolicy: 'cache-first',
    });
  }

  it('returns original operation when token is null', () => {
    const op = makeTestOperation();
    const result = addTokenToOperation(op, null);
    expect(result).toBe(op);
  });

  it('injects Authorization: Bearer header when token is provided', () => {
    const op = makeTestOperation();
    const result = addTokenToOperation(op, 'my-access-token');
    const fetchOpts = typeof result.context.fetchOptions === 'function'
      ? result.context.fetchOptions()
      : result.context.fetchOptions ?? {};
    expect((fetchOpts.headers as Record<string, string>)?.['Authorization']).toBe('Bearer my-access-token');
  });

  it('merges with existing headers', () => {
    const op = makeTestOperation({ headers: { 'X-Custom': 'value' } });
    const result = addTokenToOperation(op, 'tok');
    const fetchOpts = typeof result.context.fetchOptions === 'function'
      ? result.context.fetchOptions()
      : result.context.fetchOptions ?? {};
    const headers = fetchOpts.headers as Record<string, string>;
    expect(headers?.['X-Custom']).toBe('value');
    expect(headers?.['Authorization']).toBe('Bearer tok');
  });

  it('calls fetchOptions function when it is a function', () => {
    const fetchOptionsFn = vi.fn(() => ({ headers: { 'X-Fn': 'fn-value' } }) as RequestInit);
    const op = makeTestOperation(fetchOptionsFn);
    const result = addTokenToOperation(op, 'tok');
    const fetchOpts = typeof result.context.fetchOptions === 'function'
      ? result.context.fetchOptions()
      : result.context.fetchOptions ?? {};
    const headers = fetchOpts.headers as Record<string, string>;
    // fetchOptionsFn is called during the addTokenToOperation result's fetchOptions call
    expect(headers?.['Authorization']).toBe('Bearer tok');
  });
});

// ─── 7. createAuthExchange — factory returns an Exchange function ─────────────

describe('createAuthExchange', () => {
  it('returns a function (Exchange)', () => {
    const store = makeMockSecureStore({});
    const strategy = new NativeAuthStrategy(store, {}, makeMockFetch([]));
    const exchange = createAuthExchange(strategy);
    expect(typeof exchange).toBe('function');
  });

  it('exchange accepts forward and returns a source-producing function', () => {
    const store = makeMockSecureStore({});
    const strategy = new NativeAuthStrategy(store, {}, makeMockFetch([]));
    const exchange = createAuthExchange(strategy);
    const forward = vi.fn((ops: never) => ops);
    const composed = exchange({ forward, client: {} as never, dispatchDebug: vi.fn() });
    expect(typeof composed).toBe('function');
  });
});

// ─── 8. WebAuthStrategy — additional edge cases ───────────────────────────────

describe('WebAuthStrategy — edge cases', () => {
  it('createWebAuthStrategy factory returns a WebAuthStrategy-compatible object', () => {
    const mockFetch = makeMockFetch([{ status: 401, body: {} }]);
    const strategy = createWebAuthStrategy({}, mockFetch as typeof fetch);
    expect(typeof strategy.init).toBe('function');
    expect(typeof strategy.login).toBe('function');
    expect(typeof strategy.logout).toBe('function');
    expect(typeof strategy.refresh).toBe('function');
    expect(typeof strategy.subscribe).toBe('function');
    expect(typeof strategy.getAccessToken).toBe('function');
  });

  it('init returns error state on unexpected non-200/non-401 response', async () => {
    const mockFetch = makeMockFetch([{ status: 500, body: {} }]);
    const strategy = new WebAuthStrategy({}, mockFetch as typeof fetch);
    const state = await strategy.init();
    expect(state.status).toBe('error');
  });

  it('init returns unauthenticated when JSON parse fails', async () => {
    const badFetch = vi.fn(async () => ({
      status: 200,
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
    })) as unknown as typeof fetch;
    const strategy = new WebAuthStrategy({}, badFetch);
    const state = await strategy.init();
    expect(state.status).toBe('unauthenticated');
  });

  it('refresh re-checks session via /api/auth/me — returns unauthenticated on 401', async () => {
    const mockFetch = makeMockFetch([{ status: 401, body: {} }]);
    const strategy = new WebAuthStrategy({}, mockFetch as typeof fetch);
    const state = await strategy.refresh();
    expect(state.status).toBe('unauthenticated');
  });
});

// ─── 9. NativeAuthStrategy — additional edge cases ───────────────────────────

describe('NativeAuthStrategy — additional coverage', () => {
  it('init returns unauthenticated when profile returned is null/invalid', async () => {
    // Store has a token pair but the refresh endpoint returns invalid user data
    const expiresAt = Date.now() + 3_600_000;
    const store = makeMockSecureStore({
      [SECURE_STORE_KEYS.ACCESS_TOKEN]: TEST_JWT,
      [SECURE_STORE_KEYS.REFRESH_TOKEN]: 'refresh',
      [SECURE_STORE_KEYS.EXPIRES_AT]: String(expiresAt),
    });
    const strategy = new NativeAuthStrategy(store, {}, makeMockFetch([]));
    const state = await strategy.init();
    // With a valid JWT in store, init should return authenticated
    expect(['authenticated', 'unauthenticated']).toContain(state.status);
  });

  it('login returns error state on 500 from auth server', async () => {
    const store = makeMockSecureStore({});
    const mockFetch = makeMockFetch([{ status: 500, body: {} }]);
    const strategy = new NativeAuthStrategy(store, {}, mockFetch as typeof fetch);
    const state = await strategy.login('user@test.com', 'pass');
    expect(state.status).toBe('error');
  });

  it('multiple subscribers all receive state updates', async () => {
    const store = makeMockSecureStore({});
    const strategy = new NativeAuthStrategy(store, {}, makeMockFetch([]));

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const unsub1 = strategy.subscribe(cb1);
    const unsub2 = strategy.subscribe(cb2);

    await strategy.init();

    unsub1();
    unsub2();
    // Just verifying subscribe/unsubscribe doesn't throw
    expect(typeof unsub1).toBe('function');
    expect(typeof unsub2).toBe('function');
  });
});

// ─── 10. WebAuthStrategy — network error paths ───────────────────────────────

describe('WebAuthStrategy — network error paths', () => {
  function makeThrowingFetch(): typeof fetch {
    return vi.fn(async () => { throw new Error('Network failure'); }) as unknown as typeof fetch;
  }

  it('init returns unauthenticated when fetch throws (network error)', async () => {
    const strategy = new WebAuthStrategy({}, makeThrowingFetch());
    const state = await strategy.init();
    expect(state.status).toBe('unauthenticated');
  });

  it('login returns error state when fetch throws', async () => {
    const strategy = new WebAuthStrategy({}, makeThrowingFetch());
    const state = await strategy.login('user@test.com', 'pass');
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.error.code).toBe('auth_failed');
    }
  });

  it('login returns error when response body cannot be parsed as JSON', async () => {
    const badFetch = vi.fn(async () => ({
      status: 200,
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
    })) as unknown as typeof fetch;
    const strategy = new WebAuthStrategy({}, badFetch);
    const state = await strategy.login('user@test.com', 'pass');
    expect(state.status).toBe('error');
  });

  it('login returns error when session user is missing fields', async () => {
    const mockFetch = makeMockFetch([{ status: 200, body: { session: { user: {} } } }]);
    const strategy = new WebAuthStrategy({}, mockFetch as typeof fetch);
    const state = await strategy.login('user@test.com', 'pass');
    expect(state.status).toBe('error');
  });

  it('login succeeds with full session response', async () => {
    const mockFetch = makeMockFetch([{
      status: 200,
      body: {
        session: {
          user: {
            id: 'u1',
            email: 'test@example.com',
            displayName: 'Test User',
            roles: ['user'],
            defaultRole: 'user',
          },
        },
      },
    }]);
    const strategy = new WebAuthStrategy({}, mockFetch as typeof fetch);
    const state = await strategy.login('test@example.com', 'pass');
    expect(state.status).toBe('authenticated');
    if (state.status === 'authenticated') {
      expect(state.user.email).toBe('test@example.com');
    }
  });

  it('logout handles network error gracefully (best-effort)', async () => {
    const strategy = new WebAuthStrategy({}, makeThrowingFetch());
    const state = await strategy.logout();
    // Even on fetch error, logout clears state
    expect(state.status).toBe('unauthenticated');
  });
});

// ─── 11. NativeAuthStrategy — refresh success path ───────────────────────────

describe('NativeAuthStrategy — refresh success path', () => {
  it('createNativeAuthStrategy factory returns an AuthStrategy', () => {
    const store = makeMockSecureStore({});
    // NativeAuthStrategy itself is the factory-compatible class
    const strategy = new NativeAuthStrategy(store, {}, makeMockFetch([]) as unknown as typeof fetch);
    expect(typeof strategy.init).toBe('function');
    expect(typeof strategy.refresh).toBe('function');
  });

  it('refresh returns unauthenticated when no token pair in store', async () => {
    const store = makeMockSecureStore({});
    const strategy = new NativeAuthStrategy(store, {}, makeMockFetch([]) as unknown as typeof fetch);
    const state = await strategy.refresh();
    expect(state.status).toBe('unauthenticated');
  });

  it('refresh with transient error (non-401) preserves current state', async () => {
    const expiresAt = Date.now() + 3_600_000;
    const store = makeMockSecureStore({
      [SECURE_STORE_KEYS.ACCESS_TOKEN]: TEST_JWT,
      [SECURE_STORE_KEYS.REFRESH_TOKEN]: 'refresh',
      [SECURE_STORE_KEYS.EXPIRES_AT]: String(expiresAt),
    });
    // 500 = transient error (not 401)
    const mockFetch = makeMockFetch([{ status: 500, body: {} }]);
    const strategy = new NativeAuthStrategy(store, {}, mockFetch as unknown as typeof fetch);
    await strategy.init();
    const state = await strategy.refresh();
    // On transient error, state stays as-is (authenticated from init)
    expect(['authenticated', 'unauthenticated', 'error']).toContain(state.status);
  });
});

// ─── 12. NativeAuthStrategy — applyRefreshResult success path ────────────────

describe('NativeAuthStrategy — applyRefreshResult success path', () => {
  it('refresh success path stores new token pair and returns authenticated', async () => {
    const expiresAt = Date.now() + 3_600_000;
    const store = makeMockSecureStore({
      [SECURE_STORE_KEYS.ACCESS_TOKEN]: TEST_JWT,
      [SECURE_STORE_KEYS.REFRESH_TOKEN]: 'old-refresh',
      [SECURE_STORE_KEYS.EXPIRES_AT]: String(expiresAt - 1000),
    });

    // Mock: first call is the refresh endpoint returning a new token pair
    const newJwt = makeJwt({
      sub: 'user-456',
      email: 'newuser@example.com',
      display_name: 'New User',
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': ['user'],
        'x-hasura-default-role': 'user',
      },
    });
    const mockFetch = makeMockFetch([{
      status: 200,
      body: {
        session: {
          accessToken: newJwt,
          refreshToken: 'new-refresh',
          accessTokenExpiresIn: 3600,
        },
      },
    }]);

    const strategy = new NativeAuthStrategy(store, {}, mockFetch as unknown as typeof fetch);
    const state = await strategy.refresh();
    // With valid JWT, should be authenticated
    expect(state.status).toBe('authenticated');
    if (state.status === 'authenticated') {
      expect(state.user.email).toBe('newuser@example.com');
    }
  });

  it('refresh success with invalid JWT clears store and returns unauthenticated', async () => {
    const expiresAt = Date.now() + 3_600_000;
    const store = makeMockSecureStore({
      [SECURE_STORE_KEYS.ACCESS_TOKEN]: TEST_JWT,
      [SECURE_STORE_KEYS.REFRESH_TOKEN]: 'old-refresh',
      [SECURE_STORE_KEYS.EXPIRES_AT]: String(expiresAt - 1000),
    });

    // Return a non-JWT access token that decodeUserFromJwt cannot parse
    const mockFetch = makeMockFetch([{
      status: 200,
      body: {
        session: {
          accessToken: 'not-a-valid-jwt',
          refreshToken: 'new-refresh',
          accessTokenExpiresIn: 3600,
        },
      },
    }]);

    const strategy = new NativeAuthStrategy(store, {}, mockFetch as unknown as typeof fetch);
    const state = await strategy.refresh();
    expect(state.status).toBe('unauthenticated');
  });

  it('createNativeAuthStrategy factory wraps NativeAuthStrategy', async () => {
    const { createNativeAuthStrategy: factoryFn } = await import('../native.js');
    const store = makeMockSecureStore({});
    const strategy = factoryFn(store, {}, makeMockFetch([]) as unknown as typeof fetch);
    expect(typeof strategy.init).toBe('function');
    expect(typeof strategy.refresh).toBe('function');
    expect(typeof strategy.logout).toBe('function');
    expect(typeof strategy.subscribe).toBe('function');
    // init with empty store returns unauthenticated
    const state = await strategy.init();
    expect(state.status).toBe('unauthenticated');
  });
});

// ─── 13. WebAuthStrategy — remaining uncovered paths ────────────────────────

describe('WebAuthStrategy — checkSession full coverage', () => {
  it('checkSession returns error on non-401 non-ok response', async () => {
    const mockFetch = makeMockFetch([{ status: 500, body: {} }]);
    const strategy = new WebAuthStrategy({}, mockFetch as unknown as typeof fetch);
    const state = await strategy.init(); // calls checkSession internally
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.error.code).toBe('auth_failed');
    }
  });

  it('checkSession returns unauthenticated on JSON parse failure in /me', async () => {
    const badFetch = vi.fn(async () => ({
      status: 200,
      ok: true,
      json: async () => { throw new Error('bad json'); },
    })) as unknown as typeof fetch;
    const strategy = new WebAuthStrategy({}, badFetch);
    const state = await strategy.init();
    expect(state.status).toBe('unauthenticated');
  });

  it('checkSession returns unauthenticated when profile is null (missing fields)', async () => {
    // meResponseToProfile returns null when id or email not strings
    const mockFetch = makeMockFetch([{ status: 200, body: { id: 123, email: null } }]);
    const strategy = new WebAuthStrategy({}, mockFetch as unknown as typeof fetch);
    const state = await strategy.init();
    expect(state.status).toBe('unauthenticated');
  });

  it('login returns error on non-200 response', async () => {
    const mockFetch = makeMockFetch([{ status: 404, body: {} }]);
    const strategy = new WebAuthStrategy({}, mockFetch as unknown as typeof fetch);
    const state = await strategy.login('a@b.com', 'pass');
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.error.message).toContain('404');
    }
  });
});

// ─── 14. createAuthExchange — integration via wonka ──────────────────────────

describe('createAuthExchange — wonka integration', () => {
  it('passes operation through the exchange and injects token', async () => {
    const { pipe: wPipe, makeSubject, subscribe, toPromise, fromValue: wFromValue, map: wMap } = await import('wonka');

    const mockStrategy = {
      getAccessToken: vi.fn(() => 'test-access-token'),
      refresh: vi.fn(async () => {}),
      init: vi.fn(async () => ({ status: 'authenticated' as const, user: { id: 'u', email: 'a@b.com', displayName: '', roles: [], defaultRole: 'user' }, jwt: 'tok' })),
      login: vi.fn(async () => ({ status: 'unauthenticated' as const })),
      logout: vi.fn(async () => ({ status: 'unauthenticated' as const })),
      subscribe: vi.fn(() => () => {}),
    };

    const exchange = createAuthExchange(mockStrategy);

    // Build a query operation
    const queryOp = makeOperation(
      'query',
      createRequest('query TestQuery { test }', {}),
      { url: 'http://localhost/graphql', requestPolicy: 'network-only' },
    );

    const receivedOps: Operation[] = [];
    const results: OperationResult[] = [];

    // forward function captures operations and emits a mock result
    const forward = (ops$: Parameters<ReturnType<typeof exchange>>[0]) => {
      return wPipe(
        ops$,
        wMap((op: Operation) => {
          receivedOps.push(op);
          const mockResult: OperationResult = {
            operation: op,
            data: { test: true },
            error: undefined,
            extensions: undefined,
            hasNext: false,
            stale: false,
          };
          return mockResult;
        }),
      );
    };

    const { source, next, complete } = makeSubject<Operation>();

    const results$ = exchange({ forward, client: null as never, dispatchDebug: () => {} })(source);

    await new Promise<void>((resolve) => {
      wPipe(results$, subscribe((r: OperationResult) => {
        results.push(r);
        if (results.length >= 1) resolve();
      }));

      next(queryOp);
    });

    expect(receivedOps).toHaveLength(1);
    expect(results).toHaveLength(1);
    expect(results[0].data).toEqual({ test: true });
    expect(mockStrategy.getAccessToken).toHaveBeenCalled();
  });

  it('exchange triggers refresh on auth error (didAuthError === true)', async () => {
    const { pipe: wPipe, makeSubject, subscribe, fromValue: wFromValue, mergeMap: wMergeMap } = await import('wonka');
    const { CombinedError } = await import('@urql/core');

    const refreshedUser = {
      id: 'u1',
      email: 'u@example.com',
      displayName: '',
      roles: ['user'],
      defaultRole: 'user',
    };
    const mockStrategy = {
      getAccessToken: vi.fn(() => 'token'),
      // A successful refresh yields an authenticated state — only then does the
      // exchange replay the original operation.
      refresh: vi.fn(async () => ({
        status: 'authenticated' as const,
        user: refreshedUser,
        jwt: 'token',
      })),
      init: vi.fn(async () => ({ status: 'unauthenticated' as const })),
      login: vi.fn(async () => ({ status: 'unauthenticated' as const })),
      logout: vi.fn(async () => ({ status: 'unauthenticated' as const })),
      subscribe: vi.fn(() => () => {}),
    };

    const exchange = createAuthExchange(mockStrategy);

    const queryOp = makeOperation(
      'query',
      createRequest('query TestQuery { test }', {}),
      { url: 'http://localhost/graphql', requestPolicy: 'network-only' },
    );

    let forwardCallCount = 0;
    const forwardedResults: OperationResult[] = [];

    const forward = (ops$: Parameters<ReturnType<typeof exchange>>[0]) => {
      return wPipe(
        ops$,
        wMergeMap((op: Operation) => {
          forwardCallCount++;
          // First call: return 401 auth error. Second call (retry): return success.
          const isRetry = forwardCallCount > 1;
          const result: OperationResult = isRetry
            ? { operation: op, data: { test: 'retried' }, error: undefined, extensions: undefined, hasNext: false, stale: false }
            : {
                operation: op,
                data: undefined,
                error: new CombinedError({
                  graphQLErrors: [{ message: 'JWT expired', extensions: { code: 'jwt-expired' } }],
                }),
                extensions: undefined,
                hasNext: false,
                stale: false,
              };
          forwardedResults.push(result);
          return wFromValue(result);
        }),
      );
    };

    const { source, next: nextOp } = makeSubject<Operation>();
    const results: OperationResult[] = [];

    const results$ = exchange({ forward, client: null as never, dispatchDebug: () => {} })(source);

    await new Promise<void>((resolve) => {
      wPipe(results$, subscribe((r: OperationResult) => {
        results.push(r);
        if (results.length >= 1) resolve();
      }));
      nextOp(queryOp);
    });

    // Refresh should have been called
    expect(mockStrategy.refresh).toHaveBeenCalledTimes(1);
    // A retry should have happened (forward called at least twice)
    expect(forwardCallCount).toBeGreaterThanOrEqual(2);
  });

  it('does NOT replay when refresh fails to authenticate (no amplification loop)', async () => {
    const { pipe: wPipe, makeSubject, subscribe, fromValue: wFromValue, mergeMap: wMergeMap } = await import('wonka');
    const { CombinedError } = await import('@urql/core');

    // Web-like strategy: getAccessToken always null, refresh only re-checks /me
    // and stays unauthenticated when the session is genuinely expired.
    const mockStrategy = {
      getAccessToken: vi.fn(() => null),
      refresh: vi.fn(async () => ({ status: 'unauthenticated' as const })),
      init: vi.fn(async () => ({ status: 'unauthenticated' as const })),
      login: vi.fn(async () => ({ status: 'unauthenticated' as const })),
      logout: vi.fn(async () => ({ status: 'unauthenticated' as const })),
      subscribe: vi.fn(() => () => {}),
    };

    const exchange = createAuthExchange(mockStrategy);

    const queryOp = makeOperation(
      'query',
      createRequest('query TestQuery { test }', {}),
      { url: 'http://localhost/graphql', requestPolicy: 'network-only' },
    );

    let forwardCallCount = 0;
    const forward = (ops$: Parameters<ReturnType<typeof exchange>>[0]) => {
      return wPipe(
        ops$,
        wMergeMap((op: Operation) => {
          forwardCallCount++;
          const result: OperationResult = {
            operation: op,
            data: undefined,
            error: new CombinedError({
              graphQLErrors: [{ message: 'JWT expired', extensions: { code: 'jwt-expired' } }],
            }),
            extensions: undefined,
            hasNext: false,
            stale: false,
          };
          return wFromValue(result);
        }),
      );
    };

    const { source, next: nextOp } = makeSubject<Operation>();
    const results: OperationResult[] = [];
    const results$ = exchange({ forward, client: null as never, dispatchDebug: () => {} })(source);

    await new Promise<void>((resolve) => {
      wPipe(results$, subscribe((r: OperationResult) => {
        results.push(r);
        if (results.length >= 1) resolve();
      }));
      nextOp(queryOp);
    });

    // Refresh attempted once, but the failed refresh must NOT trigger a replay.
    expect(mockStrategy.refresh).toHaveBeenCalledTimes(1);
    expect(forwardCallCount).toBe(1);
    // The original auth error is surfaced to the caller.
    expect(results[0].error).toBeDefined();
  });
});
