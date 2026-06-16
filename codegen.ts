/**
 * GraphQL Code Generator configuration
 *
 * Purpose: Turn the Hasura GraphQL schema into typed TypeScript operations for
 * every app surface. Uses client-preset for typed documents + typed hooks/fetchers.
 *
 * Schema source: Hasura introspection endpoint (env: HASURA_GRAPHQL_URL).
 * Auth:          Admin secret (env: HASURA_GRAPHQL_ADMIN_SECRET) — codegen-only,
 *                never used at runtime by app clients.
 * Output:        packages/@nself/gql/src/generated/
 *
 * Run:           pnpm codegen
 * CI check:      pnpm codegen:check
 *
 * Constraints:
 *   - HASURA_GRAPHQL_URL must be set in env (defaults to localhost:8080 for local dev).
 *   - HASURA_GRAPHQL_ADMIN_SECRET must be set (empty string fallback is safe — codegen
 *     will fail with an auth error from Hasura, not silently generate wrong types).
 *   - documents glob is scoped to apps/**\/\*.graphql and packages/**\/\*.graphql —
 *     NOT **\/\*.graphql — to prevent pulling from node_modules or sub-repo codegen files.
 *   - Fragment masking uses getFragmentData unmask helper — consuming apps must use
 *     the helper rather than accessing masked fragment data directly.
 */

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: {
    [process.env.HASURA_GRAPHQL_URL ?? 'http://localhost:8080/v1/graphql']: {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET ?? '',
      },
    },
  },
  // Scoped glob — never use **/*.graphql (would pull node_modules / sub-repo output)
  documents: ['apps/**/*.graphql', 'packages/**/*.graphql'],
  // Prevent codegen from erroring when no .graphql operation files exist yet.
  // Per-app operations land in E2/E3; the pipeline must be green from day one.
  ignoreNoDocuments: true,
  generates: {
    './@nself/gql/src/generated/': {
      preset: 'client',
      presetConfig: {
        // Require getFragmentData() helper for masked fragments — prevents accidental
        // direct access to masked fragment data in consuming apps.
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
    },
  },
};

export default config;
