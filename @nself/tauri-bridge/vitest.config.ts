import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // jsdom provides window / window.__TAURI__ for stub-mode tests.
    environment: 'jsdom',
  },
});
