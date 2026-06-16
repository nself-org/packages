/**
 * @nself/auth-core — public API entry point.
 *
 * Purpose: Re-export all public APIs for the nSelf dual-transport authentication layer.
 *          Provides AuthState types, web (cookie) and native (Bearer+SecureStore) strategies,
 *          JWT refresh loop, urql authExchange factory, and React provider + hooks.
 * Inputs:  None — pure re-exports.
 * Outputs: All types, strategy factories, exchange factory, provider and hooks.
 * Constraints:
 *   - Never import framework code (React) here — only re-export from provider.tsx.
 *   - jwt/accessToken fields must never be passed to any logger by callers.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/auth-core (built)
 */

// Types
export type {
  AuthState,
  AuthConfig,
  AuthStrategy,
  SecureStoreInterface,
  TokenPair,
  UserProfile,
} from './types.js';

// Web strategy (cookie-based — browser surfaces)
export { WebAuthStrategy, createWebAuthStrategy } from './web.js';

// Native strategy (Bearer+SecureStore — React Native + Tauri)
export { NativeAuthStrategy, createNativeAuthStrategy, SECURE_STORE_KEYS } from './native.js';

// Refresh loop
export {
  scheduleRefresh,
  callRefresh,
  DEFAULT_REFRESH_BUFFER_MS,
  REFRESH_PATH,
} from './refresh.js';
export type {
  RefreshResult,
  AuthRefreshSuccess,
  AuthRefreshExpired,
  AuthRefreshError,
  OnRefreshResult,
} from './refresh.js';

// urql authExchange factory
export { createAuthExchange } from './exchange.js';
export type { AuthExchangeConfig } from './exchange.js';

// React provider + hooks (React surfaces only)
export {
  NselfAuthProvider,
  useAuth,
  useAuthStrategy,
  createAuthExchangeForStrategy,
} from './provider.js';
export type { NselfAuthProviderProps } from './provider.js';

// Flutter SDK compatibility layer (for app SDKs consuming plugins-pro/paid/auth/flutter)
export { NSelfAuthCompat } from './flutter-compat.js';
export type {
  FlutterAuthUser,
  FlutterAuthState,
  FlutterStorageBackend,
} from './flutter-compat.js';
export {
  BiometricUnavailableException,
  BiometricFailedException,
  SessionExpiredException,
  UnauthorizedException,
} from './flutter-compat.js';
