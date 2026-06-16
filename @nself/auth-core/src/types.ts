/**
 * types.ts — Core type definitions for @nself/auth-core.
 *
 * Purpose: Define the canonical AuthState discriminated union, TokenPair,
 *          AuthConfig, SecureStoreInterface, and UserProfile used throughout
 *          auth-core and all nSelf surfaces that consume it.
 * Inputs:  None — pure type definitions.
 * Outputs: AuthState, TokenPair, AuthConfig, SecureStoreInterface, UserProfile,
 *          AuthStrategy interface.
 * Constraints:
 *   - AuthState must be a proper discriminated union (never optional fields for
 *     the discriminant). Only the authenticated variant carries user + jwt.
 *   - No token must ever appear in a log-visible position — jwt is typed but
 *     callers must not pass it to any logger.
 *   - SecureStoreInterface is a pure interface — implementations come from
 *     native-bridge (T-P3-E2-W3-S03-T01) and tauri-bridge.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/auth-core (types)
 */

import type { AppError } from '@nself/errors';

// ─── UserProfile ─────────────────────────────────────────────────────────────

/**
 * UserProfile — minimal user identity extracted from the nHost JWT claims.
 *
 * Intentionally minimal: only fields derivable from the JWT without an extra
 * /users/:id fetch. Additional profile data is fetched by apps via GraphQL.
 */
export interface UserProfile {
  /** nHost user UUID — stable, unique per user. */
  readonly id: string;
  /** Email address from JWT sub claim. */
  readonly email: string;
  /** Display name from JWT claims (may be empty string). */
  readonly displayName: string;
  /** Hasura roles granted to this user. */
  readonly roles: readonly string[];
  /** Default Hasura role for this request. */
  readonly defaultRole: string;
}

// ─── TokenPair ───────────────────────────────────────────────────────────────

/**
 * TokenPair — JWT access token + refresh token pair with expiry metadata.
 *
 * Used internally by NativeAuthStrategy and the refresh loop.
 * Never serialise accessToken to a client-side log.
 */
export interface TokenPair {
  /** JWT access token — DO NOT LOG. */
  readonly accessToken: string;
  /** Opaque refresh token for the nHost /token/refresh endpoint. */
  readonly refreshToken: string;
  /** Unix timestamp (ms) when accessToken expires. */
  readonly expiresAt: number;
}

// ─── SecureStoreInterface ─────────────────────────────────────────────────────

/**
 * SecureStoreInterface — platform-agnostic secure key-value storage.
 *
 * Implemented by native-bridge (Expo SecureStore) and tauri-bridge (keytar).
 * Web strategy never calls this — cookie-backed auth does not use JS storage.
 */
export interface SecureStoreInterface {
  /** Retrieve a value by key. Returns null if not found. */
  get(key: string): Promise<string | null>;
  /** Store a value under key. */
  set(key: string, value: string): Promise<void>;
  /** Delete a key. No-op if not found. */
  delete(key: string): Promise<void>;
}

// ─── AuthState ────────────────────────────────────────────────────────────────

/**
 * AuthState — discriminated union for all authentication states.
 *
 * Consumers switch on the `status` field:
 *   'loading'         — initial check in progress, no user data yet
 *   'unauthenticated' — verified no active session
 *   'authenticated'   — active session, user + jwt available
 *   'error'           — auth operation failed, error contains AppError
 *
 * CRITICAL: Only the 'authenticated' variant carries a jwt field.
 *           Never expose jwt to any logging call.
 */
export type AuthState =
  | { readonly status: 'loading' }
  | { readonly status: 'unauthenticated' }
  | {
      readonly status: 'authenticated';
      readonly user: UserProfile;
      /**
       * Current JWT access token — DO NOT LOG.
       * Used internally by authExchange to inject Authorization header.
       */
      readonly jwt: string;
    }
  | { readonly status: 'error'; readonly error: AppError };

// ─── AuthConfig ───────────────────────────────────────────────────────────────

/**
 * AuthConfig — configuration for auth strategy factories.
 */
export interface AuthConfig {
  /**
   * Base URL for the nHost Auth service.
   * Defaults to 'https://api.nself.org/v1/auth'.
   */
  readonly authBaseUrl?: string;
  /**
   * Milliseconds before token expiry to trigger a proactive refresh.
   * Default: 60_000 (60 seconds).
   */
  readonly refreshBufferMs?: number;
}

// ─── AuthStrategy ─────────────────────────────────────────────────────────────

/**
 * AuthStrategy — interface implemented by WebAuthStrategy and NativeAuthStrategy.
 *
 * Both strategies expose the same contract so authExchange and NselfAuthProvider
 * can work with either without knowing the transport.
 */
export interface AuthStrategy {
  /**
   * Initialise the strategy and return the initial AuthState.
   * For web: calls /api/auth/me via httpOnly cookie.
   * For native: reads TokenPair from SecureStore.
   */
  init(): Promise<AuthState>;

  /**
   * Return the current JWT access token, or null if unauthenticated.
   * Used by authExchange to inject the Authorization header.
   * DO NOT expose this value to any logger.
   */
  getAccessToken(): string | null;

  /**
   * Sign in with email + password.
   * Returns the resulting AuthState (authenticated on success, error on failure).
   */
  login(email: string, password: string): Promise<AuthState>;

  /**
   * Sign out and clear session.
   * Returns unauthenticated AuthState.
   */
  logout(): Promise<AuthState>;

  /**
   * Subscribe to AuthState changes. Returns an unsubscribe function.
   * Fired whenever the state transitions (e.g., token refresh completes).
   */
  subscribe(listener: (state: AuthState) => void): () => void;

  /**
   * Imperatively refresh the access token.
   * Called by authExchange on didAuthError (Hasura JWT_INVALID).
   * Returns the new AuthState.
   */
  refresh(): Promise<AuthState>;
}
