# @nself/tsconfig

Canonical strict TypeScript base configs for every nSelf surface. Repos **extend** these instead of hand-rolling `compilerOptions`, so the strict-mode guarantee lives in one place and cannot silently diverge.

## Configs

| Entry | Use for |
|---|---|
| `@nself/tsconfig/base` | Foundation — strict + `noUncheckedIndexedAccess` + `noImplicitReturns` + `exactOptionalPropertyTypes` + `verbatimModuleSyntax`. No lib/jsx. |
| `@nself/tsconfig/react` | React / Vite / React Native surfaces — base + DOM lib + `react-jsx`. |
| `@nself/tsconfig/node` | Node / server surfaces — base + `@types/node`, no DOM. |

## Usage

```jsonc
// a repo's tsconfig.json
{
  "extends": "@nself/tsconfig/react",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Add `@nself/tsconfig` as a dev dependency (`workspace:*` inside this monorepo). Do not copy the flags into the repo's own `compilerOptions` — drift from this base is a build/CI error.
