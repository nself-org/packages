/**
 * @nself-web/og — generateOG
 *
 * Edge-runtime-safe OG image generation. Wraps `@vercel/og` ImageResponse with
 * nSelf brand styling via {@link OgTemplate}. Exported as the primary public
 * API for all nSelf web subapps.
 *
 * Usage:
 *   export const runtime = 'edge'
 *   export function GET(req: Request) {
 *     return generateOG({ title: 'My Page', variant: 'org', request: req })
 *   }
 *
 * Sprint: P103 S16 T01.
 */

import { ImageResponse } from '@vercel/og'
import { createElement } from 'react'
import { OgTemplate } from './template'
import { getProductConfig } from './colors'
import type { OGOptions } from './types'

/** Canonical OG dimensions per Open Graph spec (Twitter/Facebook/LinkedIn). */
export const OG_WIDTH = 1200 as const
export const OG_HEIGHT = 630 as const

/**
 * Cache duration in seconds — 24 h is appropriate for content that rarely
 * changes. Override at the route level if the page is more dynamic.
 */
export const OG_CACHE_SECONDS = 86400 as const

/**
 * Generate an OG image Response for a given set of options.
 *
 * Returns a standard Web API Response (cache headers included when `request`
 * is provided). The function is edge-runtime-safe: it never calls Node-only
 * APIs (`fs`, `path`, `crypto`).
 *
 * @param options - OG generation options (title required, others optional)
 * @returns Web API Response containing a PNG image
 */
export function generateOG(options: OGOptions): Response {
  const { title, breadcrumb = '', variant = 'org' } = options

  // getProductConfig accepts the broader ProductKey union; variant is a subset.
  const config = getProductConfig(variant)

  // Cast needed: @vercel/og ships React 18 @types/react; workspace devDeps are React 19.
  // The runtime is identical — this is a type-only compat bridge.
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
    },
  ) as unknown as Response

  // Clone headers and add cache control — ImageResponse is immutable.
  const headers = new Headers(image.headers)
  headers.set(
    'Cache-Control',
    `public, max-age=${OG_CACHE_SECONDS}, s-maxage=${OG_CACHE_SECONDS}`,
  )

  return new Response(image.body, {
    status: image.status,
    headers,
  })
}
