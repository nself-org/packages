# @nself-web/csp

Content Security Policy foundation for all 13 nSelf web subapps.

This package is the single source of truth for CSP policy across the entire `web/` monorepo. It provides a base policy that all subapps inherit, plus per-subapp extension maps for sources that are only needed in specific contexts (e.g., Stripe domains for `org` and `cloud`).

**Ticket:** A4-T01 — CSP policy design and shared config module

---

## Quick start

```ts
// web/org/next.config.ts
import { buildCspHeaderObject } from '@nself-web/csp'

const securityHeaders = async () => [{
  source: '/(.*)',
  headers: Object.entries(buildCspHeaderObject('org')).map(([key, value]) => ({
    key,
    value,
  })),
}]

export default {
  // ...
  headers: securityHeaders,
}
```

> **Default mode is `report-only`.**  `buildCspHeaderObject` emits
> `Content-Security-Policy-Report-Only` by default (A4-T01 spec). Browsers log
> violations to the `report-uri` endpoint but do **not** block resources. Switch to
> `mode: 'enforce'` in A4-T03/T04 after verifying zero false-positive violations.

```ts
// Enforce mode (A4-T03/T04 — not yet)
buildCspHeaderObject('org', { mode: 'enforce' })
// → emits Content-Security-Policy (blocking)

// Report-only mode (A4-T01 default)
buildCspHeaderObject('org', { mode: 'report-only' })
buildCspHeaderObject('org')  // same — report-only is the default
// → emits Content-Security-Policy-Report-Only (logging only)
```

---

## API

### `buildCspHeader(subapp, options?): string`

Returns the `Content-Security-Policy` header value string for the given subapp.

```ts
buildCspHeader('org')  // → "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; ..."
```

### `buildCspHeaderObject(subapp, options?): Record<string, string>`

Returns a full security header bundle. Accepts an optional `mode` option (see below).

By default (`mode: 'report-only'`), the CSP key is `Content-Security-Policy-Report-Only`.
Set `mode: 'enforce'` to emit `Content-Security-Policy` (blocking mode).

Headers included:

- `Content-Security-Policy-Report-Only` (default) or `Content-Security-Policy` (enforce mode)
- `Strict-Transport-Security` (HSTS — see note below)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (restricts camera, microphone, geolocation, payment)

### `buildCspDirectives(subapp, options?): CspDirectives`

Returns the raw directive object for inspection and testing.

### `serializeCspDirectives(directives): string`

Converts a `CspDirectives` object to a header string.

### `KNOWN_SUBAPPS: string[]`

Array of all 13 registered subapp names.

---

## Options

Both `buildCspHeader` and `buildCspHeaderObject` accept an optional second argument:

```ts
{
  isDev?: boolean
  mode?: 'report-only' | 'enforce'  // buildCspHeaderObject only; default: 'report-only'
}
```

**`isDev`:** When `true` (or `NODE_ENV === 'development'`), `ws://localhost:*` and `http://localhost:*` are added to `connect-src` to allow Next.js hot-module replacement WebSocket connections.

**`mode`** (`buildCspHeaderObject` only):
- `'report-only'` (default): emits `Content-Security-Policy-Report-Only`. Browsers log violations to `report-uri` but do not block resources. Use this during initial rollout (A4-T01) to audit the policy without risk.
- `'enforce'`: emits `Content-Security-Policy`. Browsers actively block violating resources. Switch to this in A4-T03/T04 after confirming zero false-positive violations across all 13 subapps.

---

## Base policy

Every subapp inherits this base policy:

| Directive | Value |
|-----------|-------|
| `default-src` | `'self'` |
| `script-src` | `'self' 'unsafe-inline'` |
| `style-src` | `'self' 'unsafe-inline'` |
| `img-src` | `'self' data: https:` |
| `font-src` | `'self' https://fonts.gstatic.com` |
| `connect-src` | `'self' https://api.nself.org https://ping.nself.org` |
| `frame-src` | `'none'` |
| `object-src` | `'none'` |
| `base-uri` | `'self'` |
| `form-action` | `'self'` |
| `report-uri` | `https://csp-report.nself.org/csp-violations` (stub — see P98) |

---

## `unsafe-inline` rationale

### script-src

`'unsafe-inline'` is required in `script-src` because Next.js App Router (RSC) injects inline `<script>` tags for hydration data (`__NEXT_DATA__`, RSC payload chunks). These scripts are generated at request time and cannot be nonce-tagged in the current Next.js 14/15 SSR pipeline without experimental nonce support that is not yet stable.

**Do NOT remove `'unsafe-inline'` from `script-src` without first confirming that Next.js nonce injection works end-to-end across all RSC routes and streaming boundaries.**

Once Next.js ships stable nonce support, the migration path is:
1. Add a `generateNonce()` call in the Next.js middleware
2. Replace `'unsafe-inline'` with `'nonce-{nonce}'` in `script-src`
3. Add `'strict-dynamic'` to allow nonce-trusted scripts to load others

Reference: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy

### style-src

Tailwind CSS v3 (used across all 13 subapps) and some animation libraries emit inline `style` attributes and `<style>` blocks at runtime. `'unsafe-inline'` is required to avoid breaking these.

---

## Stripe allowlist (A4-T01, A4-T03)

The following Stripe domains are added to `org` and `cloud` subapp policies:

| Domain | Directives | Purpose |
|--------|-----------|---------|
| `https://js.stripe.com` | `script-src`, `frame-src` | Stripe.js payment form + 3DS challenge frames |
| `https://billing.stripe.com` | `frame-src` | Stripe Customer Portal embedded iframe |
| `https://hooks.stripe.com` | `connect-src` | Stripe webhook event JS |

These domains are NOT added to `ntv`, `ntask`, `docs`, `nchat`, `nclaw`, `nfamily`, `clawde`, `base`, `install`, or `status` subapps. Scope is intentionally narrow.

### Why billing.stripe.com is in frame-src only

`https://billing.stripe.com` hosts the Stripe Customer Portal — an embedded iframe that lets subscribers manage their plan, payment method, and cancellation. It requires `frame-src` access. It does not need `script-src` (the portal JS runs inside the iframe, not the parent page) or `connect-src` (no direct fetch from the parent page to billing.stripe.com).

---

## CSRF protection for Stripe checkout (A4-T03 / SEC-13)

`@nself-web/csp` exports CSRF utilities for protecting the Stripe checkout POST handler.

### Threat model

Without CSRF protection, an attacker can forge a POST to `/api/checkout` from a different origin (e.g., an evil site the user visits). The browser would send the user's session cookies automatically. CSRF protection prevents the attacker from constructing a valid request header.

### Implementation: double-submit cookie pattern

1. **Before rendering the checkout form**, call `GET /api/checkout`.
   The response sets two cookies and returns `{ csrfToken }`:
   - `__csrf` — HttpOnly, Secure, SameSite=Strict (server reads this)
   - `__csrf_token` — Secure, SameSite=Strict, JS-readable (client reads this)

2. **Client reads `__csrf_token`** from document.cookie and injects it as:
   ```
   X-CSRF-Token: <token-value>
   ```

3. **`POST /api/checkout`** validates: `X-CSRF-Token header === __csrf cookie` (constant-time comparison).
   Returns `403` on mismatch.

### Why SameSite=Strict + double-submit is sufficient

- SameSite=Strict prevents the browser from sending `__csrf` on cross-origin navigations, so an attacker cannot supply the cookie.
- HttpOnly prevents XSS from reading the authoritative `__csrf` cookie.
- The attacker cannot read `__csrf_token` from a different origin (same-origin policy).
- Therefore: an attacker cannot know the token value, cannot supply the header, and cannot pass validation.

### Using the CSRF utilities

```ts
import {
  generateCsrfToken,
  validateCsrfToken,
  buildCsrfCookieHeader,
  buildCsrfClientCookieHeader,
  CSRF_COOKIE_HTTPONLY,
  CSRF_HEADER,
} from '@nself-web/csp'

// Generate a token (server-side, on page load):
const token = await generateCsrfToken()  // 64-char hex, 32-byte entropy

// Build Set-Cookie headers:
buildCsrfCookieHeader(token)          // __csrf=<token>; HttpOnly; Secure; SameSite=Strict; ...
buildCsrfClientCookieHeader(token)    // __csrf_token=<token>; Secure; SameSite=Strict; ...

// Validate on POST:
const headerToken = request.headers.get(CSRF_HEADER)               // X-CSRF-Token
const cookieToken = request.cookies.get(CSRF_COOKIE_HTTPONLY)?.value  // __csrf
validateCsrfToken(headerToken, cookieToken)  // true if match, false if mismatch/missing
```

### Token properties

- **Entropy:** 32 bytes (256 bits) from `globalThis.crypto.getRandomValues`
- **Encoding:** lowercase hex (64 chars)
- **TTL:** 1 hour (Max-Age=3600)
- **Comparison:** constant-time XOR loop — no timing attack surface
- **Validation rejects:** null, undefined, empty string, wrong length, mismatch

---

## HSTS (A4-T04 / SEC-18)

The `buildCspHeaderObject` function includes:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

This header is defined in `src/security-headers.ts` (`BASE_SECURITY_HEADERS`) and merged into `buildCspHeaderObject` output for all 13 subapps. You can also import the headers directly:

```ts
import { buildSecurityHeaders, BASE_SECURITY_HEADERS } from '@nself-web/csp'

// Full supplementary header bundle (HSTS + X-Frame-Options + X-Content-Type-Options + …)
buildSecurityHeaders()

// Override one header for a specific subapp
buildSecurityHeaders({ 'Permissions-Policy': 'camera=(self), microphone=(self)' })
```

The `preload` directive signals intent to be included in the HSTS preload list baked into browsers. **Submitting to the preload list is irreversible** — once submitted, removing HTTPS becomes impossible without browser update propagation.

**Future step:** submit `nself.org` to https://hstspreload.org only after explicit user approval. The `preload` directive in the header is safe to ship without submission. Verify all 13 subdomains serve HTTPS before submitting.

---

## Adding a new source to an existing subapp

Edit `SUBAPP_EXTENSIONS` in `src/policy.ts`:

```ts
const SUBAPP_EXTENSIONS = {
  org: {
    'connect-src': [
      "'self'",
      'https://api.nself.org',
      'https://ping.nself.org',
      'https://api.github.com',
      'https://hooks.stripe.com',
      'https://new-service.example.com',  // ← add here
    ],
  },
}
```

Extension arrays fully replace the base policy's directive value for that subapp. Always include `'self'` and any base policy values you want to preserve.

---

## Adding a new subapp

1. Add an entry to `SUBAPP_EXTENSIONS` in `src/policy.ts`:
   ```ts
   mynewapp: {},  // empty = base policy only
   ```
2. Pass the identifier to `buildCspHeader('mynewapp')` in the subapp's `next.config.ts`.
3. Add a test case in `tests/policy.test.ts`.

---

## `report-uri` (P98)

The `report-uri https://csp-report.nself.org/csp-violations` directive is a stub. Browsers will send CSP violation reports to this URL, but no endpoint is implemented yet.

Full implementation is tracked as a P98 task:
- Cloudflare Worker to receive `application/csp-report` POST requests
- Store violations in a structured log (D1 or R2)
- Dashboard in `base.nself.org` to review violations over time

Until then, violation reports will 404 silently — this is safe and expected.

---

## Applied subapps

All 13 subapps are configured (A4-T02):

| Subapp | Has Stripe | Stripe domains |
|--------|-----------|---------------|
| `org` | Yes | js.stripe.com, billing.stripe.com, hooks.stripe.com |
| `cloud` | Yes | js.stripe.com, billing.stripe.com, hooks.stripe.com |
| `docs` | No | — |
| `install` | No | — |
| `ntask` | No | — |
| `nchat` | No | — |
| `nclaw` | No | — |
| `nfamily` | No | — |
| `ntv` | No | — |
| `clawde` | No | — |
| `base` | No | — |
| `status` | No | — |
| `nself` | No | — |

---

## CI smoke test (A4-T05)

A two-stage CSP smoke test workflow runs on every PR that touches `packages/csp/**` or `org/next.config.ts`.
See `.github/workflows/csp-smoke.yml`.

**Stage 1 — Static validation (always runs, fast):**

```bash
pnpm --filter @nself-web/csp test
```

Verifies the CSP package builds, type-checks, and all unit tests pass. Also asserts:
- HSTS header present for all 13 subapps (SEC-18)
- No `unsafe-eval` in any subapp CSP (CR-C gate)
- Stripe domains scoped to `org` + `cloud` only

**Stage 2 — Playwright smoke (runs against web/org local server):**

```bash
# Start web/org dev server first
pnpm --filter @nself-web/org dev &

# Run CSP violation smoke test
CSP_SMOKE_BASE_URL=http://localhost:3010 pnpm exec playwright test tests/security/csp-smoke.spec.ts

# Or against staging
CSP_SMOKE_BASE_URL=https://nself.org pnpm exec playwright test tests/security/csp-smoke.spec.ts
```

The Playwright spec is at `tests/security/csp-smoke.spec.ts`. It:
- Navigates `/`, `/pricing`, and `/install` on web/org
- Captures all `console.error` messages from Chromium
- Fails if any message matches Chromium's CSP violation pattern
- Verifies the required security headers in the server response
