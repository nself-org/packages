/**
 * flutter-compat.ts — Flutter SDK auth shim public facade.
 *
 * Purpose: Public-API barrel for the Flutter-compatible auth shim. Exports
 *          all types, error classes, and the NSelfAuthCompat singleton.
 *          Implementation lives in flutter-compat.impl.ts (class) and
 *          flutter-compat.types.ts (types) — split for the 300-line cap.
 *
 * Inputs:  authBaseUrl (base URL for nSelf auth service)
 *          secureStore (platform-specific key-value storage interface)
 * Outputs: NSelfAuthCompat singleton with methods: initialize, signIn, signUp,
 *          signOut, currentUser, onAuthStateChange stream, biometric unlock,
 *          device/push binding, token access, auto-refresh.
 *          Also re-exports all types and error classes from flutter-compat.types.ts.
 * Constraints:
 *   - Must NOT import @nself/auth-core core modules to avoid circular deps.
 *   - ALL exports here are frozen public API — re-exported from index.ts.
 *     Do NOT rename or remove any export without a major-version change.
 * SPORT: T-P3-E4-W3-S7-T02 (plugins-pro auth flutter port)
 */

export type {
  FlutterAuthUser,
  FlutterAuthState,
  FlutterStorageBackend,
} from './flutter-compat.types.js';

export {
  BiometricUnavailableException,
  BiometricFailedException,
  SessionExpiredException,
  UnauthorizedException,
} from './flutter-compat.types.js';

import { NSelfAuthCompatImpl } from './flutter-compat.impl.js';
import type {
  FlutterAuthUser,
  FlutterAuthState,
  FlutterStorageBackend,
} from './flutter-compat.types.js';

// ─── Singleton state ──────────────────────────────────────────────────────

let _instance: NSelfAuthCompatImpl | null = null;

// ─── Public Singleton API ──────────────────────────────────────────────────

/**
 * NSelfAuthCompat — Flutter SDK compatible auth singleton.
 *
 * Purpose: Stable public API surface for the Flutter-compat shim.
 *          Delegates all operations to NSelfAuthCompatImpl. Callers never
 *          construct NSelfAuthCompatImpl directly.
 * Inputs:  See individual method signatures.
 * Outputs: FlutterAuthUser, auth state change subscriptions, token strings.
 * Constraints:
 *   - Call initialize() before any other method.
 *   - All methods throw if called before initialize().
 * SPORT: T-P3-E4-W3-S7-T02 (plugins-pro auth flutter port)
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
    _instance = new NSelfAuthCompatImpl(options.authBaseUrl, options.secureStore);
    await _instance.initialize();
  },

  async signIn(email: string, password: string): Promise<FlutterAuthUser> {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.signIn(email, password);
  },

  async signUp(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<FlutterAuthUser> {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.signUp(email, password, displayName);
  },

  async signOut(): Promise<void> {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.signOut();
  },

  get currentUser(): FlutterAuthUser | null {
    return _instance?.getCurrentUser() ?? null;
  },

  onAuthStateChange(
    callback: (state: FlutterAuthState) => void,
  ): () => void {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.onAuthStateChange(callback);
  },

  async isBiometricAvailable(): Promise<boolean> {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.isBiometricAvailable();
  },

  async enableBiometricUnlock(): Promise<void> {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.enableBiometricUnlock();
  },

  async disableBiometricUnlock(): Promise<void> {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.disableBiometricUnlock();
  },

  async unlockWithBiometrics(): Promise<FlutterAuthUser> {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.unlockWithBiometrics();
  },

  async bindPushToken(fcmOrApnsToken: string): Promise<void> {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.bindPushToken(fcmOrApnsToken);
  },

  async unregisterDevice(): Promise<void> {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.unregisterDevice();
  },

  async getAccessToken(): Promise<string | null> {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.getAccessToken();
  },

  async forceRefresh(): Promise<void> {
    if (!_instance) throw new Error('NSelfAuthCompat not initialized');
    return _instance.forceRefresh();
  },
};
