/**
 * @nself-web/csp — Content Security Policy Foundation
 *
 * Public API:
 *
 * buildCspHeader(subapp, options?)
 *   → CSP header value string for use in next.config.ts headers()
 *
 * buildCspHeaderObject(subapp, options?)
 *   → Full security header record (CSP + HSTS + X-Frame-Options + ...)
 *
 * buildCspDirectives(subapp, options?)
 *   → Raw CspDirectives object for inspection / testing
 *
 * serializeCspDirectives(directives)
 *   → Serialize a CspDirectives object to a header string
 *
 * KNOWN_SUBAPPS
 *   → Array of all registered subapp names
 *
 * Usage in next.config.ts:
 *
 *   import { buildCspHeaderObject } from '@nself-web/csp'
 *
 *   const headers = async () => [{
 *     source: '/(.*)',
 *     headers: Object.entries(buildCspHeaderObject('org')).map(([key, value]) => ({
 *       key,
 *       value,
 *     })),
 *   }]
 */

export type { CspDirectives } from './policy'
export {
  buildCspHeader,
  buildCspHeaderObject,
  buildCspDirectives,
  serializeCspDirectives,
  buildReportToHeader,
  KNOWN_SUBAPPS,
  CSP_REPORT_TO_GROUP,
  CSP_REPORT_LOCAL_PATH,
  CSP_REPORT_REMOTE_URL,
} from './policy'

// Security headers (HSTS + supplementary) — A4-T04 / SEC-18
export { BASE_SECURITY_HEADERS, buildSecurityHeaders } from './security-headers'

// CSRF protection utilities (A4-T03 / SEC-13)
export {
  CSRF_COOKIE_HTTPONLY,
  CSRF_COOKIE_JS,
  CSRF_HEADER,
  generateCsrfToken,
  validateCsrfToken,
  csrfCookieAttribs,
  csrfClientCookieAttribs,
  buildCsrfCookieHeader,
  buildCsrfClientCookieHeader,
} from './csrf'
