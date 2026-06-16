import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/__tests__/**/*']
    }
  }
})
