/**
 * @nself/native-bridge — SecureStore abstraction for React Native.
 *
 * Purpose: Typed interface wrapping expo-secure-store so auth-core and other
 *          consumers can store sensitive tokens without direct expo dependency.
 *          Used by NativeAuthStrategy in @nself/auth-core.
 * Inputs:  key (string), value (string) — all values are stored as strings.
 * Outputs: Result<T, AppError> — no untyped throws escape this module.
 * Constraints: expo-secure-store is a peer dep — only present in React Native
 *              environments; web/desktop strategies use cookies or OS keychain.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/native-bridge (SecureStore seam)
 */

import { ok, err, type Result, type AppError } from '@nself/errors';

/**
 * SecureStoreInterface — canonical contract for encrypted on-device key-value storage.
 *
 * Implemented by ExpoSecureStore in this module.
 * Consumed by NativeAuthStrategy in @nself/auth-core.
 */
export interface SecureStoreInterface {
  /** Retrieve a previously stored value. Returns Ok(null) if key does not exist. */
  getItem(key: string): Promise<Result<string | null, AppError>>;
  /** Store a value under the given key, overwriting any existing entry. */
  setItem(key: string, value: string): Promise<Result<void, AppError>>;
  /** Remove the entry for the given key. Succeeds even if the key does not exist. */
  deleteItem(key: string): Promise<Result<void, AppError>>;
}

/**
 * ExpoSecureStore — production implementation backed by expo-secure-store.
 *
 * Wraps every expo-secure-store call in try/catch and maps thrown errors to
 * AppError{code:'internal'} so callers never see untyped exceptions.
 */
export class ExpoSecureStore implements SecureStoreInterface {
  async getItem(key: string): Promise<Result<string | null, AppError>> {
    try {
      // expo-secure-store is a runtime dep — imported inline to avoid crashing
      // in test environments where the native module is absent.
      const SecureStore = await import('expo-secure-store');
      const value = await SecureStore.getItemAsync(key);
      return ok(value);
    } catch (cause) {
      return err({
        code: 'internal',
        message: `SecureStore.getItem failed for key "${key}": ${String(cause)}`,
        status: 500,
      });
    }
  }

  async setItem(key: string, value: string): Promise<Result<void, AppError>> {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
      return ok(undefined);
    } catch (cause) {
      return err({
        code: 'internal',
        message: `SecureStore.setItem failed for key "${key}": ${String(cause)}`,
        status: 500,
      });
    }
  }

  async deleteItem(key: string): Promise<Result<void, AppError>> {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
      return ok(undefined);
    } catch (cause) {
      return err({
        code: 'internal',
        message: `SecureStore.deleteItem failed for key "${key}": ${String(cause)}`,
        status: 500,
      });
    }
  }
}
