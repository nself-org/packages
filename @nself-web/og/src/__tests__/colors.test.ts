/**
 * Tests for @nself-web/og colors.ts
 *
 * Validates that all expected product keys resolve to a complete ProductConfig
 * with the canonical brand colours.
 */

import { describe, expect, it } from 'vitest'
import { PRODUCT_COLORS, getProductConfig, type ProductKey } from '../colors'

const KNOWN_KEYS: ProductKey[] = [
  'org', 'docs', 'cloud', 'nchat', 'nclaw', 'ntv', 'nfamily', 'ntask', 'clawde',
]

describe('@nself-web/og colors', () => {
  it('PRODUCT_COLORS has all expected product keys', () => {
    for (const key of KNOWN_KEYS) {
      expect(PRODUCT_COLORS).toHaveProperty(key)
    }
  })

  it.each(KNOWN_KEYS)('getProductConfig(%s) returns a complete config', (key) => {
    const config = getProductConfig(key)
    expect(config).toBeDefined()
    expect(typeof config.accent).toBe('string')
    expect(typeof config.accentAlpha).toBe('string')
    expect(typeof config.accentBorder).toBe('string')
    expect(typeof config.accentText).toBe('string')
    expect(typeof config.wordmark).toBe('string')
  })

  it('getProductConfig falls back gracefully on unknown key', () => {
    // Should return org config (or any valid config) for unknown keys
    const config = getProductConfig('unknown_product')
    expect(config).toBeDefined()
    expect(typeof config.accent).toBe('string')
  })

  it('org accent is sky-500 (#0ea5e9)', () => {
    const { accent } = getProductConfig('org')
    expect(accent).toBe('#0ea5e9')
  })

  it('wordmarks are non-empty strings', () => {
    for (const key of KNOWN_KEYS) {
      const { wordmark } = getProductConfig(key)
      expect(wordmark.length).toBeGreaterThan(0)
    }
  })
})
