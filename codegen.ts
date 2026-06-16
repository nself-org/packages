/**
 * GraphQL Code Generator configuration
 *
 * Purpose: Turn the Hasura GraphQL schema into typed TypeScript operations for
 * every app surface. Uses client-preset for typed documents + typed helpers.
 *
 * Schema source: @nself/graphql-client/src/codegen/schema.graphql (committed snapshot).
 *               No live endpoint required — codegen works offline and in CI.
 *               To refresh the snapshot from the live endpoint, run:
 *                 HASURA_GRAPHQL_ADMIN_SECRET=<secret> pnpm codegen:live
 *
 * Output:  @nself/graphql-client/src/codegen/generated/
 *
 * Run:     pnpm codegen
 * CI:      pnpm codegen:check
 *
 * Constraints:
 *   - Schema is a committed SDL file — no network dependency during codegen.
 *   - documents glob is scoped to packages only — never node_modules.
 *   - ignoreNoDocuments: true — pipeline is green before any .graphql op files exist.
 *   - Fragment masking uses getFragmentData unmask helper.
 */

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Use committed schema snapshot — works offline and in CI without admin-secret.
  schema: './@nself/graphql-client/src/codegen/schema.graphql',

  // Scoped glob — never use **/*.graphql (would pull node_modules / sub-repo output)
  documents: ['@nself/**/*.graphql', '!@nself/graphql-client/src/codegen/schema.graphql'],

  // Prevent codegen from erroring when no .graphql operation files exist yet.
  ignoreNoDocuments: true,

  generates: {
    './@nself/graphql-client/src/codegen/generated/': {
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
