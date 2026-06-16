/**
 * RTL (Right-to-Left) Utilities
 *
 * Purpose: Provide helpers for directional layout support across RTL locales.
 * These utilities simplify conditional styling and layout adjustments for
 * right-to-left languages (Arabic, Hebrew, Farsi, Urdu).
 *
 * Inputs: locale string
 * Outputs: boolean, text alignment ('left'|'right'), flex direction ('row'|'row-reverse')
 * Constraints: locale must match a known locale identifier
 */

/**
 * RTL locales supported by nSelf.
 * Supports: ar (Arabic), he (Hebrew), fa (Farsi), ur (Urdu)
 * Deferred in v1.0.9; scheduled for P95+ with RTL migration.
 */
const RTL_LOCALES_SET = new Set(['ar', 'he', 'fa', 'ur'])

/**
 * Check if a locale uses right-to-left text direction.
 * @param locale — Locale identifier (string)
 * @returns true if locale is RTL; false otherwise (including unknown locales)
 */
export const isRTL = (locale: string): boolean => {
  return RTL_LOCALES_SET.has(locale)
}

/**
 * Get text alignment for a locale.
 * Used for CSS text-align and Tailwind text-* classes.
 * @param locale — Locale identifier
 * @returns 'right' for RTL; 'left' for LTR
 */
export const getTextAlign = (locale: string): 'left' | 'right' => {
  return isRTL(locale) ? 'right' : 'left'
}

/**
 * Get flex direction for a locale.
 * Used for CSS flex-direction and Tailwind flex-row / flex-row-reverse.
 * @param locale — Locale identifier
 * @returns 'row-reverse' for RTL; 'row' for LTR
 */
export const getFlexDirection = (
  locale: string
): 'row' | 'row-reverse' => {
  return isRTL(locale) ? 'row-reverse' : 'row'
}

/**
 * Get start/end inset value for a locale.
 * Maps 'start'/'end' logical properties to physical 'left'/'right'.
 * @param locale — Locale identifier
 * @param position — 'start' or 'end'
 * @returns 'right' for RTL 'start'; 'left' otherwise
 */
export const getInsetDirection = (
  locale: string,
  position: 'start' | 'end'
): 'left' | 'right' => {
  if (!isRTL(locale)) {
    return position === 'start' ? 'left' : 'right'
  }
  return position === 'start' ? 'right' : 'left'
}

/**
 * Get margin direction for a locale.
 * Maps logical margin properties to physical directions.
 * @param locale — Locale identifier
 * @param side — 'start' or 'end'
 * @returns 'right' for RTL 'start'; 'left' otherwise
 */
export const getMarginDirection = (
  locale: string,
  side: 'start' | 'end'
): 'left' | 'right' => {
  if (!isRTL(locale)) {
    return side === 'start' ? 'left' : 'right'
  }
  return side === 'start' ? 'right' : 'left'
}
