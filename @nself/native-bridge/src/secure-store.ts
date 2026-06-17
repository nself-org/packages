/**
 * @nself/native-bridge — SecureStore abstraction for React Native.
 *
 * Purpose: Typed interface wrapping expo-secure-store so auth-core and other
 *          consumers can store sensitive tokens without direct expo dependency.
 *          Used by NativeAuthStrategy in @nself/auth-core.
 * Inputs:  key (string), value (string) — all values are stored as strings.
 * Outputs: raw string | null on read, void on write; throws SecureStoreError on
 *          a backend failure so callers can catch a single typed error.
 * Constraints: expo-secure-store is a peer dep — only present in React Native
 *              environments; web/desktop strategies use cookies or OS keychain.
 *              The method names and return shapes MUST stay identical to the
 *              canonical SecureStoreInterface declared in @nself/auth-core
 *              (get/set/delete) — NativeAuthStrategy calls them directly.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/native-bridge (SecureStore seam)
 */

/**
 * SecureStoreError — typed error thrown by SecureStore implementations.
 *
 * NativeAuthStrategy treats any throw from the store as a storage failure;
 * this concrete error type lets callers narrow with `instanceof` if needed
 * without depending on the Result monad (which the canonical auth-core
 * SecureStoreInterface intentionally does not use).
 */
export class SecureStoreError extends Error {
  override readonly name = 'SecureStoreError';
  override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

/**
 * SecureStoreInterface — canonical contract for encrypted on-device key-value storage.
 *
 * This is the SAME contract declared in @nself/auth-core (src/types.ts):
 * raw string values, void writes, and a thrown error on backend failure.
 * Declared structurally here (rather than imported) to avoid a circular
 * dependency between auth-core and native-bridge — the shapes MUST match.
 *
 * Implemented by ExpoSecureStore in this module.
 * Consumed by NativeAuthStrategy in @nself/auth-core.
 */
export interface SecureStoreInterface {
  /** Retrieve a value by key. Returns null if not found. Throws on backend error. */
  get(key: string): Promise<string | null>;
  /** Store a value under key. Throws on backend error. */
  set(key: string, value: string): Promise<void>;
  /** Delete a key. No-op if not found. Throws on backend error. */
  delete(key: string): Promise<void>;
}

/**
 * ExpoSecureStore — production implementation backed by expo-secure-store.
 *
 * Implements the canonical SecureStoreInterface directly so it can be passed
 * to createNativeAuthStrategy() with no adapter. Backend failures surface as
 * SecureStoreError throws (the canonical contract throws rather than returning
 * a Result), so NativeAuthStrategy's handling of store access still works.
 */
export class ExpoSecureStore implements SecureStoreInterface {
  async get(key: string): Promise<string | null> {
    try {
      // expo-secure-store is a runtime dep — imported inline to avoid crashing
      // in test environments where the native module is absent.
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    } catch (cause) {
      throw new SecureStoreError(`SecureStore.get failed for key "${key}"`, cause);
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    } catch (cause) {
      throw new SecureStoreError(`SecureStore.set failed for key "${key}"`, cause);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    } catch (cause) {
      throw new SecureStoreError(`SecureStore.delete failed for key "${key}"`, cause);
    }
  }
}
