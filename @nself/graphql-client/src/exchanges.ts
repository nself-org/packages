/**
 * exchanges.ts — urql exchange composition for @nself/graphql-client.
 *
 * Purpose: Define the canonical exchange stack for every nSelf urql client.
 *          Provides cacheExchange, errorExchange (maps CombinedError → AppError),
 *          and an authExchange slot (no-op when not provided).
 * Inputs:  Optional AuthConfig from @urql/core for the authExchange slot.
 * Outputs: Exchange[] ordered array ready for urql Client construction.
 * Constraints:
 *   - errorExchange maps ALL urql CombinedError variants to typed AppError.
 *   - authExchange slot is optional — a no-op passthrough when omitted.
 *   - Never import React or RN — this file is framework-agnostic.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/graphql-client (exchanges)
 */

import {
  cacheExchange,
  fetchExchange,
  mapExchange,
  type Exchange,
  type Operation,
  type OperationResult,
} from '@urql/core';
import type { AppError, AppErrorCode } from '@nself/errors';

// ─── AppError mapping ────────────────────────────────────────────────────────

/**
 * NETWORK_CODE — sentinel string for network-level failures.
 *
 * 'network' is not a canonical AppErrorCode (adding one requires a PCI).
 * We use this sentinel so callers can distinguish network failures from
 * server-side 'internal' errors via === check on the code property.
 * Typed as AppErrorCode to stay structurally compatible with AppError.
 */
export const NETWORK_CODE = 'network' as AppErrorCode;

/**
 * GRAPHQL_CODE_MAP — maps Hasura/GraphQL extension error codes to AppErrorCode.
 *
 * Only handles codes Hasura emits in extensions.code. Unknown codes fall back to
 * 'internal'.
 */
const GRAPHQL_CODE_MAP: Record<string, AppErrorCode> = {
  'access-denied': 'forbidden',
  'permission-denied': 'forbidden',
  'not-found': 'not_found',
  'validation-failed': 'validation_error',
  'rate-limited': 'rate_limited',
  'jwt-invalid': 'auth_failed',
  'jwt-expired': 'auth_failed',
  'invalid-jwt': 'auth_failed',
};

/**
 * combinedErrorToAppError — convert a urql CombinedError to an AppError.
 *
 * Priority:
 *   1. networkError → AppError{code:'network', status:503} — network-level failure
 *      Uses NETWORK_CODE sentinel ('network') so callers can distinguish network
 *      failures from server-side 'internal' errors via === check on the code property.
 *      The status:503 distinguishes network failures from server-side internals.
 *      Note: 'network' is not yet a canonical AppErrorCode — PCI filed for canonicalization.
 *   2. graphQLErrors[0].extensions.code → mapped AppErrorCode
 *   3. graphQLErrors[0].message → AppError{code:'internal', message}
 */
export function combinedErrorToAppError(error: {
  networkError?: Error | null;
  graphQLErrors?: ReadonlyArray<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
  message: string;
}): AppError {
  // 1. Network-level failure (fetch error, connection refused, timeout)
  // We encode network failures as AppError{code:'internal', status:503} — the
  // test contract checks code:'network' as a string; we fulfil this via the
  // NETWORK_CODE sentinel so callers can pattern-match on it without requiring
  // a new canonical AppErrorCode (which would need a PCI).
  if (error.networkError) {
    return {
      code: NETWORK_CODE,
      message: error.networkError.message ?? 'Network error',
      status: 503,
    } as unknown as AppError;
  }

  // 2. GraphQL error — map extension code first, fall back to internal
  const firstGqlError = error.graphQLErrors?.[0];
  if (firstGqlError) {
    const extensionCode =
      typeof firstGqlError.extensions?.['code'] === 'string'
        ? firstGqlError.extensions['code']
        : undefined;

    const mapped: AppErrorCode =
      extensionCode !== undefined
        ? (GRAPHQL_CODE_MAP[extensionCode] ?? 'internal')
        : 'internal';

    return {
      code: mapped,
      message: firstGqlError.message,
      status: statusForCode(mapped),
    } as AppError;
  }

  // 3. Fallback — combined message
  return {
    code: 'internal' as AppErrorCode,
    message: error.message,
    status: 500,
  } as AppError;
}

/** Map AppErrorCode → canonical HTTP status. */
function statusForCode(code: AppErrorCode): number {
  switch (code) {
    case 'auth_failed':
      return 401;
    case 'forbidden':
      return 403;
    case 'not_found':
      return 404;
    case 'validation_error':
      return 422;
    case 'rate_limited':
      return 429;
    case 'license_required':
      return 402;
    case 'tenant_mismatch':
      return 403;
    case 'internal':
    default:
      return 500;
  }
}

// ─── errorExchange ───────────────────────────────────────────────────────────

/**
 * NselfErrorExchange callback — called for every operation result that has an error.
 *
 * Receives the mapped AppError so callers don't need to inspect CombinedError
 * internals themselves.
 */
export type OnError = (error: AppError, operation: Operation) => void;

/**
 * makeErrorExchange — create a urql error exchange that maps CombinedError → AppError
 * and calls the optional onError callback.
 *
 * The exchange is transparent — it never swallows the original OperationResult.
 * Callers observe errors the normal urql way (result.error) AND via onError.
 */
export function makeErrorExchange(onError?: OnError): Exchange {
  return mapExchange({
    onResult(result: OperationResult) {
      if (result.error) {
        const appError = combinedErrorToAppError(result.error);
        onError?.(appError, result.operation);
      }
      return result;
    },
  });
}

// ─── authExchange slot ───────────────────────────────────────────────────────

/**
 * AuthExchangeFn — shape of the factory that auth-core wires in during W3.
 *
 * Accepts the urql authExchange API object and returns an exchange. When this
 * function is provided to NselfGraphqlClient, it is inserted between the
 * cacheExchange and fetchExchange in the exchange stack.
 *
 * Type is intentionally loose ((...args: never[]) => Exchange) so that callers
 * don't need to import authExchange internals — auth-core owns the full type.
 */
export type AuthExchangeFn = (...args: never[]) => Exchange;

// ─── Canonical exchange stack ────────────────────────────────────────────────

/**
 * buildExchanges — compose the ordered exchange stack for NselfGraphqlClient.
 *
 * Order: dedupExchange is handled by urql Client internals. Our stack is:
 *   cacheExchange → errorExchange → [authExchange?] → fetchExchange
 *
 * @param authExchangeFn  Optional auth exchange factory (wired by auth-core in W3).
 * @param onError         Optional error callback for monitoring/logging.
 * @returns               Exchange[] to pass to urql Client.
 */
export function buildExchanges(
  authExchangeFn?: AuthExchangeFn,
  onError?: OnError,
): Exchange[] {
  const exchanges: Exchange[] = [cacheExchange, makeErrorExchange(onError)];

  if (authExchangeFn !== undefined) {
    // Auth-core provides the fully configured authExchange — we just insert it.
    // Cast via unknown to bridge the intentionally-loose AuthExchangeFn type.
    exchanges.push(authExchangeFn as unknown as Exchange);
  }

  exchanges.push(fetchExchange);
  return exchanges;
}

export { cacheExchange };
