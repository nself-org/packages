/**
 * @nself/gql — package entry point.
 *
 * Purpose: Single import path for all nSelf apps consuming the thin GraphQL client.
 *          Re-exports the client factory, all config/session types, and generated
 *          types so consumers always import from '@nself/gql' without reaching
 *          into sub-paths.
 *
 * Usage:
 * ```ts
 * import { createNSelfClient } from '@nself/gql';
 * import type { NSelfClient, NSelfClientConfig, GetSessionFn } from '@nself/gql';
 * ```
 *
 * Codegen'd operation types (TypedDocumentNode) are populated by `pnpm codegen`
 * and re-exported via './generated/index.js' below.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/gql (client-implemented)
 */

// ── Client factory + interface ────────────────────────────────────────────────
export { createNSelfClient } from './client.js';
export type { NSelfClient } from './client.js';

// ── Config + session types ────────────────────────────────────────────────────
export type {
  NSelfClientConfig,
  GetSessionFn,
  SessionHeaders,
} from './types.js';

// ── Generated GraphQL types (populated by `pnpm codegen`) ────────────────────
// Re-export all generated types, document nodes, and helpers.
// This module is empty until `pnpm codegen` is run against a live Hasura instance.
export * from './generated/index.js';
