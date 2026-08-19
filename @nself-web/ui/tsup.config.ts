import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: {
    compilerOptions: {
      incremental: false,
    },
  },
  splitting: false,
  sourcemap: false,
  clean: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
  treeshake: true,
  outDir: "dist",
  tsconfig: "tsconfig.build.json",
  // Use the React 18 automatic JSX runtime so bundled components don't need
  // `React` in scope. Without this, esbuild emits `React.createElement` calls
  // but the variable it binds React to gets renamed (e.g. React9), causing
  // "React is not defined" at runtime in Next.js App Router.
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  // Required for Next.js App Router: mark all exports as client components.
  // The shared UI package contains client components (useState, useEffect hooks).
  // Without this directive, Next.js throws "You're importing a component that
  // needs useState. This React Hook only works in a Client Component."
  banner: {
    js: "'use client';",
  },
});
