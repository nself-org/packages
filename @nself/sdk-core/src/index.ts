/**
 * @nself/sdk-core — base SDK thin-client entry point.
 *
 * Purpose: Re-export all public APIs for the nSelf base SDK layer.
 *          Higher-level packages (@nself/graphql-client, @nself/auth-core)
 *          import from here; app code instantiates NselfClient and passes it in.
 * Inputs:  None — pure re-exports.
 * Outputs: NselfClient class, config types, env utilities, URL helpers, baseFetch.
 * Constraints: No React/RN/Tauri imports in this package.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/sdk-core
 */

// Client
export { NselfClient } from './client.js';
export type { NselfClientConfig, ResolvedNselfClientConfig } from './client.js';

// Environment detection
export {
  detectEnvironment,
  isBrowser,
  isDesktop,
  isNative,
  isServer,
} from './env.js';
export type { NselfEnvironment } from './env.js';

// URL resolution
export {
  PROD_API_URL,
  STAGING_API_URL,
  resolveApiUrl,
  resolveStagingUrl,
} from './urls.js';

// Base fetch
export { baseFetch } from './fetch.js';
export type { BaseFetchOptions } from './fetch.js';

// Re-export @nself/errors for convenience — callers shouldn't need to import both
export type { AppError, AppErrorCode, Result, Ok, Err } from '@nself/errors';
export {
  err,
  ok,
  isOk,
  isErr,
  mapResult,
  chainResult,
  getOrElse,
  match,
} from '@nself/errors';
