import { ImageResponse } from '@vercel/og'
import { createElement } from 'react'
import { OgTemplate } from './template'
import { getProductConfig } from './colors'

export const runtime = 'edge'

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const CACHE_SECONDS = 86400  // 24 h

export function buildOgResponse(request: Request): Response {
  const { searchParams } = new URL(request.url)

  const title = searchParams.get('title') || 'Self-Hosted Backend Infrastructure'
  const breadcrumb = searchParams.get('breadcrumb') || ''
  const product = searchParams.get('product') || 'org'

  const config = getProductConfig(product)

  // Cast needed: @vercel/og ships React 18 @types/react; workspace devDeps are React 19.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(OgTemplate, { title, breadcrumb, config }) as any

  // @vercel/og's ImageResponse implements the Response interface at runtime
  // (via internal Proxy) but its .d.ts does not declare body/status/headers —
  // cast through Response so callers get standard Web API types.
  const image = new ImageResponse(
    element,
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
    }
  ) as unknown as Response

  // Clone and add cache headers — ImageResponse itself is immutable
  const headers = new Headers(image.headers)
  headers.set(
    'Cache-Control',
    `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`
  )

  return new Response(image.body, {
    status: image.status,
    headers,
  })
}
