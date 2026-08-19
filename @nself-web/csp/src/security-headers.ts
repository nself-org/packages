/**
 * @nself-web/csp — Security Headers
 *
 * Provides supplementary HTTP security headers beyond Content-Security-Policy.
 * These are emitted alongside the CSP header by buildCspHeaderObject() in policy.ts.
 *
 * A4-T04 (SEC-18): HSTS max-age=31536000; includeSubDomains; preload
 * ─────────────────────────────────────────────────────────────────────────────
 * All 13 nself.org subdomains return the HSTS header via buildCspHeaderObject(),
 * which calls buildSecurityHeaders() below. The header is emitted in every
 * next.config.ts headers() function across all subapps.
 *
 * PRELOAD NOTE:
 * The `preload` directive is included in the header value. This is intentional —
 * including the directive in the header does NOT automatically register the domain
 * on the HSTS preload list. Preload list submission (https://hstspreload.org) is a
 * separate, IRREVERSIBLE action that requires explicit user approval. Do NOT submit
 * without sign-off. See README.md § HSTS.
 *
 * X-Frame-Options: DENY
 * ─────────────────────────────────────────────────────────────────────────────
 * Legacy frame-busting for browsers that do not parse CSP frame-src. Note that
 * modern browsers honour CSP frame-src and ignore X-Frame-Options, but older
 * browsers (IE11, some WebViews) still rely on this header. Both are emitted for
 * maximum coverage.
 *
 * X-Content-Type-Options: nosniff
 * ─────────────────────────────────────────────────────────────────────────────
 * Prevents MIME-type sniffing in all browsers. Without this, a browser may
 * interpret a response as a different MIME type than declared (e.g., a text/plain
 * file executed as JavaScript). Always emit.
 *
 * Referrer-Policy: strict-origin-when-cross-origin
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends the full URL as Referer on same-origin navigations; sends only the origin
 * (no path/query) on cross-origin navigations; sends nothing on HTTP-downgrade.
 * Balances analytics utility with user privacy.
 *
 * Permissions-Policy
 * ─────────────────────────────────────────────────────────────────────────────
 * Restricts access to powerful browser APIs. No subapp currently requires camera,
 * microphone, geolocation, or the other listed APIs. Add exceptions here if a
 * subapp legitimately requires one (e.g., clawde may need microphone for voice
 * input in a future release — add under clawde SUBAPP_EXTENSIONS).
 */

/**
 * Supplementary security headers emitted by all subapps.
 *
 * These are environment-independent — they apply in both development and
 * production. They do not vary per-subapp (all 13 subapps get the same values).
 */
export const BASE_SECURITY_HEADERS: Record<string, string> = {
  /**
   * HSTS — SEC-18 (A4-T04, Amendment 10)
   *
   * max-age=31536000 = 1 year in seconds (browser caches HTTPS-only directive for 1 year)
   * includeSubDomains = applies to *.nself.org (covers all 13 subdomains)
   * preload = declares intent for preload list inclusion (submission is a future step)
   *
   * IMPORTANT: Do NOT submit to https://hstspreload.org without explicit user approval.
   * The header with `preload` is safe to ship; the submission to the preload list is
   * irreversible and requires careful verification that ALL subdomains serve HTTPS.
   */
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  /**
   * MIME sniffing prevention.
   * Instructs browsers to honour the declared Content-Type header exactly.
   */
  'X-Content-Type-Options': 'nosniff',

  /**
   * Legacy frame-busting.
   * DENY: this page must not be embedded in a frame on any origin.
   * Note: subapps that embed Stripe iframes use CSP frame-src to allow specific
   * Stripe domains. X-Frame-Options applies to the subapp being framed, not to the
   * iframes it hosts — so DENY here is correct and does not conflict with Stripe.
   */
  'X-Frame-Options': 'DENY',

  /**
   * Referrer policy.
   * Sends origin-only on cross-origin navigations; no Referer on HTTP downgrade.
   */
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  /**
   * Permissions policy.
   * Explicitly disables APIs no nself subapp currently uses. This blocks
   * third-party scripts (if any slip through CSP) from accessing these APIs.
   *
   * Add exceptions per-subapp in SUBAPP_EXTENSIONS if a future feature requires
   * a listed API. Do not remove entries here without a documented justification.
   */
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),
}

/**
 * Returns the supplementary security headers record.
 *
 * Accepts an optional per-subapp override map for future extensibility
 * (e.g., if clawde needs microphone=self for voice input).
 *
 * @param overrides - Additional or overriding header key-value pairs for this subapp.
 * @returns Merged record of security header name → value.
 */
export function buildSecurityHeaders(
  overrides: Record<string, string> = {}
): Record<string, string> {
  return { ...BASE_SECURITY_HEADERS, ...overrides }
}
