/**
 * flutter-compat.impl.ts — NSelfAuthCompatImpl class (private implementation).
 *
 * Purpose: Encapsulates all auth operations for the Flutter-compat shim:
 *          initialize, signIn, signUp, signOut, biometric, push binding,
 *          token refresh scheduling. Extracted from flutter-compat.ts to
 *          respect the 300-line file cap.
 *
 * Inputs:  authBaseUrl (string), storage (FlutterStorageBackend).
 * Outputs: NSelfAuthCompatImpl class (package-private — not exported from index).
 * Constraints:
 *   - NSelfAuthCompatImpl is NOT exported from auth-core/src/index.ts.
 *     It is an implementation detail; callers use the NSelfAuthCompat singleton.
 *   - Must NOT import @nself/auth-core core modules (circular dep risk).
 * SPORT: T-P3-E4-W3-S7-T02 (plugins-pro auth flutter port)
 */

import {
  BiometricFailedException,
  BiometricUnavailableException,
  SessionExpiredException,
  UnauthorizedException,
} from './flutter-compat.types.js';

import type {
  FlutterAuthUser,
  FlutterAuthState,
  FlutterStorageBackend,
} from './flutter-compat.types.js';

type StateCallback = (state: FlutterAuthState) => void;

/**
 * NSelfAuthCompatImpl — internal implementation class for the auth shim.
 *
 * Purpose: Stateful class managing auth lifecycle: user session, token refresh
 *          timer, secure storage persistence, and state-change observers.
 * Inputs:  authBaseUrl, storage — see constructor.
 * Outputs: Auth operations via methods; state changes via stateCallbacks.
 * Constraints:
 *   - Not exported from index; accessed only via NSelfAuthCompat singleton.
 *   - Token refresh timer is best-effort; getAccessToken() always re-checks expiry.
 * SPORT: T-P3-E4-W3-S7-T02 (plugins-pro auth flutter port)
 */
export class NSelfAuthCompatImpl {
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
    const savedUser = await this.restoreSessionFromStorage();
    if (savedUser) {
      this.currentUser = savedUser;
      this.notifyStateChange({ type: 'authenticated', user: savedUser });
      this.scheduleTokenRefresh(savedUser.accessTokenExpiry);
    } else {
      this.notifyStateChange({ type: 'unauthenticated' });
    }
  }

  async signIn(email: string, password: string): Promise<FlutterAuthUser> {
    this.notifyStateChange({ type: 'loading' });

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
        accessTokenExpiry: Date.now() + 3600 * 1000, // Assume 1 hour expiry
      };

      await this.persistSessionToStorage(user);
      this.currentUser = user;
      this.notifyStateChange({ type: 'authenticated', user });
      this.scheduleTokenRefresh(user.accessTokenExpiry);

      return user;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.notifyStateChange({ type: 'error', error: err });
      throw err;
    }
  }

  async signUp(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<FlutterAuthUser> {
    this.notifyStateChange({ type: 'loading' });

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
      this.notifyStateChange({ type: 'error', error: err });
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
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch {
        // Best-effort cleanup; proceed with local sign-out
      }
    }

    await this.storage.delete('nself_user');
    await this.storage.delete('nself_access_token');
    await this.storage.delete('nself_refresh_token');
    await this.storage.delete('nself_biometric_key');

    this.currentUser = null;
    this.notifyStateChange({ type: 'unauthenticated' });
  }

  getCurrentUser(): FlutterAuthUser | null {
    return this.currentUser;
  }

  onAuthStateChange(callback: StateCallback): () => void {
    this.stateCallbacks.add(callback);
    return () => {
      this.stateCallbacks.delete(callback);
    };
  }

  async isBiometricAvailable(): Promise<boolean> {
    // Platform-dependent; this stub returns false.
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
    if (!(await this.isBiometricAvailable())) {
      throw new BiometricFailedException();
    }

    const user = await this.restoreSessionFromStorage();
    if (!user) {
      throw new SessionExpiredException();
    }

    this.currentUser = user;
    this.notifyStateChange({ type: 'authenticated', user });
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
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.currentUser) {
      return null;
    }
    // Refresh proactively 60 seconds before expiry
    if (Date.now() >= this.currentUser.accessTokenExpiry - 60000) {
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

  /**
   * persistSessionToStorage — write user + token fields to secure storage.
   *
   * Extracted from signIn to keep that method under 50 lines.
   */
  private async persistSessionToStorage(user: FlutterAuthUser): Promise<void> {
    await this.storage.set('nself_user', JSON.stringify(user));
    await this.storage.set('nself_access_token', user.accessToken);
    await this.storage.set('nself_refresh_token', user.refreshToken);
  }

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
    const delay = Math.max(0, expiresAt - Date.now() - 60000);
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

  private notifyStateChange(state: FlutterAuthState): void {
    for (const callback of this.stateCallbacks) {
      callback(state);
    }
  }
}
