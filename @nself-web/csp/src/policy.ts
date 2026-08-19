import { buildSecurityHeaders } from './security-headers'

/**
 * @nself-web/csp — Content Security Policy Foundation
 *
 * WHY unsafe-inline IN script-src?
 * ---------------------------------
 * Next.js App Router (RSC) injects inline <script> tags for hydration data
 * (e.g. __NEXT_DATA__, RSC payload chunks). These are generated at request
 * time and cannot be nonce-tagged in the current Next.js 14/15 SSR pipeline
 * without experimental CSP nonce support that is not yet stable. Until
 * Next.js ships first-class nonce injection for all RSC hydration paths,
 * 'unsafe-inline' is required to avoid hydration failures.
 *
 * WHY unsafe-inline IN style-src?
 * --------------------------------
 * Tailwind CSS v3 (used across all 13 subapps) emits utility classes as
 * atomic styles that can appear in style attributes and <style> blocks
 * injected by the React runtime (e.g., CSS-in-JS-style behaviour from some
 * animation libraries and emotion-adjacent packages). 'unsafe-inline' avoids
 * breaking this class of tooling without a full nonce solution.
 *
 * FUTURE WORK (track in A4-T05):
 * Once Next.js nonce support is stable, replace 'unsafe-inline' in script-src
 * with `'nonce-{nonce}'` and remove it from style-src in favour of
 * 'strict-dynamic'. See https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 *
 * STRIPE ALLOWLIST (A4-T01, A4-T03):
 * 'https://js.stripe.com'     — Stripe.js payment form
 * 'https://billing.stripe.com' — Stripe Customer Portal (embedded iframe)
 * 'https://hooks.stripe.com'  — Stripe webhook event JS
 * Only org and cloud subapps receive these additions; ntv/ntask/docs etc. do not.
 *
 * DEVELOPMENT:
 * In NODE_ENV=development, 'ws://localhost:*' is added to connect-src to
 * allow Next.js hot-module replacement WebSocket connections.
 */

/** A single CSP directive value: an array of source strings. */
type DirectiveValue = string[]

/** Full set of CSP directives as a typed record. */
export interface CspDirectives {
  'default-src': DirectiveValue
  'script-src': DirectiveValue
  'style-src': DirectiveValue
  'img-src': DirectiveValue
  'font-src': DirectiveValue
  'connect-src': DirectiveValue
  'frame-src': DirectiveValue
  'object-src': DirectiveValue
  'base-uri': DirectiveValue
  'form-action': DirectiveValue
  'report-uri'?: DirectiveValue
  /**
   * report-to (modern Reporting API) — names the reporting group declared
   * in the companion `Report-To` HTTP header. Browsers that support the
   * Reporting API send violations as application/reports+json to the
   * endpoint URL declared in the named group. See buildReportToHeader().
   */
  'report-to'?: DirectiveValue
  'upgrade-insecure-requests'?: []
}

/**
 * Reporting API group name used in both the CSP `report-to` directive
 * and the companion `Report-To` HTTP header. Keep these in sync — the
 * browser matches the directive value to the group name.
 */
export const CSP_REPORT_TO_GROUP = 'csp-endpoint'

/**
 * Local CSP report endpoint (A4-T05). Implemented in
 * web/org/src/app/api/csp-report/route.ts. Accepts both legacy
 * `application/csp-report` POSTs and modern `application/reports+json`
 * payloads from the Reporting API.
 */
export const CSP_REPORT_LOCAL_PATH = '/api/csp-report'

/**
 * Cloudflare Worker stub kept for cross-subdomain reports (P98).
 * Browsers POST violation reports here in addition to the local
 * endpoint; the worker 404s until P98 ships — that is safe.
 */
export const CSP_REPORT_REMOTE_URL = 'https://csp-report.nself.org/csp-violations'

/**
 * Base policy applied to every subapp.
 *
 * - No wildcards (*) in any directive.
 * - No 'unsafe-eval' anywhere.
 * - 'frame-src' defaults to 'none'; only overridden for Stripe-embedding subapps.
 */
const BASE_POLICY: CspDirectives = {
  'default-src': ["'self'"],

  // 'unsafe-inline' required: Next.js RSC hydration inline scripts.
  // Do NOT remove — see rationale above.
  'script-src': ["'self'", "'unsafe-inline'"],

  // 'unsafe-inline' required: Tailwind CSS v3 inline styles.
  // Do NOT remove — see rationale above.
  'style-src': ["'self'", "'unsafe-inline'"],

  // data: for inline images (base64 avatars, SVG data URIs).
  // https: allows any HTTPS image source (CDN, user avatars).
  'img-src': ["'self'", 'data:', 'https:'],

  'font-src': ["'self'", 'https://fonts.gstatic.com'],

  // API surface: nself backend and telemetry/license service.
  'connect-src': ["'self'", 'https://api.nself.org', 'https://ping.nself.org'],

  // Default: no frames. Stripe-embedding subapps override this.
  'frame-src': ["'none'"],

  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],

  // report-uri (legacy) — both endpoints listed:
  //   /api/csp-report          — local Next.js handler (A4-T05, immediate)
  //   csp-report.nself.org/... — Cloudflare Worker (P98, cross-subdomain aggregator)
  // Browsers send violation reports to BOTH; receiving one or both is fine.
  // Until P98 ships, the remote endpoint 404s — that is safe and expected.
  'report-uri': [CSP_REPORT_LOCAL_PATH, CSP_REPORT_REMOTE_URL],

  // report-to (modern Reporting API) — names the reporting group declared
  // in the companion `Report-To` HTTP header (see buildReportToHeader()).
  'report-to': [CSP_REPORT_TO_GROUP],
}

/**
 * Per-subapp CSP extensions.
 * Each entry is merged (union) with BASE_POLICY directives.
 * Subapps not listed here get the base policy unchanged.
 */
const SUBAPP_EXTENSIONS: Partial<Record<string, Partial<CspDirectives>>> = {
  /**
   * web/org — nself.org marketing + checkout
   *
   * Stripe: payment form JS + Customer Portal iframe
   * GitHub: changelog/version API (connect-src for fetch calls)
   */
  org: {
    'script-src': ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
    'connect-src': [
      "'self'",
      'https://api.nself.org',
      'https://ping.nself.org',
      'https://api.github.com',
      'https://hooks.stripe.com',
    ],
    // billing.stripe.com: Stripe Customer Portal embedded iframe
    // js.stripe.com: Stripe.js 3DS challenge frames
    // NOTE: Per CSP3, 'none' is ignored when other sources are present — omitted intentionally.
    'frame-src': ['https://js.stripe.com', 'https://billing.stripe.com'],
  },

  /**
   * web/cloud — cloud.nself.org dashboard + subscription management
   *
   * Stripe: same as org (Customer Portal is embedded in the cloud dashboard).
   */
  cloud: {
    'script-src': ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
    'connect-src': [
      "'self'",
      'https://api.nself.org',
      'https://ping.nself.org',
      'https://hooks.stripe.com',
    ],
    // NOTE: Per CSP3, 'none' is ignored when other sources are present — omitted intentionally.
    'frame-src': ['https://js.stripe.com', 'https://billing.stripe.com'],
  },

  /**
   * web/docs — nself.org/docs
   *
   * Algolia/DocSearch if added in future — add here.
   * Currently base policy is sufficient.
   */
  docs: {},

  /**
   * web/install — install.nself.org
   *
   * Static install page. Base policy sufficient.
   */
  install: {},

  /**
   * web/ntask — task.nself.org
   *
   * Free hosted app — no Stripe.
   */
  ntask: {},

  /**
   * web/nchat — chat.nself.org marketing
   *
   * No Stripe checkout or Customer Portal.
   */
  nchat: {},

  /**
   * web/nclaw — claw.nself.org
   *
   * No Stripe checkout or Customer Portal.
   */
  nclaw: {},

  /**
   * web/nfamily — family.nself.org
   *
   * No Stripe checkout or Customer Portal (planned v1.2.0).
   */
  nfamily: {},

  /**
   * web/ntv — ntv.nself.org
   *
   * No Stripe checkout or Customer Portal.
   */
  ntv: {},

  /**
   * web/clawde — clawde.nself.org
   *
   * No Stripe checkout or Customer Portal.
   */
  clawde: {},

  /**
   * web/base — base.nself.org (internal staff admin)
   *
   * Internal only. Base policy sufficient.
   */
  base: {},

  /**
   * web/status — status.nself.org
   *
   * Status page. May embed external status widgets in future — add here.
   */
  status: {},
}

/**
 * Merge two directive value arrays, deduplicating entries.
 */
function mergeDirective(base: DirectiveValue, extension: DirectiveValue | undefined): DirectiveValue {
  if (!extension || extension.length === 0) return base
  const merged = new Set([...base, ...extension])
  return Array.from(merged)
}

/**
 * Per CSP3 specification, the keyword 'none' is ignored when any other source
 * expression is present in the same directive value list. Including 'none'
 * alongside real sources is a no-op that only adds auditor confusion.
 *
 * This helper strips 'none' from a directive value when there are other
 * sources present. When 'none' is the only source, it is preserved.
 */
function stripRedundantNone(values: DirectiveValue): DirectiveValue {
  const realSources = values.filter((v) => v !== "'none'")
  return realSources.length > 0 ? realSources : values
}

/**
 * Build the merged CspDirectives for a given subapp.
 * If the subapp has no extension entry, returns the base policy unchanged.
 *
 * In development (NODE_ENV=development), 'ws://localhost:*' is added to
 * connect-src to allow Next.js HMR WebSocket connections.
 */
export function buildCspDirectives(
  subapp: string,
  options: { isDev?: boolean } = {}
): CspDirectives {
  const ext = SUBAPP_EXTENSIONS[subapp] ?? {}
  const isDev = options.isDev ?? process.env.NODE_ENV === 'development'

  const merged: CspDirectives = {
    'default-src': mergeDirective(BASE_POLICY['default-src'], ext['default-src']),
    'script-src': mergeDirective(BASE_POLICY['script-src'], ext['script-src']),
    'style-src': mergeDirective(BASE_POLICY['style-src'], ext['style-src']),
    'img-src': mergeDirective(BASE_POLICY['img-src'], ext['img-src']),
    'font-src': mergeDirective(BASE_POLICY['font-src'], ext['font-src']),
    'connect-src': mergeDirective(BASE_POLICY['connect-src'], ext['connect-src']),
    // stripRedundantNone: per CSP3, 'none' is ignored when other sources are present.
    // Applied to frame-src so Stripe-embedding subapps (org, cloud) emit a clean list.
    'frame-src': stripRedundantNone(mergeDirective(BASE_POLICY['frame-src'], ext['frame-src'])),
    'object-src': mergeDirective(BASE_POLICY['object-src'], ext['object-src']),
    'base-uri': mergeDirective(BASE_POLICY['base-uri'], ext['base-uri']),
    'form-action': mergeDirective(BASE_POLICY['form-action'], ext['form-action']),
    // exactOptionalPropertyTypes: both are optional on CspDirectives, so the key
    // must be absent rather than present-and-undefined. Spread them in only when
    // the base policy actually defines them.
    ...(BASE_POLICY['report-uri'] !== undefined
      ? { 'report-uri': BASE_POLICY['report-uri'] }
      : {}),
    ...(BASE_POLICY['report-to'] !== undefined
      ? { 'report-to': BASE_POLICY['report-to'] }
      : {}),
  }

  // Development: allow Next.js HMR WebSocket
  if (isDev) {
    merged['connect-src'] = Array.from(
      new Set([...merged['connect-src'], 'ws://localhost:*', 'http://localhost:*'])
    )
  }

  return merged
}

/**
 * Serialize CspDirectives to a CSP header string.
 * Format: "directive1 src1 src2; directive2 src3; ..."
 */
export function serializeCspDirectives(directives: CspDirectives): string {
  return Object.entries(directives)
    .filter(([, value]) => value && value.length > 0)
    .map(([directive, value]) => {
      if (!value || value.length === 0) return null
      return `${directive} ${(value as string[]).join(' ')}`
    })
    .filter(Boolean)
    .join('; ')
}

/**
 * Build the CSP header value string for a given subapp.
 *
 * @param subapp - The subapp identifier (e.g. 'org', 'cloud', 'docs')
 * @param options.isDev - Override development detection (default: NODE_ENV === 'development')
 * @returns CSP header value string ready to set as the Content-Security-Policy header
 */
export function buildCspHeader(subapp: string, options: { isDev?: boolean } = {}): string {
  const directives = buildCspDirectives(subapp, options)
  return serializeCspDirectives(directives)
}

/**
 * Build the value of the `Report-To` HTTP header (modern Reporting API).
 *
 * The header carries one or more reporting groups. The CSP `report-to` directive
 * references a group by name; the browser uses the matching endpoint URL here.
 *
 * Returned value is a single-line JSON object (NOT a JSON array — browsers accept
 * either, but the spec example uses bare object form for a single group). Multiple
 * groups can be emitted by calling this once per group and joining with commas.
 *
 * @param options.endpoint - Override endpoint URL (default: local /api/csp-report)
 * @param options.maxAgeSeconds - Browser cache lifetime for this group (default 126 days)
 * @returns Single-line JSON string suitable for the `Report-To` HTTP header value.
 */
export function buildReportToHeader(
  options: { endpoint?: string; maxAgeSeconds?: number } = {}
): string {
  const endpoint = options.endpoint ?? CSP_REPORT_LOCAL_PATH
  const maxAge = options.maxAgeSeconds ?? 10886400 // ~126 days
  const group = {
    group: CSP_REPORT_TO_GROUP,
    max_age: maxAge,
    endpoints: [{ url: endpoint }],
  }
  return JSON.stringify(group)
}

/**
 * Build the full HTTP security header key-value record for a given subapp.
 * Includes CSP + supplementary headers (HSTS, X-Frame-Options, X-Content-Type-Options)
 * + Report-To (modern Reporting API endpoint group).
 *
 * @param subapp - The subapp identifier
 * @param options.isDev - Override development detection
 * @param options.mode - CSP enforcement mode (default: 'report-only').
 *   - 'report-only': emits `Content-Security-Policy-Report-Only` — browsers log violations
 *     but do NOT block resources. Safe default at A4-T01; use for rollout and audit.
 *   - 'enforce': emits `Content-Security-Policy` — browsers block violating resources.
 *     Switch to enforce in A4-T03/T04 after validating zero false-positive violations in
 *     report-only mode across all 13 subapps.
 * @returns Record of header name → header value
 */
export function buildCspHeaderObject(
  subapp: string,
  options: { isDev?: boolean; mode?: 'report-only' | 'enforce' } = {}
): Record<string, string> {
  const cspValue = buildCspHeader(subapp, options)
  const mode = options.mode ?? 'report-only'
  const cspHeaderKey =
    mode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only'

  // Supplementary security headers (HSTS, X-Frame-Options, X-Content-Type-Options,
  // Referrer-Policy, Permissions-Policy) are defined in security-headers.ts (A4-T04).
  // Report-To declares the modern Reporting API endpoint group referenced by the
  // CSP `report-to` directive (A4-T05).
  return {
    [cspHeaderKey]: cspValue,
    'Report-To': buildReportToHeader(),
    ...buildSecurityHeaders(),
  }
}

/**
 * Returns all known subapp names.
 * Useful for iterating all 13 subapps in next.config.ts generators.
 */
export const KNOWN_SUBAPPS = Object.keys(SUBAPP_EXTENSIONS) as string[]
