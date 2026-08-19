/**
 * @nself-web/csp — CSRF Protection Utilities
 *
 * Provides cryptographically-random CSRF token generation and validation
 * for Stripe checkout POST handlers in web/org and web/cloud.
 *
 * SPEC: A4-T03 / SEC-13 (Amendment 9)
 *
 * Design:
 *  - Token is 32 bytes of cryptographically-random data, hex-encoded (64 chars)
 *  - Token is stored in an HttpOnly, Secure, SameSite=Strict cookie named __csrf
 *  - Client reads the token from a separate readable cookie (__csrf_token) and
 *    sends it back as the X-CSRF-Token request header on POST
 *  - Server validates: header value === cookie value
 *  - Constant-time comparison prevents timing attacks
 *
 * Cookie split strategy (double-submit cookie pattern):
 *  - __csrf       : HttpOnly, Secure, SameSite=Strict  — server-only read
 *  - __csrf_token : non-HttpOnly, Secure, SameSite=Strict — JS-readable for header injection
 *
 * Both cookies hold the SAME value. The HttpOnly cookie is the authoritative
 * server-side record; the non-HttpOnly cookie is the JS-readable surface that
 * client code reads and injects as X-CSRF-Token.
 *
 * This double-submit cookie pattern is safe against CSRF because:
 *  1. SameSite=Strict prevents the browser from sending cookies on cross-origin requests
 *  2. An attacker cannot read the cookie value (different origin)
 *  3. Therefore an attacker cannot construct a valid X-CSRF-Token header
 *
 * WHY NOT use a session-stored token?
 * web/org does not maintain server-side sessions for pre-checkout anonymous users.
 * The double-submit cookie pattern provides CSRF protection without requiring a
 * session store.
 */

/** CSRF cookie names */
export const CSRF_COOKIE_HTTPONLY = '__csrf'
export const CSRF_COOKIE_JS = '__csrf_token'

/** CSRF request header name */
export const CSRF_HEADER = 'X-CSRF-Token'

/** Token byte length — 32 bytes = 256 bits of entropy */
const TOKEN_BYTES = 32

/** Token TTL: 1 hour (generous for a checkout flow) */
const TOKEN_TTL_SECONDS = 60 * 60

/**
 * Generate a cryptographically-random CSRF token.
 *
 * Uses the Web Crypto API (globalThis.crypto) which is available in:
 *  - Node.js 19+ (globally)
 *  - Next.js App Router Edge runtime
 *  - Modern browsers
 *
 * @returns Hex-encoded 64-character token string
 */
export async function generateCsrfToken(): Promise<string> {
  const bytes = new Uint8Array(TOKEN_BYTES)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Cookie attributes for the HttpOnly server-side CSRF cookie.
 *
 * @param isDev - If true, omits Secure flag for localhost development
 */
export function csrfCookieAttribs(isDev: boolean = false): {
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict'
  path: string
  maxAge: number
} {
  return {
    httpOnly: true,
    secure: !isDev,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  }
}

/**
 * Cookie attributes for the JS-readable CSRF cookie (non-HttpOnly).
 * Client code reads this and sends it as X-CSRF-Token header.
 *
 * @param isDev - If true, omits Secure flag for localhost development
 */
export function csrfClientCookieAttribs(isDev: boolean = false): {
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict'
  path: string
  maxAge: number
} {
  return {
    httpOnly: false,
    secure: !isDev,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  }
}

/**
 * Validate the CSRF token from the request.
 *
 * Compares the X-CSRF-Token header against the __csrf HttpOnly cookie value
 * using constant-time comparison to prevent timing attacks.
 *
 * @param headerToken - Token from the X-CSRF-Token request header
 * @param cookieToken - Token from the __csrf HttpOnly cookie
 * @returns true if both tokens are present, equal length, and equal value
 */
export function validateCsrfToken(
  headerToken: string | null | undefined,
  cookieToken: string | null | undefined
): boolean {
  if (!headerToken || !cookieToken) return false

  // Both tokens must be exactly 64 hex chars (32 bytes)
  if (headerToken.length !== TOKEN_BYTES * 2 || cookieToken.length !== TOKEN_BYTES * 2) return false

  // Constant-time comparison — prevent timing attacks
  return timingSafeEqual(headerToken, cookieToken)
}

/**
 * Constant-time string comparison.
 *
 * Always iterates the full length to prevent timing side-channels.
 * Returns false immediately if lengths differ (no timing info leaked because
 * we already checked equal length above in validateCsrfToken).
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Build the Set-Cookie header string for the HttpOnly CSRF cookie.
 * Used in Next.js API routes that cannot use the `cookies()` helper
 * (e.g., POST handlers returning non-redirect responses).
 *
 * @param token - The CSRF token value
 * @param isDev - Omit Secure flag for localhost
 */
export function buildCsrfCookieHeader(token: string, isDev: boolean = false): string {
  const secureFlag = isDev ? '' : '; Secure'
  return `${CSRF_COOKIE_HTTPONLY}=${token}; HttpOnly${secureFlag}; SameSite=Strict; Path=/; Max-Age=${TOKEN_TTL_SECONDS}`
}

/**
 * Build the Set-Cookie header string for the JS-readable CSRF cookie.
 *
 * @param token - The CSRF token value (same as HttpOnly cookie)
 * @param isDev - Omit Secure flag for localhost
 */
export function buildCsrfClientCookieHeader(token: string, isDev: boolean = false): string {
  const secureFlag = isDev ? '' : '; Secure'
  return `${CSRF_COOKIE_JS}=${token}${secureFlag}; SameSite=Strict; Path=/; Max-Age=${TOKEN_TTL_SECONDS}`
}
