/**
 * Vitest configuration for @nself/offline-queue.
 *
 * Purpose: Configure test environment for offline queue adapters.
 *          Uses jsdom so TauriFsAdapter tests can set/delete window.__TAURI__,
 *          and IndexedDB tests are polyfilled via fake-indexeddb.
 *          The js-to-ts-in-src plugin remaps .js imports to .ts so vitest
 *          instruments TypeScript source rather than compiled output.
 * Constraints: environment is 'jsdom' to provide window for Tauri guard checks.
 *              fake-indexeddb patches the global indexedDB in individual test files.
 * SPORT: Part of @nself/offline-queue package.
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'js-to-ts-in-src',
      enforce: 'pre',
      resolveId(id: string, importer: string | undefined) {
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
    environment: 'jsdom',
  },
});
