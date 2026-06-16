/**
 * hijri.ts — Hijri and locale-aware date formatting utilities
 *
 * Purpose: Provide Hijri calendar (Islamic Umm al-Qura) date formatting for
 *   Arabic-locale users, plus locale-aware date/number formatting helpers.
 *   Uses the native Intl.DateTimeFormat API with calendar:'islamic-umalqura'
 *   — no hardcoded offset tables, no third-party Islamic calendar lib required.
 *
 * Inputs: Date | string | number (JS date value), locale string
 * Outputs: Formatted string
 * Constraints:
 *   - Intl.DateTimeFormat with calendar:'islamic-umalqura' is supported in
 *     all modern browsers (Chrome 24+, Firefox 29+, Safari 10+)
 *   - Falls back to Gregorian if the locale/calendar combo is unavailable
 *   - No side effects; pure functions only
 * SPORT: T-P3-E6-W1-S3-T01 — RTL + Hijri utilities
 */

/** Accepted date input types for formatter functions */
export type DateInput = Date | string | number

/**
 * Normalise any acceptable date input to a JS Date object.
 * @param value — Date, ISO string, or timestamp
 * @returns Date object
 */
function toDate(value: DateInput): Date {
  if (value instanceof Date) return value
  return new Date(value)
}

/**
 * Format a date in the Hijri calendar (Islamic Umm al-Qura) for Arabic locale.
 *
 * Uses Intl.DateTimeFormat with calendar:'islamic-umalqura' which is the
 * official Saudi Arabian calendar used in government and religious contexts.
 *
 * @param value   — Date, ISO string, or timestamp
 * @param locale  — BCP47 locale string (default: 'ar-SA')
 * @param options — Optional Intl.DateTimeFormatOptions overrides
 * @returns Formatted Hijri date string, e.g. "١٥ رمضان ١٤٤٦ هـ"
 *
 * @example
 *   formatHijriDate(new Date())
 *   // "١٥ رمضان ١٤٤٦ هـ"
 *
 *   formatHijriDate(new Date(), 'ar-SA', { dateStyle: 'short' })
 *   // "١٥/٩/١٤٤٦ هـ"
 */
export function formatHijriDate(
  value: DateInput,
  locale: string = 'ar-SA',
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = toDate(value)
  try {
    const fmt = new Intl.DateTimeFormat(locale, {
      calendar: 'islamic-umalqura',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...options,
    })
    return fmt.format(date)
  } catch {
    // Fallback: standard Gregorian format for the given locale
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...options,
    }).format(date)
  }
}

/**
 * Format a date in the locale's default (Gregorian) calendar.
 * Uses Arabic-Indic numerals when locale is 'ar' or 'ar-*'.
 *
 * @param value   — Date, ISO string, or timestamp
 * @param locale  — BCP47 locale string (default: 'en')
 * @param options — Optional Intl.DateTimeFormatOptions overrides
 * @returns Localised Gregorian date string
 *
 * @example
 *   formatLocaleDate(new Date(), 'en')
 *   // "June 16, 2026"
 *
 *   formatLocaleDate(new Date(), 'ar')
 *   // "١٦ يونيو ٢٠٢٦"
 */
export function formatLocaleDate(
  value: DateInput,
  locale: string = 'en',
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = toDate(value)
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(date)
}

/**
 * Format a number with locale-aware digit representation.
 * Arabic locale produces Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) by default.
 *
 * @param value    — Number to format
 * @param locale   — BCP47 locale string (default: 'en')
 * @param options  — Optional Intl.NumberFormatOptions overrides
 * @returns Localised number string
 *
 * @example
 *   formatLocaleNumber(1234, 'ar')   // "١٬٢٣٤"
 *   formatLocaleNumber(1234, 'en')   // "1,234"
 */
export function formatLocaleNumber(
  value: number,
  locale: string = 'en',
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}
