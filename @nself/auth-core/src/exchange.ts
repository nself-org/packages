/**
 * exchange.ts — urql authExchange factory for @nself/auth-core.
 *
 * Purpose: Create a urql Exchange that wires an AuthStrategy into the graphql-client
 *          exchange stack. Implements the standard auth exchange pattern:
 *          getAuth (get current token), addAuthToOperation (inject header),
 *          didAuthError (detect 401/JWT_INVALID), refreshAuth (call strategy.refresh()).
 * Inputs:  AuthStrategy (from web.ts or native.ts).
 * Outputs: Exchange — pass directly to NselfGraphqlClient.authExchangeFn.
 * Constraints:
 *   - NEVER log accessToken — it passes through headers but must not appear in logs.
 *   - didAuthError detects Hasura JWT_INVALID in graphQLErrors extensions.code.
 *   - refreshAuth calls strategy.refresh() exactly once — no retry loop.
 *   - Uses @urql/core primitives only — no @urql/exchange-auth dependency.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/auth-core (authExchange)
 */

import {
  makeOperation,
  type Exchange,
  type Operation,
  type OperationResult,
} from '@urql/core';
import { pipe, mergeMap, filter, fromPromise, fromValue, merge, makeSubject, share } from 'wonka';
import type { AuthStrategy } from './types.js';

// ─── Hasura error codes that indicate JWT expiry or invalidity ────────────────

const JWT_INVALID_CODES = new Set([
  'invalid-jwt',
  'jwt-invalid',
  'jwt-expired',
  'JWT_INVALID',
  'JWT_EXPIRED',
  'invalid-headers',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * addTokenToOperation — inject Authorization: Bearer <token> into an operation.
 *
 * Returns a new Operation with the header added. If token is null, returns the
 * operation unchanged (unauthenticated request — Hasura uses anonymous role).
 */
function addTokenToOperation(operation: Operation, token: string | null): Operation {
  if (!token) return operation;
  return makeOperation(operation.kind, operation, {
    ...operation.context,
    fetchOptions: () => {
      const opts =
        typeof operation.context.fetchOptions === 'function'
          ? operation.context.fetchOptions()
          : (operation.context.fetchOptions ?? {});
      return {
        ...opts,
        headers: {
          ...(opts.headers as Record<string, string> | undefined),
          Authorization: `Bearer ${token}`,
        },
      };
    },
  });
}

/**
 * didAuthError — detect whether an OperationResult is a Hasura JWT error.
 *
 * Checks both:
 *   1. HTTP 401 in networkError
 *   2. Hasura JWT_INVALID in graphQLErrors[*].extensions.code
 */
function didAuthError(result: OperationResult): boolean {
  if (result.error?.networkError) {
    const ne = result.error.networkError as { status?: number; statusCode?: number };
    if (ne.status === 401 || ne.statusCode === 401) return true;
  }
  if (result.error?.graphQLErrors) {
    for (const err of result.error.graphQLErrors) {
      const code = (err.extensions as Record<string, unknown> | undefined)?.['code'];
      if (typeof code === 'string' && JWT_INVALID_CODES.has(code)) return true;
    }
  }
  return false;
}

// ─── createAuthExchange ───────────────────────────────────────────────────────

/**
 * createAuthExchange — factory that returns a urql Exchange for nSelf auth.
 *
 * The returned Exchange:
 *   1. Gets the current access token from the strategy on each operation.
 *   2. Injects it as Authorization: Bearer <token> (skipped for web strategy
 *      where getAccessToken() returns null — cookie is used instead).
 *   3. Detects Hasura JWT_INVALID errors in operation results.
 *   4. Calls strategy.refresh() once on auth error, then replays the operation.
 *
 * Usage:
 * ```ts
 * const client = NselfGraphqlClient({
 *   authExchangeFn: createAuthExchange(strategy),
 * });
 * ```
 *
 * @param strategy  AuthStrategy instance (web or native).
 * @returns         Exchange to pass as authExchangeFn.
 */
export function createAuthExchange(strategy: AuthStrategy): Exchange {
  return ({ forward }) => {
    return (operations$) => {
      // Track whether we're currently refreshing to avoid concurrent refresh races.
      // refreshPromise resolves to whether refresh produced a usable (authenticated)
      // session — a replay is only re-dispatched when it did.
      let isRefreshing = false;
      let refreshPromise: Promise<boolean> | null = null;

      // Retried operations are fed back into the SINGLE forward stream below
      // (urql requires forward() be called exactly once per exchange — re-calling
      // it would open a second downstream subscription and silently drop replays).
      const retries = makeSubject<Operation>();

      const withAuth = pipe(
        merge([operations$, retries.source]),
        mergeMap((operation: Operation) => {
          // If a refresh is in progress, wait for it before sending the operation.
          if (isRefreshing && refreshPromise) {
            return fromPromise(
              refreshPromise.then(() => {
                const token = strategy.getAccessToken();
                return addTokenToOperation(operation, token);
              }),
            );
          }
          const token = strategy.getAccessToken();
          return fromValue(addTokenToOperation(operation, token));
        }),
      );

      const results$ = pipe(forward(withAuth), share);

      return pipe(
        results$,
        mergeMap((result: OperationResult) => {
          if (!didAuthError(result)) {
            return fromValue(result);
          }

          // Auth error detected — refresh once, then replay only if it worked.
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = strategy
              .refresh()
              .then((state) => state.status === 'authenticated')
              .catch(() => false)
              .finally(() => {
                isRefreshing = false;
                refreshPromise = null;
              });
          }

          return pipe(
            fromPromise(refreshPromise ?? Promise.resolve(false)),
            // If refresh did not yield an authenticated session, do NOT replay —
            // surface the original auth error so the caller sees it (prevents the
            // 401 -> refresh -> identical 401 amplification loop, esp. on web
            // where getAccessToken() is always null and refresh only re-reads /me).
            mergeMap((refreshed: boolean) => {
              if (!refreshed) {
                return fromValue(result);
              }
              // Re-dispatch the original operation through the single forward
              // stream (it picks up the freshly-refreshed token via withAuth).
              retries.next(result.operation);
              // Swallow the auth-error result — the replayed operation's result
              // will be emitted by results$ instead.
              return pipe(
                fromValue(result),
                filter(() => false),
              );
            }),
          );
        }),
      );
    };
  };
}

// ─── AuthExchangeConfig (for documentation) ───────────────────────────────────

/**
 * AuthExchangeConfig — documents the four logical methods of the auth exchange pattern.
 *
 * These are implemented inline in createAuthExchange rather than as explicit callbacks
 * (since @urql/exchange-auth is not a dependency). Named here for CR documentation
 * and acceptance criterion traceability.
 */
export interface AuthExchangeConfig {
  /**
   * getAuth — get the current access token from the strategy.
   * Implemented: strategy.getAccessToken() called per-operation.
   */
  getAuth: () => string | null;
  /**
   * addAuthToOperation — inject Authorization header.
   * Implemented: addTokenToOperation() injects Bearer token if non-null.
   */
  addAuthToOperation: (operation: Operation, token: string | null) => Operation;
  /**
   * didAuthError — detect Hasura JWT_INVALID in operation results.
   * Implemented: checks networkError 401 + graphQLErrors extensions.code.
   */
  didAuthError: (result: OperationResult) => boolean;
  /**
   * refreshAuth — call strategy.refresh() on auth error.
   * Implemented: single-shot, no retry loop; resolves before replay.
   */
  refreshAuth: () => Promise<void>;
}

// Export utility for tests
export { addTokenToOperation, didAuthError };
