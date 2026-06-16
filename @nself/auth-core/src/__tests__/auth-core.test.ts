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
import { WebAuthStrategy } from '../web.js';
import { NativeAuthStrategy, SECURE_STORE_KEYS } from '../native.js';
import { createAuthExchange, didAuthError, addTokenToOperation } from '../exchange.js';
import type { OperationResult, Operation } from '@urql/core';

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

// ─── 6. createAuthExchange — factory returns an Exchange function ─────────────

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
