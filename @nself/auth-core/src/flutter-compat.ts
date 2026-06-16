/**
 * flutter-compat.ts — Flutter SDK auth shim TypeScript equivalent.
 *
 * Purpose: Provide a compatible TypeScript API surface for the nSelf Flutter
 *          auth SDK (plugins-pro/paid/auth/flutter) so consumers can migrate to
 *          a language-neutral auth module.
 *
 *          This is NOT a direct port of the Flutter SDK internals; it's a
 *          minimal facade that exposes the same public operations via TypeScript
 *          promises and observables.
 *
 * Inputs:  authBaseUrl (base URL for nSelf auth service)
 *          secureStore (platform-specific key-value storage interface)
 * Outputs: NSelfAuthCompat singleton with methods: initialize, signIn, signUp,
 *          signOut, currentUser, onAuthStateChange stream, biometric unlock,
 *          device/push binding, token access, auto-refresh.
 * Constraints:
 *   - Must NOT import @nself/auth-core core modules to avoid circular deps.
 *   - Uses generic Promise/RxJS types, not nSelf-specific AuthState.
 *   - Token refresh and storage are implementation details.
 * SPORT: T-P3-E4-W3-S7-T02 (plugins-pro auth flutter port)
 */

// ─── Types (mirrored from Flutter SDK) ────────────────────────────────────

/** Minimal user model. */
export interface FlutterAuthUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly accessTokenExpiry: number; // Unix timestamp (ms)
}

/** Auth operation state. */
export type FlutterAuthState =
  | { type: 'unauthenticated' }
  | { type: 'loading' }
  | { type: 'authenticated'; user: FlutterAuthUser }
  | { type: 'error'; error: Error };

/** Biometric error variants. */
export class BiometricUnavailableException extends Error {
  constructor() {
    super('Biometric authentication not available');
  }
}

export class BiometricFailedException extends Error {
  constructor() {
    super('Biometric authentication failed');
  }
}

export class SessionExpiredException extends Error {
  constructor() {
    super('Session expired');
  }
}

export class UnauthorizedException extends Error {
  constructor() {
    super('User not authenticated');
  }
}

// ─── Secure Storage Interface ─────────────────────────────────────────────

export interface FlutterStorageBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

// ─── Internal state ───────────────────────────────────────────────────────

let _instance: NSelfAuthCompatImpl | null = null;

type StateCallback = (state: FlutterAuthState) => void;

class NSelfAuthCompatImpl {
  private authBaseUrl: string;
  private storage: FlutterStorageBackend;
  private currentUser: FlutterAuthUser | null = null;
  private stateCallbacks: Set<StateCallback> = new Set();
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(authBaseUrl: string, storage: FlutterStorageBackend) {
    this.authBaseUrl = authBaseUrl;
    this.storage = storage;
  }

  async initialize(): Promise<void> {
    // Attempt to restore session from secure storage
    const savedUser = await this.restoreSessionFromStorage();
    if (savedUser) {
      this.currentUser = savedUser;
      this.notifyStateChange({
        type: 'authenticated',
        user: savedUser,
      });
      this.scheduleTokenRefresh(savedUser.accessTokenExpiry);
    } else {
      this.notifyStateChange({
        type: 'unauthenticated',
      });
    }
  }

  async signIn(email: string, password: string): Promise<FlutterAuthUser> {
    this.notifyStateChange({
      type: 'loading',
    });

    try {
      const response = await fetch(`${this.authBaseUrl}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`Sign-in failed: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; displayName?: string };
      };

      const user: FlutterAuthUser = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName ?? '',
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessTokenExpiry:
          Date.now() + 3600 * 1000, // Assume 1 hour expiry
      };

      // Persist to secure storage
      await this.storage.set(
        'nself_user',
        JSON.stringify(user)
      );
      await this.storage.set('nself_access_token', user.accessToken);
      await this.storage.set('nself_refresh_token', user.refreshToken);

      this.currentUser = user;
      this.notifyStateChange({
        type: 'authenticated',
        user,
      });
      this.scheduleTokenRefresh(user.accessTokenExpiry);

      return user;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.notifyStateChange({
        type: 'error',
        error: err,
      });
      throw err;
    }
  }

  async signUp(
    email: string,
    password: string,
    displayName?: string
  ): Promise<FlutterAuthUser> {
    this.notifyStateChange({
      type: 'loading',
    });

    try {
      const response = await fetch(`${this.authBaseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!response.ok) {
        throw new Error(`Sign-up failed: ${response.statusText}`);
      }

      // Automatically sign in after signup
      return this.signIn(email, password);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.notifyStateChange({
        type: 'error',
        error: err,
      });
      throw err;
    }
  }

  async signOut(): Promise<void> {
    this.cancelTokenRefresh();

    if (this.currentUser) {
      try {
        const token = await this.storage.get('nself_access_token');
        if (token) {
          await fetch(`${this.authBaseUrl}/logout`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      } catch {
        // Best-effort cleanup; proceed with local sign-out
      }
    }

    // Clear secure storage
    await this.storage.delete('nself_user');
    await this.storage.delete('nself_access_token');
    await this.storage.delete('nself_refresh_token');
    await this.storage.delete('nself_biometric_key');

    this.currentUser = null;
    this.notifyStateChange({
      type: 'unauthenticated',
    });
  }

  private notifyStateChange(state: FlutterAuthState): void {
    for (const callback of this.stateCallbacks) {
      callback(state);
    }
  }

  getCurrentUser(): FlutterAuthUser | null {
    return this.currentUser;
  }

  onAuthStateChange(
    callback: StateCallback
  ): () => void {
    this.stateCallbacks.add(callback);
    return () => {
      this.stateCallbacks.delete(callback);
    };
  }

  async isBiometricAvailable(): Promise<boolean> {
    // Platform-dependent; this is a stub that returns false.
    // Platforms must implement their own biometric checks.
    return false;
  }

  async enableBiometricUnlock(): Promise<void> {
    if (!(await this.isBiometricAvailable())) {
      throw new BiometricUnavailableException();
    }
    await this.storage.set('nself_biometric_key', 'enabled');
  }

  async disableBiometricUnlock(): Promise<void> {
    await this.storage.delete('nself_biometric_key');
  }

  async unlockWithBiometrics(): Promise<FlutterAuthUser> {
    const hasBio = await this.storage.get('nself_biometric_key');
    if (!hasBio) {
      throw new BiometricUnavailableException();
    }

    // Platform-dependent biometric prompt; stub returns null.
    if (!(await this.isBiometricAvailable())) {
      throw new BiometricFailedException();
    }

    // Restore from secure storage
    const user = await this.restoreSessionFromStorage();
    if (!user) {
      throw new SessionExpiredException();
    }

    this.currentUser = user;
    this.notifyStateChange({
      type: 'authenticated',
      user,
    });
    this.scheduleTokenRefresh(user.accessTokenExpiry);

    return user;
  }

  async bindPushToken(fcmOrApnsToken: string): Promise<void> {
    const token = await this.storage.get('nself_access_token');
    if (!token) {
      throw new UnauthorizedException();
    }

    await fetch(`${this.authBaseUrl}/devices/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pushToken: fcmOrApnsToken }),
    });
  }

  async unregisterDevice(): Promise<void> {
    const token = await this.storage.get('nself_access_token');
    if (!token) {
      throw new UnauthorizedException();
    }

    await fetch(`${this.authBaseUrl}/devices`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.currentUser) {
      return null;
    }

    // Check if token is expired; refresh if needed
    if (Date.now() >= this.currentUser.accessTokenExpiry - 60000) {
      // 60 seconds buffer
      await this.forceRefresh();
    }

    return this.currentUser.accessToken;
  }

  async forceRefresh(): Promise<void> {
    const refreshToken = await this.storage.get('nself_refresh_token');
    if (!refreshToken) {
      throw new SessionExpiredException();
    }

    try {
      const response = await fetch(`${this.authBaseUrl}/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await this.signOut();
        throw new SessionExpiredException();
      }

      const data = (await response.json()) as {
        accessToken: string;
        expiresIn: number;
      };

      const expiresAt = Date.now() + data.expiresIn * 1000;
      await this.storage.set('nself_access_token', data.accessToken);

      if (this.currentUser) {
        this.currentUser = {
          ...this.currentUser,
          accessToken: data.accessToken,
          accessTokenExpiry: expiresAt,
        };
      }

      this.scheduleTokenRefresh(expiresAt);
    } catch (error) {
      await this.signOut();
      throw error;
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  private async restoreSessionFromStorage(): Promise<FlutterAuthUser | null> {
    const userJson = await this.storage.get('nself_user');
    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as FlutterAuthUser;
    } catch {
      return null;
    }
  }

  private scheduleTokenRefresh(expiresAt: number): void {
    this.cancelTokenRefresh();

    const now = Date.now();
    const buffer = 60000; // 60 seconds before expiry
    const delay = Math.max(0, expiresAt - now - buffer);

    if (delay > 0) {
      this.refreshTimer = setTimeout(() => {
        this.forceRefresh().catch(() => {
          // Ignore refresh errors; next getAccessToken call will handle it
        });
      }, delay);
    }
  }

  private cancelTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// ─── Public Singleton API ──────────────────────────────────────────────────

/**
 * NSelfAuthCompat — Flutter SDK compatible auth singleton.
 *
 * Usage:
 *   await NSelfAuthCompat.initialize({
 *     authBaseUrl: 'https://nself.org/auth',
 *     secureStore: myPlatformSecureStore,
 *   });
 *   const user = await NSelfAuthCompat.signIn(email, password);
 *   NSelfAuthCompat.onAuthStateChange((state) => {
 *     if (state.type === 'authenticated') {
 *       console.log('Signed in as', state.user.email);
 *     }
 *   });
 */
export const NSelfAuthCompat = {
  async initialize(options: {
    authBaseUrl: string;
    secureStore: FlutterStorageBackend;
  }): Promise<void> {
    if (_instance) {
      return; // Already initialized
    }
    _instance = new NSelfAuthCompatImpl(
      options.authBaseUrl,
      options.secureStore
    );
    await _instance.initialize();
  },

  async signIn(email: string, password: string): Promise<FlutterAuthUser> {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.signIn(email, password);
  },

  async signUp(
    email: string,
    password: string,
    displayName?: string
  ): Promise<FlutterAuthUser> {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.signUp(email, password, displayName);
  },

  async signOut(): Promise<void> {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.signOut();
  },

  get currentUser(): FlutterAuthUser | null {
    return _instance?.getCurrentUser() ?? null;
  },

  onAuthStateChange(
    callback: (state: FlutterAuthState) => void
  ): () => void {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.onAuthStateChange(callback);
  },

  async isBiometricAvailable(): Promise<boolean> {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.isBiometricAvailable();
  },

  async enableBiometricUnlock(): Promise<void> {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.enableBiometricUnlock();
  },

  async disableBiometricUnlock(): Promise<void> {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.disableBiometricUnlock();
  },

  async unlockWithBiometrics(): Promise<FlutterAuthUser> {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.unlockWithBiometrics();
  },

  async bindPushToken(fcmOrApnsToken: string): Promise<void> {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.bindPushToken(fcmOrApnsToken);
  },

  async unregisterDevice(): Promise<void> {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.unregisterDevice();
  },

  async getAccessToken(): Promise<string | null> {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.getAccessToken();
  },

  async forceRefresh(): Promise<void> {
    if (!_instance) {
      throw new Error('NSelfAuthCompat not initialized');
    }
    return _instance.forceRefresh();
  },
};
