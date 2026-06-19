/**
 * web.ts — Cookie-based auth strategy for @nself/auth-core (web surfaces only).
 *
 * Purpose: Implement AuthStrategy for browser surfaces using httpOnly cookie
 *          sessions. The browser NEVER sees the access token in JS — auth state
 *          is determined by calling /api/auth/me, which the server reads via its
 *          httpOnly session cookie. login()/logout() call nHost endpoints that
 *          set/clear the cookie.
 * Inputs:  AuthConfig (authBaseUrl, refreshBufferMs), optional fetchFn for tests.
 * Outputs: WebAuthStrategy implementing AuthStrategy.
 * Constraints:
 *   - NEVER read the cookie via JS — it is httpOnly (not accessible from JS at all).
 *   - NEVER write accessToken to any JS-accessible browser storage.
 *   - NEVER emit debug logs containing any token value.
 *   - Auth state is determined exclusively via /api/auth/me (server-side cookie read).
 *   - getAccessToken() returns null for web — the bearer token is not exposed to JS.
 *     The cookie is sent automatically by the browser on every same-origin request.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/auth-core (WebAuthStrategy)
 */

import type { AuthState, AuthConfig, AuthStrategy, UserProfile } from './types.js';
import type { AppError } from '@nself/errors';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default nHost Auth base URL. */
const DEFAULT_AUTH_BASE_URL = 'https://api.nself.org/v1/auth';

/** Path to the /api/auth/me endpoint that reads the httpOnly session cookie. */
const ME_PATH = '/api/auth/me';

/** nHost sign-in endpoint. */
const SIGNIN_PATH = '/signin/email-password';

/** nHost sign-out endpoint. */
const SIGNOUT_PATH = '/signout';

// ─── Response types ───────────────────────────────────────────────────────────

interface MeResponse {
  id?: string;
  email?: string;
  displayName?: string;
  roles?: string[];
  defaultRole?: string;
}

interface SignInResponse {
  session?: {
    user?: {
      id?: string;
      email?: string;
      displayName?: string;
      roles?: string[];
      defaultRole?: string;
    };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function meResponseToProfile(data: MeResponse): UserProfile | null {
  if (
    typeof data.id !== 'string' ||
    typeof data.email !== 'string'
  ) {
    return null;
  }
  return {
    id: data.id,
    email: data.email,
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    roles: Array.isArray(data.roles) ? (data.roles as string[]) : [],
    defaultRole: typeof data.defaultRole === 'string' ? data.defaultRole : 'user',
  };
}

function makeAuthFailedError(message: string): AppError {
  return {
    code: 'auth_failed',
    message,
    status: 401,
  };
}

/**
 * parseWebSignInResponse — extract UserProfile from web sign-in body.
 *
 * Purpose: Extracted from WebAuthStrategy.login() to keep that method
 *          under 50 lines. Web sign-in bodies only carry user fields
 *          (no token — tokens are in the httpOnly cookie).
 * Inputs:  body — raw parsed JSON from the sign-in endpoint.
 * Outputs: UserProfile on success; { error: string } on malformed body.
 * Constraints: Pure function — no side effects.
 */
function parseWebSignInResponse(
  body: SignInResponse,
): UserProfile | { error: string } {
  const sessionUser = body.session?.user;
  if (!sessionUser?.id || !sessionUser.email) {
    return { error: 'Malformed sign-in response: missing user fields' };
  }
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    displayName: sessionUser.displayName ?? '',
    roles: sessionUser.roles ?? [],
    defaultRole: sessionUser.defaultRole ?? 'user',
  };
}

/**
 * defaultMeBaseUrl — resolve the same-origin base for the /api/auth/me route.
 *
 * /api/auth/me is served by the app's own server (it reads the httpOnly cookie),
 * so it must hit the current origin — NOT the nHost authBaseUrl. Returns the
 * window origin in the browser, or '' (relative) when no origin is available
 * (SSR / tests), in which case fetch resolves the path against its own base.
 */
function defaultMeBaseUrl(): string {
  if (typeof globalThis !== 'undefined') {
    const loc = (globalThis as { location?: { origin?: string } }).location;
    if (loc && typeof loc.origin === 'string') return loc.origin;
  }
  return '';
}

// ─── WebAuthStrategy ──────────────────────────────────────────────────────────

/**
 * WebAuthStrategy — httpOnly cookie auth for browser surfaces.
 *
 * Auth state is determined by /api/auth/me — never by reading any JS-accessible
 * storage. Tokens never appear in JS at all on the web surface.
 */
export class WebAuthStrategy implements AuthStrategy {
  private readonly authBaseUrl: string;
  private readonly meBaseUrl: string;
  private readonly fetchFn: typeof fetch;
  private currentState: AuthState = { status: 'loading' };
  private listeners: Set<(state: AuthState) => void> = new Set();

  constructor(config: AuthConfig = {}, fetchFn: typeof fetch = globalThis.fetch) {
    this.authBaseUrl = config.authBaseUrl ?? DEFAULT_AUTH_BASE_URL;
    // /api/auth/me is a SAME-ORIGIN app-server route, NOT part of the nHost auth
    // service — it must never be prefixed with authBaseUrl. Default to the page
    // origin; fall back to a relative path when no window origin is available.
    this.meBaseUrl = config.meBaseUrl ?? defaultMeBaseUrl();
    this.fetchFn = fetchFn;
  }

  /** Initialise by calling /api/auth/me to check cookie session. */
  async init(): Promise<AuthState> {
    const state = await this.checkSession();
    this.setState(state);
    return state;
  }

  /**
   * getAccessToken — always returns null for web.
   *
   * The httpOnly cookie is sent automatically by the browser. No JS-visible
   * bearer token exists on the web surface. authExchange uses null to skip the
   * Authorization header — Hasura reads the session cookie instead.
   */
  getAccessToken(): null {
    return null;
  }

  /** Sign in with email + password via nHost. Sets httpOnly cookie on success. */
  async login(email: string, password: string): Promise<AuthState> {
    let response: Response;
    try {
      response = await this.fetchFn(`${this.authBaseUrl}${SIGNIN_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
    } catch {
      const state: AuthState = { status: 'error', error: makeAuthFailedError('Network error during sign-in') };
      this.setState(state);
      return state;
    }

    if (!response.ok) {
      const state: AuthState = { status: 'error', error: makeAuthFailedError(`Sign-in failed: HTTP ${String(response.status)}`) };
      this.setState(state);
      return state;
    }

    let body: SignInResponse;
    try {
      body = (await response.json()) as SignInResponse;
    } catch {
      const state: AuthState = { status: 'error', error: makeAuthFailedError('Invalid response from sign-in endpoint') };
      this.setState(state);
      return state;
    }

    const parsed = parseWebSignInResponse(body);
    if ('error' in parsed) {
      const state: AuthState = { status: 'error', error: makeAuthFailedError(parsed.error) };
      this.setState(state);
      return state;
    }

    // Web: jwt is empty string — token is in the httpOnly cookie, not JS-accessible.
    const state: AuthState = { status: 'authenticated', user: parsed, jwt: '' };
    this.setState(state);
    return state;
  }

  /** Sign out — nHost clears the httpOnly cookie. */
  async logout(): Promise<AuthState> {
    try {
      await this.fetchFn(`${this.authBaseUrl}${SIGNOUT_PATH}`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Best-effort — even if the network call fails, clear local state.
    }
    const state: AuthState = { status: 'unauthenticated' };
    this.setState(state);
    return state;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  /**
   * refresh — re-check session via /api/auth/me.
   *
   * On web, cookies are rotated server-side. We just re-read /me to confirm the
   * session is still valid after a 401 from Hasura.
   */
  async refresh(): Promise<AuthState> {
    const state = await this.checkSession();
    this.setState(state);
    return state;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async checkSession(): Promise<AuthState> {
    let response: Response;
    try {
      response = await this.fetchFn(`${this.meBaseUrl}${ME_PATH}`, {
        method: 'GET',
        credentials: 'include',
      });
    } catch {
      return { status: 'unauthenticated' };
    }

    if (response.status === 401) {
      return { status: 'unauthenticated' };
    }

    if (!response.ok) {
      return {
        status: 'error',
        error: makeAuthFailedError(`Session check failed: HTTP ${String(response.status)}`),
      };
    }

    let data: MeResponse;
    try {
      data = (await response.json()) as MeResponse;
    } catch {
      return { status: 'unauthenticated' };
    }

    const profile = meResponseToProfile(data);
    if (!profile) {
      return { status: 'unauthenticated' };
    }

    return { status: 'authenticated', user: profile, jwt: '' };
  }

  private setState(state: AuthState): void {
    this.currentState = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

/**
 * createWebAuthStrategy — factory for WebAuthStrategy.
 *
 * @param config   Optional AuthConfig overrides.
 * @param fetchFn  Optional fetch override for testing.
 */
export function createWebAuthStrategy(
  config: AuthConfig = {},
  fetchFn: typeof fetch = globalThis.fetch,
): AuthStrategy {
  return new WebAuthStrategy(config, fetchFn);
}
