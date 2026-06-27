/**
 * @nself/ntask-core — canonical ɳTask domain package.
 *
 * Purpose: Single source of truth for all domain types, GraphQL operation strings,
 *          Zod validation schemas, error utilities, mappers, and constants consumed
 *          by all 4 ɳTask surfaces (mobile, web, desktop, TV).
 * Outputs: ~45 named exports covering every entity in the np_* schema.
 * Constraints: No platform-specific deps (no MMKV, no Tauri, no RN APIs).
 *              Validation sub-path exported via @nself/ntask-core/validation.
 * SPORT: @nself/ntask-core (F13-CROSS-REPO-DEPS.md).
 */

// Domain types
export * from './types/index.js';

// Error utilities (includes re-exports from @nself/errors)
export * from './errors/index.js';

// GraphQL operation strings
export * from './operations/index.js';

// Mappers
export * from './mappers/index.js';

// Constants
export * from './constants/index.js';

// Validation — also available at @nself/ntask-core/validation
export * from './validation/index.js';
