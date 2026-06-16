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
  UserProfile,
} from './types.js';
import type { AppError } from '@nself/errors';
import {
  scheduleRefresh,
  callRefresh,
  DEFAULT_REFRESH_BUFFER_MS,
  type RefreshResult,
} from './refresh.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default nHost Auth base URL. */
const DEFAULT_AUTH_BASE_URL = 'https://api.nself.org/v1/auth';

/** nHost sign-in endpoint. */
const SIGNIN_PATH = '/signin/email-password';

/** nHost sign-out endpoint. */
const SIGNOUT_PATH = '/signout';

/** SecureStore keys — namespaced to avoid collisions with other packages. */
export const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: '@nself/auth-core/accessToken',
  REFRESH_TOKEN: '@nself/auth-core/refreshToken',
  EXPIRES_AT: '@nself/auth-core/expiresAt',
  USER_PROFILE: '@nself/auth-core/userProfile',
} as const;

// ─── Response types ───────────────────────────────────────────────────────────

interface SignInResponse {
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

function makeAuthFailedError(message: string): AppError {
  return { code: 'auth_failed', message, status: 401 };
}

function decodeUserFromJwt(accessToken: string): UserProfile | null {
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

// ─── NativeAuthStrategy ───────────────────────────────────────────────────────

/**
 * NativeAuthStrategy — Bearer token auth for React Native and Tauri desktop.
 *
 * Tokens are stored in the platform's secure store and injected as Authorization
 * headers via getAccessToken() which authExchange calls per-request.
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
      const state: AuthState = {
        status: 'error',
        error: makeAuthFailedError('Network error during sign-in'),
      };
      this.setState(state);
      return state;
    }

    if (!response.ok) {
      const state: AuthState = {
        status: 'error',
        error: makeAuthFailedError(`Sign-in failed: HTTP ${String(response.status)}`),
      };
      this.setState(state);
      return state;
    }

    let body: SignInResponse;
    try {
      body = (await response.json()) as SignInResponse;
    } catch {
      const state: AuthState = {
        status: 'error',
        error: makeAuthFailedError('Invalid sign-in response from nHost'),
      };
      this.setState(state);
      return state;
    }

    const session = body.session;
    if (
      !session?.accessToken ||
      !session.refreshToken ||
      typeof session.accessTokenExpiresIn !== 'number' ||
      !session.user?.id ||
      !session.user.email
    ) {
      const state: AuthState = {
        status: 'error',
        error: makeAuthFailedError('Malformed sign-in response: missing session fields'),
      };
      this.setState(state);
      return state;
    }

    const tokenPair: TokenPair = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: Date.now() + session.accessTokenExpiresIn * 1_000,
    };

    await this.writeTokenPair(tokenPair);

    const user: UserProfile = {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName ?? '',
      roles: session.user.roles ?? [],
      defaultRole: session.user.defaultRole ?? 'user',
    };

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

/**
 * createNativeAuthStrategy — factory for NativeAuthStrategy.
 *
 * @param store    SecureStoreInterface implementation (from native-bridge or tauri-bridge).
 * @param config   Optional AuthConfig overrides.
 * @param fetchFn  Optional fetch override for testing.
 */
export function createNativeAuthStrategy(
  store: SecureStoreInterface,
  config: AuthConfig = {},
  fetchFn: typeof fetch = globalThis.fetch,
): AuthStrategy {
  return new NativeAuthStrategy(store, config, fetchFn);
}
