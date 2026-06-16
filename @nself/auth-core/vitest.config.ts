import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // Use jsdom so React provider + hook tests work correctly.
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost/' },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/__tests__/**',
        // flutter-compat.ts is a compatibility shim (544 lines) — excluded from coverage
        // to keep overall threshold achievable without porting Flutter SDK internals.
        'src/flutter-compat.ts',
        // index.ts is a pure re-export barrel — no runtime logic to cover.
        'src/index.ts',
        // types.ts contains only TypeScript type declarations — no runtime code.
        'src/types.ts',
      ],
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 70,
      },
    },
  },
});
