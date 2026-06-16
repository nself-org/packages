/**
 * codegen/index.ts — re-export generated types and helpers.
 *
 * Purpose: Provide a stable import path for codegen output within the package.
 *          Apps import from @nself/graphql-client/codegen, not the generated/ subdir.
 * Inputs:  src/codegen/generated/index.ts (graphql-codegen output).
 * Outputs: Re-exports all generated scalars, types, and fragment helpers.
 * Constraints: Import path must stay './generated/index.js' — do not re-path.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/graphql-client (codegen)
 */

export * from './generated/index.js';
