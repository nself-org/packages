#!/usr/bin/env node
/**
 * check-schema.mjs — ship gate for the Hasura schema snapshot.
 *
 * Purpose: Fail the build/CI when src/codegen/schema.graphql is still the
 *          hand-written PLACEHOLDER (scalars + _health + _placeholder only).
 *          A real, codegen:live-pulled schema exposes np_ + auth tables and many
 *          operations; the placeholder gives consuming apps no compile-time
 *          GraphQL safety, so a release must not ship while it is in place.
 * Inputs:  src/codegen/schema.graphql (relative to package root).
 * Outputs: exit 0 when the schema looks real; exit 1 (with reason) otherwise.
 * Constraints: Pure Node, no deps — runs in any CI without install steps.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(here, '..', 'src', 'codegen', 'schema.graphql');

let sdl;
try {
  sdl = readFileSync(schemaPath, 'utf8');
} catch (err) {
  console.error(`[check-schema] cannot read ${schemaPath}: ${String(err)}`);
  process.exit(1);
}

// Strip comments and whitespace-only lines before inspecting type bodies.
const body = sdl
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('#'))
  .join('\n');

const isPlaceholder =
  body.includes('_placeholder') ||
  // A real schema has a query_root with far more than a lone _health field.
  /type\s+mutation_root\s*\{\s*_placeholder/.test(body) ||
  // Heuristic: the real nSelf schema references prefixed tables and many types.
  (!/\bnp_/.test(body) && (body.match(/^type\s+/gm)?.length ?? 0) <= 4);

if (isPlaceholder) {
  console.error(
    '[check-schema] FAIL: src/codegen/schema.graphql is still the placeholder skeleton.\n' +
      '  Run `pnpm --filter @nself/graphql-client codegen:live` against the real Hasura\n' +
      '  endpoint (HASURA_GRAPHQL_ADMIN_SECRET set) and commit the generated SDL before shipping.',
  );
  process.exit(1);
}

console.log('[check-schema] OK: schema snapshot looks like a real Hasura SDL.');
process.exit(0);
