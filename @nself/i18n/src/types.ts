/**
 * Translation Key Type — Strongly typed translation keys
 *
 * Purpose: Ensure all t() calls use valid keys from the English locale.
 * Flattened keys are generated from locales/en.json namespace structure.
 * This prevents runtime errors from typos and provides IDE autocompletion.
 *
 * Constraints:
 * - Keys must exist in locales/en.json
 * - Paths are flattened: 'common.submit', 'auth.login', 'errors.required'
 * - Type is exhaustive — any missing key causes a TS error
 */

/**
 * TranslationKey union — all valid t() call keys.
 * Includes all keys from the English locale structure.
 * Generated from locales/en.json namespaces.
 *
 * Keys follow the pattern: 'namespace.key'
 * Examples: 'common.submit', 'auth.login', 'errors.required'
 */
export type TranslationKey =
  | `common.${
      | 'submit'
      | 'cancel'
      | 'save'
      | 'delete'
      | 'edit'
      | 'close'
      | 'ok'
      | 'back'
      | 'next'
      | 'previous'
      | 'loading'
      | 'error'
      | 'success'
      | 'warning'
      | 'info'
      | 'search'
      | 'clear'
      | 'apply'
      | 'reset'
      | 'more'
      | 'less'}`
  | `auth.${
      | 'login'
      | 'logout'
      | 'register'
      | 'email'
      | 'password'
      | 'rememberMe'
      | 'forgotPassword'
      | 'createAccount'
      | 'alreadyHaveAccount'
      | 'loginSuccess'
      | 'logoutSuccess'}`
  | `errors.${
      | 'required'
      | 'invalidEmail'
      | 'passwordTooShort'
      | 'passwordMismatch'
      | 'userNotFound'
      | 'invalidCredentials'
      | 'accountLocked'
      | 'networkError'
      | 'serverError'
      | 'unauthorized'}`

/**
 * Supported locale identifiers.
 * Expand as new locales are added.
 */
export type Locale = 'en' | 'ar'

/**
 * RTL (right-to-left) locales.
 * Used for directional layout and text alignment decisions.
 * Locales: ar (Arabic), he (Hebrew), fa (Farsi), ur (Urdu)
 */
export const RTL_LOCALES: readonly Locale[] = ['ar']

/**
 * Check if a locale uses right-to-left text direction.
 * @param locale — Locale string (any value, will be checked against RTL_LOCALES)
 * @returns true if locale is RTL; false otherwise
 */
export const isRTL = (locale: string): boolean => {
  return RTL_LOCALES.includes(locale as Locale)
}

/**
 * Get text alignment direction for a locale.
 * @param locale — Locale string
 * @returns 'right' for RTL locales, 'left' for LTR
 */
export const getTextAlign = (locale: string): 'left' | 'right' => {
  return isRTL(locale) ? 'right' : 'left'
}

/**
 * Get flex direction for a locale.
 * @param locale — Locale string
 * @returns 'row-reverse' for RTL locales, 'row' for LTR
 */
export const getFlexDirection = (
  locale: string
): 'row' | 'row-reverse' => {
  return isRTL(locale) ? 'row-reverse' : 'row'
}
