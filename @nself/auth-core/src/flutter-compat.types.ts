/**
 * flutter-compat.types.ts — Flutter SDK auth shim type definitions.
 *
 * Purpose: Public type contracts for the FlutterSDK-compatible auth shim.
 *          Extracted from flutter-compat.ts to respect the 300-line file cap.
 *
 * Inputs:  None — pure type declarations.
 * Outputs: FlutterAuthUser, FlutterAuthState, FlutterStorageBackend,
 *          BiometricUnavailableException, BiometricFailedException,
 *          SessionExpiredException, UnauthorizedException.
 * Constraints:
 *   - ALL of these are public API — exported from flutter-compat.ts and
 *     re-exported from auth-core/src/index.ts. Do NOT rename or remove.
 *   - Must not import from @nself/auth-core core modules (circular dep risk).
 * SPORT: T-P3-E4-W3-S7-T02 (plugins-pro auth flutter port)
 */

// ─── User model ────────────────────────────────────────────────────────────

/**
 * FlutterAuthUser — minimal authenticated user model.
 *
 * Mirrors the Flutter SDK FlutterAuthUser. All fields are readonly to
 * prevent accidental mutation; produce new objects via spread.
 */
export interface FlutterAuthUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Unix timestamp in milliseconds when the accessToken expires. */
  readonly accessTokenExpiry: number;
}

// ─── Auth state ────────────────────────────────────────────────────────────

/**
 * FlutterAuthState — discriminated union for auth lifecycle events.
 *
 * Consumers switch on `type` to handle each state:
 *   - unauthenticated: initial or signed-out state
 *   - loading: sign-in/sign-up in progress
 *   - authenticated: signed in, user available on `user` field
 *   - error: last operation failed, error on `error` field
 */
export type FlutterAuthState =
  | { type: 'unauthenticated' }
  | { type: 'loading' }
  | { type: 'authenticated'; user: FlutterAuthUser }
  | { type: 'error'; error: Error };

// ─── Error classes ─────────────────────────────────────────────────────────

/**
 * BiometricUnavailableException — thrown when the device has no biometric sensor,
 * or biometric authentication is disabled in platform settings.
 */
export class BiometricUnavailableException extends Error {
  constructor() {
    super('Biometric authentication not available');
    this.name = 'BiometricUnavailableException';
  }
}

/**
 * BiometricFailedException — thrown when the user fails biometric authentication
 * (wrong fingerprint, face mismatch, or cancelled).
 */
export class BiometricFailedException extends Error {
  constructor() {
    super('Biometric authentication failed');
    this.name = 'BiometricFailedException';
  }
}

/**
 * SessionExpiredException — thrown when the refresh token is missing or expired,
 * requiring the user to sign in again.
 */
export class SessionExpiredException extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredException';
  }
}

/**
 * UnauthorizedException — thrown when an operation requires authentication but
 * no user is currently signed in.
 */
export class UnauthorizedException extends Error {
  constructor() {
    super('User not authenticated');
    this.name = 'UnauthorizedException';
  }
}

// ─── Storage interface ─────────────────────────────────────────────────────

/**
 * FlutterStorageBackend — platform-agnostic secure key-value storage interface.
 *
 * Implementors: React Native (SecureStore/Keychain), web (sessionStorage + OPAQUE),
 * Tauri (keyring). Passed to NSelfAuthCompat.initialize({ secureStore }).
 */
export interface FlutterStorageBackend {
  /** Retrieve a stored value by key, or null if not present. */
  get(key: string): Promise<string | null>;
  /** Store a value under the given key. */
  set(key: string, value: string): Promise<void>;
  /** Remove the value stored under the given key. */
  delete(key: string): Promise<void>;
}
