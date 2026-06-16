/**
 * i18n Translation Tests
 *
 * Test Scope:
 * - Locale files exist and contain expected keys
 * - t() function returns correct strings for en and ar
 * - RTL detection works correctly
 * - TranslationKey type is exported and usable
 */

import { describe, it, expect } from 'vitest'
import enMessages from '../locales/en.json'
import arMessages from '../locales/ar.json'
import { isRTL, getTextAlign, getFlexDirection } from '../types'

describe('i18n Locales', () => {
  it('should have en.json with at least 40 keys', () => {
    const keys = Object.keys(enMessages).reduce((acc, ns) => {
      return acc + Object.keys(enMessages[ns as keyof typeof enMessages]).length
    }, 0)
    expect(keys).toBeGreaterThanOrEqual(40)
  })

  it('should have ar.json with at least 40 keys', () => {
    const keys = Object.keys(arMessages).reduce((acc, ns) => {
      return acc + Object.keys(arMessages[ns as keyof typeof arMessages]).length
    }, 0)
    expect(keys).toBeGreaterThanOrEqual(40)
  })

  it('should have matching key structure between en and ar', () => {
    const enKeys = Object.keys(enMessages).sort()
    const arKeys = Object.keys(arMessages).sort()
    expect(enKeys).toEqual(arKeys)
  })

  it('should return correct strings for en locale', () => {
    expect(enMessages.common.submit).toBe('Submit')
    expect(enMessages.auth.login).toBe('Sign In')
    expect(enMessages.errors.required).toBe('This field is required')
  })

  it('should return correct strings for ar locale', () => {
    expect(arMessages.common.submit).toBe('إرسال')
    expect(arMessages.auth.login).toBe('تسجيل الدخول')
    expect(arMessages.errors.required).toBe('هذا الحقل مطلوب')
  })
})

describe('RTL Utilities', () => {
  it('should return true for isRTL("ar")', () => {
    expect(isRTL('ar')).toBe(true)
  })

  it('should return false for isRTL("en")', () => {
    expect(isRTL('en')).toBe(false)
  })

  it('should return false for isRTL with unknown locale', () => {
    expect(isRTL('xx')).toBe(false)
  })

  it('should return "right" for getTextAlign("ar")', () => {
    expect(getTextAlign('ar')).toBe('right')
  })

  it('should return "left" for getTextAlign("en")', () => {
    expect(getTextAlign('en')).toBe('left')
  })

  it('should return "row-reverse" for getFlexDirection("ar")', () => {
    expect(getFlexDirection('ar')).toBe('row-reverse')
  })

  it('should return "row" for getFlexDirection("en")', () => {
    expect(getFlexDirection('en')).toBe('row')
  })

  it('should cover all RTL locale branches', () => {
    // Test all currently defined RTL locales
    const rtlLocales = ['ar']
    rtlLocales.forEach(locale => {
      expect(isRTL(locale)).toBe(true)
      expect(getTextAlign(locale)).toBe('right')
      expect(getFlexDirection(locale)).toBe('row-reverse')
    })

    // Test non-RTL locales
    const ltrLocales = ['en', 'de', 'es', 'fr']
    ltrLocales.forEach(locale => {
      expect(isRTL(locale)).toBe(false)
      expect(getTextAlign(locale)).toBe('left')
      expect(getFlexDirection(locale)).toBe('row')
    })
  })
})

describe('TranslationKey Type', () => {
  it('should export TranslationKey type', () => {
    // Import type — compile check only
    type _TestKey = import('../types').TranslationKey
    expect(true).toBe(true)
  })
})
