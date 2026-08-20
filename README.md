# @nself packages

Shared TypeScript libraries for the [nSelf](https://nself.org) apps — ɳTask,
ɳChat, ɳTV, ɳFamily, ɳSentry and ClawDE.

These live here rather than inside any one product so every app can depend on
them without depending on each other, and so a self-hosted install of an app
(the free **Task Bundle**, for example) can be built from public sources alone.

## Layout

```
@nself/       core libraries shared by every surface — web, mobile, desktop, TV
@nself-web/   web-only libraries: UI components, CSP policy, OG image generation
```

## Using them

Consumers resolve these through a pnpm workspace pointing at a sibling
checkout:

```yaml
# pnpm-workspace.yaml
packages:
  - '../packages/@nself/*'
  - '../packages/@nself-web/*'
```

Clone this repository next to the app repository:

```
parent/
├── packages/   this repo
└── ntask/      the app
```

## Working here

```bash
pnpm install
pnpm -r build
pnpm -r test
pnpm typecheck
```

Every package is strict TypeScript. `exactOptionalPropertyTypes` and
`noUncheckedIndexedAccess` are on, and test files are type-checked, so an
optional property must be absent rather than explicitly `undefined`.

## Licence

MIT — see [LICENSE](LICENSE).
