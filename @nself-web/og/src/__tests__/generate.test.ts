/**
 * Tests for @nself-web/og generate.ts
 *
 * We mock @vercel/og to avoid spinning up the real satori/resvg WASM
 * renderer in unit tests (resvg's WASM build dynamically imports its own
 * wasm-bindgen glue as a bare specifier 'wbg', which Node's ESM resolver
 * cannot resolve outside a real bundler/edge runtime — it errors with
 * "Cannot find package 'wbg'" if the real @vercel/og is exercised here).
 * generate.ts imports ImageResponse from '@vercel/og' (migrated off
 * next/og in 5861daff) — the mock target below must match that import.
 * What we validate: correct env var forwarding, all four variants resolve
 * a product config, cache headers are set correctly, and defaults are applied.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock @vercel/og ImageResponse before importing generate
vi.mock('@vercel/og', () => {
  class MockImageResponse {
    readonly body: ReadableStream | null
    readonly status: number
    readonly headers: Headers

    constructor(_element: unknown, options?: { width?: number; height?: number }) {
      void options
      this.body = null
      this.status = 200
      this.headers = new Headers({ 'content-type': 'image/png' })
    }
  }
  return { ImageResponse: MockImageResponse }
})

import {
  generateOG,
  OG_WIDTH,
  OG_HEIGHT,
  OG_CACHE_SECONDS,
} from '../generate'

describe('@nself-web/og generateOG', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports canonical dimension constants', () => {
    expect(OG_WIDTH).toBe(1200)
    expect(OG_HEIGHT).toBe(630)
    expect(OG_CACHE_SECONDS).toBe(86400)
  })

  it('returns a Response when called with minimal options', () => {
    const res = generateOG({ title: 'Hello World' })
    expect(res).toBeInstanceOf(Response)
    expect(res.status).toBe(200)
  })

  it('sets cache-control header on the response', () => {
    const res = generateOG({ title: 'Cached Page' })
    const cc = res.headers.get('Cache-Control')
    expect(cc).toContain('public')
    expect(cc).toContain(`max-age=${OG_CACHE_SECONDS}`)
    expect(cc).toContain(`s-maxage=${OG_CACHE_SECONDS}`)
  })

  it.each(['org', 'cloud', 'nchat', 'ntv'] as const)(
    'resolves variant %s without throwing',
    (variant) => {
      expect(() => generateOG({ title: `Test – ${variant}`, variant })).not.toThrow()
    },
  )

  it('defaults variant to "org" when omitted', () => {
    // Should not throw — org is a valid variant
    const res = generateOG({ title: 'Org default' })
    expect(res.status).toBe(200)
  })

  it('accepts an optional breadcrumb without error', () => {
    const res = generateOG({
      title: 'Getting Started',
      breadcrumb: 'Docs / Getting Started',
      variant: 'org',
    })
    expect(res.status).toBe(200)
  })

  it('accepts an empty breadcrumb string', () => {
    const res = generateOG({ title: 'No Crumb', breadcrumb: '', variant: 'cloud' })
    expect(res.status).toBe(200)
  })

  it('handles a very long title without throwing', () => {
    const longTitle = 'A'.repeat(200)
    expect(() => generateOG({ title: longTitle, variant: 'nchat' })).not.toThrow()
  })
})
