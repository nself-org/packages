/**
 * refresh.ts — JWT refresh loop for @nself/auth-core.
 *
 * Purpose: Schedule a proactive token refresh at (expiresAt - bufferMs), call
 *          the nHost /token/refresh endpoint, and emit the new TokenPair or an
 *          AuthError signal to the caller. Handles the 401 case from the refresh
 *          endpoint by emitting 'unauthenticated' without looping infinitely.
 * Inputs:  TokenPair, refresh endpoint URL, onRefresh callback, optional buffer ms.
 * Outputs: A cancel function that clears the pending timeout.
 * Constraints:
 *   - No debug logging calls — tokens must never be logged to any console.
 *   - On 401 from refresh endpoint → emit AuthRefreshError, do NOT retry.
 *   - Uses setTimeout for scheduling — callers inject fake timers in tests.
 *   - fetchFn is injectable so tests use a mock without touching globalThis.fetch.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/auth-core (refresh loop)
 */

import type { TokenPair } from './types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Emitted when a refresh succeeds — caller updates AuthState to authenticated. */
export interface AuthRefreshSuccess {
  readonly kind: 'success';
  readonly tokenPair: TokenPair;
}

/** Emitted when the refresh endpoint returns 401 — session is truly expired. */
export interface AuthRefreshExpired {
  readonly kind: 'expired';
}

/** Emitted when the refresh fails for a non-401 reason (network, server error). */
export interface AuthRefreshError {
  readonly kind: 'error';
  readonly message: string;
}

export type RefreshResult = AuthRefreshSuccess | AuthRefreshExpired | AuthRefreshError;

/**
 * Callback invoked when a refresh attempt completes (success, expired, or error).
 */
export type OnRefreshResult = (result: RefreshResult) => void;

/**
 * Shape of the raw nHost /token/refresh response body on success.
 */
interface NhostRefreshResponse {
  session?: {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresIn?: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default milliseconds before expiry to trigger a proactive refresh. */
export const DEFAULT_REFRESH_BUFFER_MS = 60_000;

/** nHost refresh endpoint path relative to authBaseUrl. */
export const REFRESH_PATH = '/token/refresh';

// ─── Core refresh logic ───────────────────────────────────────────────────────

/**
 * callRefresh — call the nHost /token/refresh endpoint with the current refresh token.
 *
 * Returns a RefreshResult — never throws. On 401, emits 'expired'. On other
 * non-OK status or network failure, emits 'error'.
 *
 * @param authBaseUrl  nHost Auth base URL (e.g. 'https://api.nself.org/v1/auth')
 * @param refreshToken Current refresh token — DO NOT LOG this value.
 * @param fetchFn      Fetch implementation — injectable for tests.
 */
export async function callRefresh(
  authBaseUrl: string,
  refreshToken: string,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<RefreshResult> {
  let response: Response;
  try {
    response = await fetchFn(`${authBaseUrl}${REFRESH_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return { kind: 'error', message: 'Network error during token refresh' };
  }

  if (response.status === 401) {
    return { kind: 'expired' };
  }

  if (!response.ok) {
    return { kind: 'error', message: `Refresh failed: HTTP ${String(response.status)}` };
  }

  let body: NhostRefreshResponse;
  try {
    body = (await response.json()) as NhostRefreshResponse;
  } catch {
    return { kind: 'error', message: 'Invalid JSON in refresh response' };
  }

  const session = body.session;
  if (
    typeof session?.accessToken !== 'string' ||
    typeof session.refreshToken !== 'string' ||
    typeof session.accessTokenExpiresIn !== 'number'
  ) {
    return { kind: 'error', message: 'Malformed refresh response from nHost' };
  }

  const tokenPair: TokenPair = {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: Date.now() + session.accessTokenExpiresIn * 1_000,
  };

  return { kind: 'success', tokenPair };
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

/**
 * scheduleRefresh — schedule a proactive token refresh before the token expires.
 *
 * Fires the refresh at (tokenPair.expiresAt - bufferMs). If the token is already
 * within the buffer window (or expired), fires immediately via setTimeout(fn, 0).
 *
 * @param tokenPair    Current token pair — expiresAt drives scheduling.
 * @param onRefresh    Callback invoked with the RefreshResult when done.
 * @param authBaseUrl  nHost Auth service base URL.
 * @param bufferMs     Milliseconds before expiry to trigger refresh. Default: 60_000.
 * @param fetchFn      Fetch implementation — injectable for tests.
 * @returns            Cancel function — call to clear the pending timeout.
 */
export function scheduleRefresh(
  tokenPair: TokenPair,
  onRefresh: OnRefreshResult,
  authBaseUrl: string,
  bufferMs: number = DEFAULT_REFRESH_BUFFER_MS,
  fetchFn: typeof fetch = globalThis.fetch,
): () => void {
  const delay = Math.max(0, tokenPair.expiresAt - Date.now() - bufferMs);
  let cancelled = false;

  const handle = setTimeout(() => {
    if (cancelled) return;
    void callRefresh(authBaseUrl, tokenPair.refreshToken, fetchFn).then((result) => {
      if (!cancelled) onRefresh(result);
    });
  }, delay);

  return () => {
    cancelled = true;
    clearTimeout(handle);
  };
}
