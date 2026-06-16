/**
 * Purpose: Framework-agnostic security header baseline for all nSelf web surfaces.
 * Inputs:  None (static baseline).
 * Outputs: Array of { key, value } tuples ready to spread into Astro middleware or
 *          Vercel vercel.json headers arrays.
 * Constraints:
 *   - These headers complement, not replace, CSP (see csp.ts for Content-Security-Policy).
 *   - X-Frame-Options DENY mirrors frame-ancestors 'none' in CSP for legacy browser support.
 *   - HSTS max-age is 1 year (31536000) with includeSubDomains — this is a commitment.
 *     Do NOT enable preload here; preload requires manual HSTS preload list submission
 *     and cannot be reversed quickly. Add preload only after verifying all subdomains
 *     serve HTTPS (see F11-SUBDOMAIN-MAP.md).
 *   - Permissions-Policy disables camera, microphone, and geolocation by default.
 *     nFamily will need geolocation — that app's E3 ticket overrides this header,
 *     not this baseline.
 * SPORT: F08-SERVICE-INVENTORY.md — web surface services
 */

export interface SecurityHeader {
  key: string;
  value: string;
}

/**
 * Baseline security headers for all nSelf web surfaces (Astro + Vite).
 * Apply these to every response route. Per-app overrides go in that app's config.
 *
 * WHY X-Frame-Options alongside CSP frame-ancestors:
 *   frame-ancestors is not supported in <meta http-equiv> CSP delivery (Astro static export).
 *   X-Frame-Options covers legacy browsers and the meta-CSP gap.
 *
 * WHY Referrer-Policy strict-origin:
 *   Sends the origin (scheme+host) only for same-origin and cross-origin HTTPS requests.
 *   Strips path and query string, preventing Hasura URLs or auth tokens in the referrer.
 */
export const nselfBaseHeaders: SecurityHeader[] = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin',
  },
  {
    key: 'Permissions-Policy',
    // camera, microphone, geolocation all disabled by default
    // nFamily (E3 ticket) will override geolocation=() -> geolocation=(self)
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    // 1 year + includeSubDomains. No preload until all subdomains verified HTTPS-only.
    value: 'max-age=31536000; includeSubDomains',
  },
];
