import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // node environment for native-bridge tests (no DOM dependency)
    environment: 'node',
  },
});
