# @nself-web/og

Shared OG image generation for all nself.org subdomains.

Edge-runtime-safe (no Node-only APIs). Produces 1200×630 PNG images using `next/og` + satori with nSelf brand styling.

## Usage

```ts
// app/api/og/route.ts
import { generateOG } from '@nself-web/og'

export const runtime = 'edge'

export function GET(request: Request): Response {
  const { searchParams } = new URL(request.url)
  return generateOG({
    title: searchParams.get('title') ?? 'Default Title',
    breadcrumb: searchParams.get('breadcrumb') ?? '',
    variant: 'org', // 'org' | 'cloud' | 'nchat' | 'ntv'
    request,
  })
}
```

## Variants

| Variant | Product | Accent colour |
|---------|---------|--------------|
| `org`   | nself.org marketing | sky-500 `#0ea5e9` |
| `cloud` | cloud.nself.org | sky-500 `#0ea5e9` |
| `nchat` | chat.nself.org | indigo-500 |
| `ntv`   | ntv.nself.org | red-500 |

## OG URL parameters

| Param | Required | Description |
|-------|----------|-------------|
| `title` | No | Page title (truncated to 80 chars) |
| `breadcrumb` | No | Section path shown below title |
| `product` | No | Variant key (default: `org`) |

## API

### `generateOG(options: OGOptions): Response`

Primary public API. Returns a standard Web API Response with PNG body and 24 h cache headers.

### `OGOptions`

```ts
interface OGOptions {
  title: string
  breadcrumb?: string
  variant?: 'org' | 'cloud' | 'nchat' | 'ntv'
  request?: Request
}
```

### `buildOgResponse(request: Request): Response`

Legacy helper that parses query params from the request URL. Prefer `generateOG` for new routes.

## Adoption

| Subapp | Route | Status |
|--------|-------|--------|
| `web/org` | `/api/og` | Adopted (P103 S16) |

## Development

```bash
pnpm --filter @nself-web/og build   # tsup (esm + cjs + dts)
pnpm --filter @nself-web/og test    # vitest
pnpm --filter @nself-web/og type-check
```
