/**
 * client.ts — NselfGraphqlClient factory for @nself/graphql-client.
 *
 * Purpose: Single canonical entry point for all nSelf GraphQL access via urql.
 *          Accepts an NselfClient config (from @nself/sdk-core) and an optional
 *          authExchange slot (wired by @nself/auth-core in W3). Returns a
 *          configured urql Client with the canonical exchange stack.
 * Inputs:  NselfGraphqlClientConfig — url (Hasura endpoint) + optional authExchangeFn
 *          + optional onError callback.
 * Outputs: urql Client instance ready for use in any React / RN / Tauri surface.
 * Constraints:
 *   - No singleton — callers create one client per surface.
 *   - No auth token injection here — that is auth-core's responsibility (W3).
 *   - url defaults to the canonical Hasura endpoint (api.nself.org/v1/graphql).
 *   - Framework-agnostic — no React/RN imports.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/graphql-client (NselfGraphqlClient)
 */

import { Client } from '@urql/core';
import type { AppError } from '@nself/errors';
import type { Operation } from '@urql/core';
import { buildExchanges, type AuthExchangeFn } from './exchanges.js';

// ─── Public constants ────────────────────────────────────────────────────────

/** Canonical Hasura GraphQL endpoint for nSelf production. */
export const HASURA_GRAPHQL_URL = 'https://api.nself.org/v1/graphql';

// ─── Config types ─────────────────────────────────────────────────────────────

/**
 * NselfGraphqlClientConfig — options accepted by NselfGraphqlClient factory.
 */
export interface NselfGraphqlClientConfig {
  /**
   * Hasura GraphQL endpoint URL.
   * Defaults to HASURA_GRAPHQL_URL ('https://api.nself.org/v1/graphql').
   */
  url?: string;

  /**
   * Optional auth exchange factory — provided by @nself/auth-core (W3).
   * When omitted, the client makes unauthenticated requests (role = anonymous).
   * Shape: (authExchangeApi) => Exchange — auth-core owns the full type.
   */
  authExchangeFn?: AuthExchangeFn;

  /**
   * Optional error callback — called on every operation result that has a
   * CombinedError, after mapping to AppError. Useful for Sentry / observability.
   */
  onError?: (error: AppError, operation: Operation) => void;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * NselfGraphqlClient — create a configured urql Client for nSelf GraphQL operations.
 *
 * Exchange stack (in order):
 *   cacheExchange → errorExchange → [authExchange?] → fetchExchange
 *
 * Usage:
 * ```ts
 * // Unauthenticated (anonymous role):
 * const client = NselfGraphqlClient();
 *
 * // With auth (W3 wires this in):
 * const client = NselfGraphqlClient({ authExchangeFn: makeAuthExchange(tokenFn) });
 *
 * // Custom endpoint (dev/staging):
 * const client = NselfGraphqlClient({ url: 'http://localhost:8080/v1/graphql' });
 * ```
 *
 * @param config  Optional NselfGraphqlClientConfig.
 * @returns       urql Client instance.
 */
export function NselfGraphqlClient(
  config: NselfGraphqlClientConfig = {},
): Client {
  const {
    url = HASURA_GRAPHQL_URL,
    authExchangeFn,
    onError,
  } = config;

  const exchanges = buildExchanges(authExchangeFn, onError);

  return new Client({ url, exchanges });
}
