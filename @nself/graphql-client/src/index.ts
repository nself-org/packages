/**
 * @nself/graphql-client — public API entry point.
 *
 * Purpose: Re-export all public APIs for the nSelf urql-based GraphQL client layer.
 *          Apps import NselfGraphqlClient factory and use it to create a urql Client.
 *          Codegen output is available via the codegen/ sub-path.
 * Inputs:  None — pure re-exports.
 * Outputs: NselfGraphqlClient factory, config types, exchange utilities, error mapping.
 * Constraints: No React/RN/Tauri imports in this package.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/graphql-client (built)
 */

// Client factory
export { NselfGraphqlClient, HASURA_GRAPHQL_URL } from './client.js';
export type { NselfGraphqlClientConfig } from './client.js';

// Exchange utilities
export {
  makeErrorExchange,
  buildExchanges,
  combinedErrorToAppError,
  cacheExchange,
} from './exchanges.js';
export type { AuthExchangeFn, OnError } from './exchanges.js';

// Codegen output
export * from './codegen/index.js';
