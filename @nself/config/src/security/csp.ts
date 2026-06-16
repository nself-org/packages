/**
 * Purpose: Build Content Security Policy header strings for nSelf web surfaces.
 * Inputs:  CspOptions — Hasura URL, optional Sentry DSN, CDN domains, per-request nonce.
 * Outputs: Fully formed CSP string ready for use as a `Content-Security-Policy` header value.
 * Constraints:
 *   - frame-ancestors 'none' is unconditional — no surface in nSelf is intentionally iframed.
 *   - style-src uses 'unsafe-inline' to support Tailwind CSS (JIT purges unused classes but
 *     cannot avoid inline styles for utility classes in SSR). Document this trade-off; hash-based
 *     or nonce-based style allowances are a future upgrade when Tailwind adds nonce support.
 *   - object-src 'none' and base-uri 'self' close common injection vectors.
 *   - Nonce-based script allowance is per-request; callers generate the nonce externally.
 * SPORT: F08-SERVICE-INVENTORY.md — web surface services
 */

export interface CspOptions {
  /** Full URL of the Hasura GraphQL endpoint, e.g. "https://api.nself.org/v1/graphql" */
  hasuraUrl: string;
  /** Optional Sentry DSN for error reporting — added to connect-src */
  sentryDsn?: string;
  /** Additional CDN domains allowed as image sources */
  cdnDomains?: string[];
  /** Per-request nonce for inline scripts; callers generate this (e.g. crypto.randomBytes(16).toString('base64')) */
  nonce?: string;
}

/**
 * Build a Content Security Policy header string.
 *
 * WHY frame-ancestors 'none' is unconditional:
 *   Prevents clickjacking on all nSelf surfaces. No current surface is designed to be
 *   embedded in an iframe. If a future surface legitimately needs iframe embedding
 *   (e.g. a widget), that app's ticket must override this directive explicitly with a
 *   comment explaining the reason.
 *
 * WHY style-src 'unsafe-inline':
 *   Tailwind CSS generates utility classes as inline styles in SSR/hydration. Until
 *   Tailwind adds first-class nonce support for JIT output, 'unsafe-inline' is required.
 *   This is a documented, accepted trade-off — the alternative (hash-based allowlisting)
 *   requires per-build hash generation and breaks with any style change.
 *   Mitigation: all other directives are strict; style injection is a lower-severity vector
 *   compared to script injection.
 */
export function buildCsp(opts: CspOptions): string {
  const connectSources = ["'self'", opts.hasuraUrl, opts.sentryDsn ?? ''].filter(Boolean);
  const connectSrc = connectSources.join(' ');
  const scriptSrc = opts.nonce ? `'self' 'nonce-${opts.nonce}'` : "'self'";
  const imgSrc = ["'self'", 'data:', ...(opts.cdnDomains ?? [])].join(' ');

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    // 'unsafe-inline' required for Tailwind CSS — see WHY comment above
    `style-src 'self' 'unsafe-inline'`,
    `connect-src ${connectSrc}`,
    `img-src ${imgSrc}`,
    `font-src 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');
}
