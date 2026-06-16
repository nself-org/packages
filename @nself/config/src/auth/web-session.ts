/**
 * Web session getter — httpOnly cookie transport for Astro + Vite SPA surfaces.
 *
 * Purpose: Retrieve the current session by calling /api/auth/session, which reads
 *          the httpOnly refresh cookie (set server-side) and returns a short-lived
 *          access token + session payload. The httpOnly cookie is sent automatically
 *          by the browser when credentials:'include' is set — it cannot be read by JS.
 *
 * Inputs:  None (browser attaches httpOnly cookie automatically).
 * Outputs: Session | null — null means unauthenticated or session expired.
 *
 * Constraints:
 *   - MUST use `credentials: 'include'` — without this the browser does NOT send
 *     httpOnly cookies on fetch requests, even to same-site origins.
 *   - NEVER reads localStorage, sessionStorage, or URL params for the token.
 *     These patterns are banned — see ADR: auth-transport-security.md.
 *   - The /api/auth/session endpoint is implemented per-app (E2/E3 web tickets).
 *     This helper only defines the fetch contract.
 *
 * SPORT: F08-SERVICE-INVENTORY.md — auth_server service (dual-transport ADR authored)
 * ADR:   .claude/docs/decisions/auth-transport-security.md
 * Refs:  T-P3-E1-W3-S6-T11 (this ticket), T-P3-E1-W2-S4-T08 (@nself/gql getSession)
 */

import type { Session } from '@nself/types';

/**
 * Fetches the current web session by calling /api/auth/session.
 *
 * The browser automatically sends the httpOnly refresh cookie when
 * `credentials: 'include'` is set. The server validates the cookie and
 * returns a short-lived access token + session payload in the response body.
 *
 * Returns null when:
 * - The user is not authenticated (no cookie, or cookie expired)
 * - The /api/auth/session endpoint returns a non-2xx response
 * - The response cannot be parsed as a Session
 *
 * @example
 * // In @nself/gql getSession callback (web surface):
 * const getSession = () => getWebSession();
 */
export async function getWebSession(): Promise<Session | null> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'GET',
      // REQUIRED: sends the httpOnly cookie. Without this flag the browser
      // silently omits the cookie and the server returns 401.
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json() as Promise<Session>;
  } catch {
    // Network failure or JSON parse error — treat as unauthenticated.
    return null;
  }
}
