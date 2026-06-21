/**
 * native.helpers.ts — Internal helpers for NativeAuthStrategy.
 *
 * Purpose: Constants, response types, and pure helper functions extracted from
 *          native.ts to keep NativeAuthStrategy under the 300-line file cap.
 *          All exports are package-internal — not re-exported from index.ts.
 *
 * Inputs:  AuthConfig fields (authBaseUrl), TokenPair, UserProfile types.
 * Outputs: SECURE_STORE_KEYS, DEFAULT_AUTH_BASE_URL, SIGNIN_PATH, SIGNOUT_PATH,
 *          SignInResponse (type), parseSignInResponse(), decodeUserFromJwt().
 * Constraints:
 *   - These are pure functions / constants — no class state, no side effects.
 *   - NEVER log accessToken — even in helpers.
 *   - Do NOT re-export from auth-core index.ts (internal detail).
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/auth-core (NativeAuthStrategy)
 */

import type { TokenPair, UserProfile } from './types.js';
import type { AppError } from '@nself/errors';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default nHost Auth base URL. */
export const DEFAULT_AUTH_BASE_URL = 'https://api.nself.org/v1/auth';

/** nHost sign-in endpoint. */
export const SIGNIN_PATH = '/signin/email-password';

/** nHost sign-out endpoint. */
export const SIGNOUT_PATH = '/signout';

/** SecureStore keys — namespaced to avoid collisions with other packages. */
export const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: '@nself/auth-core/accessToken',
  REFRESH_TOKEN: '@nself/auth-core/refreshToken',
  EXPIRES_AT: '@nself/auth-core/expiresAt',
  USER_PROFILE: '@nself/auth-core/userProfile',
} as const;

// ─── Response types ───────────────────────────────────────────────────────────

export interface SignInResponse {
  session?: {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresIn?: number;
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

/**
 * makeAuthFailedError — build a typed auth_failed AppError.
 *
 * Purpose: Centralise error construction for consistent code/status across
 *          all auth failure paths in NativeAuthStrategy.
 * Inputs:  message — human-readable failure reason.
 * Outputs: AppError with code='auth_failed', status=401.
 * Constraints: Pure function. No logging.
 */
export function makeAuthFailedError(message: string): AppError {
  return { code: 'auth_failed', message, status: 401 };
}

/**
 * parseSignInResponse — validate and extract session fields from sign-in body.
 *
 * Purpose: Extracted from NativeAuthStrategy.login() to keep that method
 *          under 50 lines. Returns TokenPair + UserProfile on success, or
 *          an AppError string on malformed/missing fields.
 * Inputs:  body — raw parsed JSON from the sign-in endpoint.
 * Outputs: { tokenPair, user } on success; { error: string } on failure.
 * Constraints: Pure function — no side effects, no network calls.
 */
export function parseSignInResponse(
  body: SignInResponse,
): { tokenPair: TokenPair; user: UserProfile } | { error: string } {
  const session = body.session;
  if (
    !session?.accessToken ||
    !session.refreshToken ||
    typeof session.accessTokenExpiresIn !== 'number' ||
    !session.user?.id ||
    !session.user.email
  ) {
    return { error: 'Malformed sign-in response: missing session fields' };
  }
  return {
    tokenPair: {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: Date.now() + session.accessTokenExpiresIn * 1_000,
    },
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName ?? '',
      roles: session.user.roles ?? [],
      defaultRole: session.user.defaultRole ?? 'user',
    },
  };
}

/**
 * decodeUserFromJwt — extract UserProfile from a JWT access token payload.
 *
 * Purpose: Reads user identity from Hasura-issued JWT without a network round-trip.
 *          Used on init() to restore authenticated state from SecureStore.
 * Inputs:  accessToken — raw JWT string. NEVER log this value.
 * Outputs: UserProfile on success; null if token is malformed or missing claims.
 * Constraints: Pure function. Catches JSON.parse errors silently (returns null).
 */
export function decodeUserFromJwt(accessToken: string): UserProfile | null {
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;
    const claims = payload['https://hasura.io/jwt/claims'] as Record<string, unknown> | undefined;
    const id = typeof payload['sub'] === 'string' ? payload['sub'] : null;
    const email = typeof payload['email'] === 'string' ? payload['email'] : null;
    if (!id || !email) return null;
    return {
      id,
      email,
      displayName: typeof payload['display_name'] === 'string' ? payload['display_name'] : '',
      roles: Array.isArray(claims?.['x-hasura-allowed-roles'])
        ? (claims['x-hasura-allowed-roles'] as string[])
        : [],
      defaultRole:
        typeof claims?.['x-hasura-default-role'] === 'string'
          ? (claims['x-hasura-default-role'] as string)
          : 'user',
    };
  } catch {
    return null;
  }
}
