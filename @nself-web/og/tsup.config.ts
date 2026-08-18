import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.js' }
  },
  dts: {
    compilerOptions: {
      incremental: false,
      skipLibCheck: true,
    },
  },
  splitting: false,
  sourcemap: false,
  clean: true,
  external: ['react', 'react-dom', 'next'],
  treeshake: true,
  outDir: 'dist',
})
