/**
 * auth-graphql.test.ts — integration tests for @nself/auth-core + @nself/graphql-client.
 *
 * Purpose: Prove that createAuthExchange (auth-core) wires correctly into the
 *          NselfGraphqlClient (graphql-client) urql exchange stack end-to-end:
 *            1. Valid token  → query returns data.
 *            2. Hasura JWT_INVALID → authExchange refreshes the token EXACTLY ONCE
 *               and replays the original query → data (no infinite retry loop).
 *            3. Refresh endpoint 401 → AuthState transitions to unauthenticated and
 *               the original query is NOT replayed (no amplification loop).
 * Inputs:  A NativeAuthStrategy seeded via a mocked nHost sign-in, plus a single
 *          routed fetch mock that serves both the nHost auth endpoints and the
 *          Hasura GraphQL endpoint.
 * Outputs: Assertions on returned data, refresh-call count, and final AuthState.
 * Constraints: No msw dependency — a routed fetch stub gives deterministic control
 *              over refresh vs graphql traffic and lets us count refresh calls.
 * SPORT: F-MASTER.md — auth+graphql integration tests green (T-P3-E2-W3-S01-T02)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NselfGraphqlClient } from '@nself/graphql-client';
import { gql, type Client, type OperationResult, type AnyVariables } from '@urql/core';
import { createNativeAuthStrategy } from '../../native.js';
import { createAuthExchange } from '../../exchange.js';
import type { SecureStoreInterface } from '../../types.js';

const AUTH_BASE = 'https://api.nself.org/v1/auth';
const GRAPHQL_URL = 'https://api.nself.org/v1/graphql';
const TEST_QUERY = gql`
  query Me {
    me {
      id
    }
  }
`;

// ── In-memory SecureStore (canonical get/set/delete contract) ─────────────────
class MemoryStore implements SecureStoreInterface {
  private readonly map = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * makeJwt — build a minimally-valid JWT (header.payload.signature) carrying the
 * sub + email + Hasura claims that decodeUserFromJwt() requires, so a refreshed
 * native session resolves to `authenticated`.
 */
function makeJwt(sub = 'u1', email = 'u@example.com'): string {
  const b64url = (obj: unknown): string =>
    Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({
    sub,
    email,
    'https://hasura.io/jwt/claims': {
      'x-hasura-allowed-roles': ['user'],
      'x-hasura-default-role': 'user',
    },
  });
  return `${header}.${payload}.sig`;
}

/** A successful nHost sign-in payload. */
function signInBody(accessToken: string) {
  return {
    session: {
      accessToken,
      refreshToken: 'refresh-1',
      accessTokenExpiresIn: 3600,
      user: { id: 'u1', email: 'u@example.com', roles: ['user'], defaultRole: 'user' },
    },
  };
}

/** Hasura JWT_INVALID error payload (HTTP 200 with graphQLErrors, as Hasura sends). */
const JWT_INVALID_BODY = {
  errors: [{ message: 'Could not verify JWT', extensions: { code: 'invalid-jwt' } }],
};

const GRAPHQL_OK_BODY = { data: { me: { id: 'u1' } } };

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

/**
 * runQuery — subscribe to a network-only query and resolve on the first
 * non-stale result, then tear down. More robust than toPromise() across an
 * auth-exchange replay (the replayed stream stays open, so we take the first
 * settled result ourselves).
 */
function runQuery(client: Client): Promise<OperationResult> {
  return new Promise<OperationResult>((resolve) => {
    const { unsubscribe } = client
      .query(TEST_QUERY, {} as AnyVariables, { requestPolicy: 'network-only' })
      .subscribe((result) => {
        if (result.stale) return;
        resolve(result);
        // Defer unsubscribe so we don't tear down mid-emit.
        queueMicrotask(() => unsubscribe());
      });
  });
}

describe('@nself/auth-core ⇄ @nself/graphql-client integration', () => {
  let refreshCalls: number;

  beforeEach(() => {
    refreshCalls = 0;
  });

  it('Scenario 1: valid token → query returns data', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const url = urlOf(input);
      if (url.endsWith('/signin/email-password')) return jsonResponse(signInBody('jwt-good'));
      if (url === GRAPHQL_URL) return jsonResponse(GRAPHQL_OK_BODY);
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const strategy = createNativeAuthStrategy(
      new MemoryStore(),
      { authBaseUrl: AUTH_BASE },
      fetchMock as unknown as typeof fetch,
    );
    const loginState = await strategy.login('u@example.com', 'pw');
    expect(loginState.status).toBe('authenticated'); // assertion 1

    const client = NselfGraphqlClient({
      url: GRAPHQL_URL,
      authExchangeFn: createAuthExchange(strategy) as never,
    });

    const result = await runQuery(client);
    expect(result.error).toBeUndefined(); // assertion 2
    expect(result.data).toEqual({ me: { id: 'u1' } }); // assertion 3

    vi.unstubAllGlobals();
  });

  it('Scenario 2: JWT_INVALID → refresh exactly once → query retried → data', async () => {
    let graphqlCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const url = urlOf(input);
      if (url.endsWith('/signin/email-password')) return jsonResponse(signInBody('jwt-stale'));
      if (url.endsWith('/token/refresh')) {
        refreshCalls += 1;
        return jsonResponse({
          session: { accessToken: makeJwt(), refreshToken: 'refresh-2', accessTokenExpiresIn: 3600 },
        });
      }
      if (url === GRAPHQL_URL) {
        graphqlCalls += 1;
        // First graphql call → JWT_INVALID; after refresh → success.
        return jsonResponse(graphqlCalls === 1 ? JWT_INVALID_BODY : GRAPHQL_OK_BODY);
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const strategy = createNativeAuthStrategy(
      new MemoryStore(),
      { authBaseUrl: AUTH_BASE },
      fetchMock as unknown as typeof fetch,
    );
    await strategy.login('u@example.com', 'pw');

    const client = NselfGraphqlClient({
      url: GRAPHQL_URL,
      authExchangeFn: createAuthExchange(strategy) as never,
    });

    const result = await runQuery(client);

    expect(result.error).toBeUndefined(); // assertion 4
    expect(result.data).toEqual({ me: { id: 'u1' } }); // assertion 5
    // CR-B: refresh must be called EXACTLY once — never an infinite loop.
    expect(refreshCalls).toBe(1); // assertion 6
    expect(graphqlCalls).toBe(2); // original + single replay — assertion 7

    vi.unstubAllGlobals();
  });

  it('Scenario 3: refresh 401 → unauthenticated, query not replayed', async () => {
    let graphqlCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const url = urlOf(input);
      if (url.endsWith('/signin/email-password')) return jsonResponse(signInBody('jwt-stale'));
      if (url.endsWith('/token/refresh')) {
        refreshCalls += 1;
        return jsonResponse({ error: 'token expired' }, 401);
      }
      if (url === GRAPHQL_URL) {
        graphqlCalls += 1;
        return jsonResponse(JWT_INVALID_BODY);
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const strategy = createNativeAuthStrategy(
      new MemoryStore(),
      { authBaseUrl: AUTH_BASE },
      fetchMock as unknown as typeof fetch,
    );
    await strategy.login('u@example.com', 'pw');

    let finalState = strategy.getAccessToken();
    const unsub = strategy.subscribe(() => {
      finalState = strategy.getAccessToken();
    });

    const client = NselfGraphqlClient({
      url: GRAPHQL_URL,
      authExchangeFn: createAuthExchange(strategy) as never,
    });

    const result = await runQuery(client);

    // Refresh attempted once and failed → original auth error surfaced, no replay.
    expect(refreshCalls).toBe(1); // assertion 8
    expect(graphqlCalls).toBe(1); // assertion 9 — NOT replayed
    expect(result.error).toBeDefined(); // assertion 10
    // Strategy fell back to unauthenticated (token cleared).
    expect(finalState).toBeNull(); // assertion 11

    unsub();
    vi.unstubAllGlobals();
  });
});
