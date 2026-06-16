/**
 * @nself/i18n — Shared internationalization layer for nSelf products
 *
 * Exports:
 * - TranslationKey: Union type of all valid translation keys
 * - RTL utilities: isRTL, getTextAlign, getFlexDirection, getInsetDirection, getMarginDirection
 * - Hijri utilities: formatHijriDate, formatLocaleDate, formatLocaleNumber
 * - React Provider: NselfI18nProvider, useNselfTranslation hook
 * - i18next: useTranslation hook from react-i18next for direct access
 */

// Type exports
export type { TranslationKey, Locale } from './types'
export { RTL_LOCALES, isRTL, getTextAlign, getFlexDirection } from './types'

// RTL utilities
export {
  isRTL as isRTLUtil,
  getTextAlign as getTextAlignUtil,
  getFlexDirection as getFlexDirectionUtil,
  getInsetDirection,
  getMarginDirection
} from './rtl'

// Hijri calendar + locale-aware date/number formatting
export type { DateInput } from './hijri'
export { formatHijriDate, formatLocaleDate, formatLocaleNumber } from './hijri'

// React provider & hook
export { NselfI18nProvider, useNselfTranslation, initializeI18next } from './provider'
export type { NselfI18nProviderProps } from './provider'

// Re-export useTranslation from react-i18next for advanced use cases
export { useTranslation } from 'react-i18next'
