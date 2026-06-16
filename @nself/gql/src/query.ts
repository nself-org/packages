/**
 * @nself/gql — typed query/mutate helpers (re-export shim).
 *
 * Purpose: Named exports for the query and mutate patterns so callers can
 *          import them directly without going through the client factory.
 *          Both are thin delegating wrappers over createNSelfClient methods;
 *          they exist to keep the public API surface explicit and discoverable.
 *
 * Inputs:  NSelfClientConfig (to build a one-off client) or an existing NSelfClient.
 * Outputs: Re-exports createNSelfClient and the NSelfClient interface; also
 *          exports wrappers for standalone usage.
 * Constraints:
 *   - All errors are wrapped in Result<T, AppError> — never throws.
 *   - Accepts TypedDocumentNode objects from @nself/gql/generated (codegen output).
 *   - Zero `any` — strict TypedDocumentNode generics propagate end-to-end.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/gql (client-implemented)
 */

// Re-export the factory and client interface as the primary query/mutate surface.
// Apps consume the client directly; this module exists so tree-shakers can import
// only what they need and so the public API is named explicitly.
export { createNSelfClient } from './client.js';
export type { NSelfClient } from './client.js';

// Re-export session header type for apps that need to read injected headers
// (e.g., integration tests that inspect outgoing requests).
export type { SessionHeaders, GetSessionFn, NSelfClientConfig } from './types.js';
