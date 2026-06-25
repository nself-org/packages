/**
 * native.ts — Bearer token + SecureStore auth strategy for @nself/auth-core.
 *
 * Purpose: Implement AuthStrategy for React Native and Tauri desktop surfaces.
 *          Stores TokenPair in the platform's secure key-value store (via the
 *          SecureStoreInterface abstraction), manages the refresh loop via
 *          scheduleRefresh(), and exposes getAccessToken() for authExchange.
 * Inputs:  SecureStoreInterface, AuthConfig, optional fetchFn for tests.
 * Outputs: NativeAuthStrategy implementing AuthStrategy.
 * Constraints:
 *   - NEVER log accessToken or refreshToken — DO NOT pass them to console.*.
 *   - SecureStore keys use namespaced constants (SECURE_STORE_KEYS).
 *   - On init, reads existing TokenPair from SecureStore; if absent → unauthenticated.
 *   - Refresh loop cancels on logout and re-schedules on every successful refresh.
 *   - On 401 from refresh → emit unauthenticated, do NOT retry (no infinite loop).
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/auth-core (NativeAuthStrategy)
 */

import type {
  AuthState,
  AuthConfig,
  AuthStrategy,
  SecureStoreInterface,
  TokenPair,
} from './types.js';
import {
  scheduleRefresh,
  callRefresh,
  DEFAULT_REFRESH_BUFFER_MS,
  type RefreshResult,
} from './refresh.js';
import {
  DEFAULT_AUTH_BASE_URL,
  SIGNIN_PATH,
  SIGNOUT_PATH,
  SECURE_STORE_KEYS,
  type SignInResponse,
  makeAuthFailedError,
  parseSignInResponse,
  decodeUserFromJwt,
} from './native.helpers.js';

export { SECURE_STORE_KEYS } from './native.helpers.js';

// ─── NativeAuthStrategy ───────────────────────────────────────────────────────

/**
 * NativeAuthStrategy — Bearer token auth for React Native and Tauri desktop.
 *
 * Purpose: Full AuthStrategy implementation that persists tokens in the
 *          platform secure store and manages the token refresh lifecycle.
 * Inputs:  SecureStoreInterface, AuthConfig (optional), fetchFn (optional).
 * Outputs: AuthStrategy conformant class.
 * Constraints: See file-level constraints above. Internal helpers in native.helpers.ts.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/auth-core (NativeAuthStrategy)
 */
export class NativeAuthStrategy implements AuthStrategy {
  private readonly store: SecureStoreInterface;
  private readonly authBaseUrl: string;
  private readonly bufferMs: number;
  private readonly fetchFn: typeof fetch;
  private currentState: AuthState = { status: 'loading' };
  private listeners: Set<(state: AuthState) => void> = new Set();
  private cancelRefresh: (() => void) | null = null;

  constructor(
    store: SecureStoreInterface,
    config: AuthConfig = {},
    fetchFn: typeof fetch = globalThis.fetch,
  ) {
    this.store = store;
    this.authBaseUrl = config.authBaseUrl ?? DEFAULT_AUTH_BASE_URL;
    this.bufferMs = config.refreshBufferMs ?? DEFAULT_REFRESH_BUFFER_MS;
    this.fetchFn = fetchFn;
  }

  /** Initialise by reading TokenPair from SecureStore. */
  async init(): Promise<AuthState> {
    const tokenPair = await this.readTokenPair();
    if (!tokenPair) {
      const state: AuthState = { status: 'unauthenticated' };
      this.setState(state);
      return state;
    }

    const user = decodeUserFromJwt(tokenPair.accessToken);
    if (!user) {
      await this.clearTokenPair();
      const state: AuthState = { status: 'unauthenticated' };
      this.setState(state);
      return state;
    }

    const state: AuthState = {
      status: 'authenticated',
      user,
      jwt: tokenPair.accessToken,
    };
    this.setState(state);
    this.startRefreshLoop(tokenPair);
    return state;
  }

  /** Return current JWT access token for Authorization header injection. DO NOT LOG. */
  getAccessToken(): string | null {
    if (this.currentState.status === 'authenticated') {
      return this.currentState.jwt;
    }
    return null;
  }

  /** Sign in with email + password. Stores TokenPair in SecureStore. */
  async login(email: string, password: string): Promise<AuthState> {
    let response: Response;
    try {
      response = await this.fetchFn(`${this.authBaseUrl}${SIGNIN_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const state: AuthState = { status: 'error', error: makeAuthFailedError('Invalid sign-in response from nHost') };
      this.setState(state);
      return state;
    }

    const parsed = parseSignInResponse(body);
    if ('error' in parsed) {
      const state: AuthState = { status: 'error', error: makeAuthFailedError(parsed.error) };
      this.setState(state);
      return state;
    }

    const { tokenPair, user } = parsed;
    await this.writeTokenPair(tokenPair);
    const state: AuthState = { status: 'authenticated', user, jwt: tokenPair.accessToken };
    this.setState(state);
    this.startRefreshLoop(tokenPair);
    return state;
  }

  /** Sign out — clears SecureStore and stops refresh loop. */
  async logout(): Promise<AuthState> {
    this.stopRefreshLoop();
    const currentToken = this.getAccessToken();
    if (currentToken) {
      try {
        await this.fetchFn(`${this.authBaseUrl}${SIGNOUT_PATH}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch {
        // Best-effort — clear local state regardless.
      }
    }
    await this.clearTokenPair();
    const state: AuthState = { status: 'unauthenticated' };
    this.setState(state);
    return state;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  /**
   * refresh — imperatively refresh the access token.
   *
   * Called by authExchange on didAuthError (Hasura JWT_INVALID). Cancels any
   * pending scheduled refresh, calls nHost immediately, updates state + SecureStore.
   */
  async refresh(): Promise<AuthState> {
    this.stopRefreshLoop();
    const tokenPair = await this.readTokenPair();
    if (!tokenPair) {
      const state: AuthState = { status: 'unauthenticated' };
      this.setState(state);
      return state;
    }

    const result = await callRefresh(this.authBaseUrl, tokenPair.refreshToken, this.fetchFn);
    return this.applyRefreshResult(result);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private startRefreshLoop(tokenPair: TokenPair): void {
    this.stopRefreshLoop();
    this.cancelRefresh = scheduleRefresh(
      tokenPair,
      (result) => { void this.applyRefreshResult(result); },
      this.authBaseUrl,
      this.bufferMs,
      this.fetchFn,
    );
  }

  private stopRefreshLoop(): void {
    this.cancelRefresh?.();
    this.cancelRefresh = null;
  }

  private async applyRefreshResult(result: RefreshResult): Promise<AuthState> {
    if (result.kind === 'expired') {
      await this.clearTokenPair();
      const state: AuthState = { status: 'unauthenticated' };
      this.setState(state);
      return state;
    }

    if (result.kind === 'error') {
      // On transient error, don't clear tokens — leave state as-is for now.
      // The next scheduled refresh will retry (once the next expiry window opens).
      return this.currentState;
    }

    // success
    const { tokenPair } = result;
    await this.writeTokenPair(tokenPair);

    const user = decodeUserFromJwt(tokenPair.accessToken);
    if (!user) {
      await this.clearTokenPair();
      const state: AuthState = { status: 'unauthenticated' };
      this.setState(state);
      return state;
    }

    const state: AuthState = { status: 'authenticated', user, jwt: tokenPair.accessToken };
    this.setState(state);
    this.startRefreshLoop(tokenPair);
    return state;
  }

  private setState(state: AuthState): void {
    this.currentState = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  private async readTokenPair(): Promise<TokenPair | null> {
    const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
      this.store.get(SECURE_STORE_KEYS.ACCESS_TOKEN),
      this.store.get(SECURE_STORE_KEYS.REFRESH_TOKEN),
      this.store.get(SECURE_STORE_KEYS.EXPIRES_AT),
    ]);

    if (!accessToken || !refreshToken || !expiresAtStr) return null;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt)) return null;

    return { accessToken, refreshToken, expiresAt };
  }

  private async writeTokenPair(tokenPair: TokenPair): Promise<void> {
    await Promise.all([
      this.store.set(SECURE_STORE_KEYS.ACCESS_TOKEN, tokenPair.accessToken),
      this.store.set(SECURE_STORE_KEYS.REFRESH_TOKEN, tokenPair.refreshToken),
      this.store.set(SECURE_STORE_KEYS.EXPIRES_AT, String(tokenPair.expiresAt)),
    ]);
  }

  private async clearTokenPair(): Promise<void> {
    await Promise.all([
      this.store.delete(SECURE_STORE_KEYS.ACCESS_TOKEN),
      this.store.delete(SECURE_STORE_KEYS.REFRESH_TOKEN),
      this.store.delete(SECURE_STORE_KEYS.EXPIRES_AT),
    ]);
  }
}

/** createNativeAuthStrategy — factory; see class for param docs. */
export function createNativeAuthStrategy(
  store: SecureStoreInterface,
  config: AuthConfig = {},
  fetchFn: typeof fetch = globalThis.fetch,
): AuthStrategy {
  return new NativeAuthStrategy(store, config, fetchFn);
}
