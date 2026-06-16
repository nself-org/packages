/**
 * Vitest configuration for @nself/errors.
 *
 * Purpose: Configure coverage provider and enforce >= 90% line coverage threshold.
 * Constraints: Package has pre-compiled .js co-located with .ts in src/.
 *   Use resolveId plugin to remap .js imports to .ts so v8 instruments TS source.
 *   types.ts is excluded — it contains only TypeScript type declarations (no runtime code).
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/errors (tests)
 */
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'js-to-ts-in-src',
      enforce: 'pre',
      resolveId(id, importer) {
        if (!importer) return undefined;
        if ((id.startsWith('./') || id.startsWith('../')) && id.endsWith('.js')) {
          const dir = path.dirname(importer);
          const tsPath = path.resolve(dir, id.replace(/\.js$/, '.ts'));
          return tsPath;
        }
        return undefined;
      },
    },
  ],
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.d.ts',
        'src/**/*.d.ts.map',
        'src/**/*.js',
        'src/**/*.js.map',
        // types.ts contains only TypeScript type declarations — no runtime code to cover
        'src/types.ts',
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 80,
      },
    },
  },
});
