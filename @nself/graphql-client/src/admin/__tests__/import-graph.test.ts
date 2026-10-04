/**
 * Import-graph guard for @nself/graphql-client/admin (P7-ADOPT-09, review F26).
 *
 * Walks every relative import or export specifier reachable from src/index.ts
 * and asserts none resolves to a file under src/admin, so the package root `.`
 * can never pull the admin client (and its secret handling) into a browser
 * bundle by accident.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ADMIN = join(SRC, 'admin') + sep;

/** Relative specifiers from `import|export ... from`, side-effect imports and import(). */
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"](\.{1,2}\/[^'"]+)['"]/g;

function resolveSpecifier(fromFile: string, spec: string): string | undefined {
  const base = resolve(dirname(fromFile), spec.replace(/\.js$/, ''));
  const candidates = [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')];
  return candidates.find((c) => existsSync(c));
}

function reachableFrom(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const m of readFileSync(file, 'utf8').matchAll(SPECIFIER)) {
      const target = resolveSpecifier(file, m[1] as string);
      if (target !== undefined) queue.push(target);
    }
  }
  return seen;
}

describe('package root import graph', () => {
  const graph = reachableFrom(join(SRC, 'index.ts'));

  it('walks the real graph (sanity)', () => {
    expect(graph.has(join(SRC, 'client.ts'))).toBe(true);
    expect(graph.has(join(SRC, 'exchanges.ts'))).toBe(true);
  });

  it('reaches no file under src/admin', () => {
    const leaked = [...graph].filter((f) => f.startsWith(ADMIN));
    expect(leaked).toEqual([]);
  });

  it('would detect a path into src/admin (walker self-check)', () => {
    const fromAdmin = reachableFrom(join(SRC, 'admin', 'index.ts'));
    expect([...fromAdmin].some((f) => f.startsWith(ADMIN))).toBe(true);
    expect(fromAdmin.has(join(SRC, 'exchanges.ts'))).toBe(true);
  });
});
