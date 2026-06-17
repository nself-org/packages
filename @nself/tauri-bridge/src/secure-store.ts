/**
 * @nself/tauri-bridge — SecureStore implementation for Tauri 2 desktop.
 *
 * Purpose: Provide the canonical SecureStoreInterface (get/set/delete) backed by
 *          the OS keychain via Tauri IPC, so @nself/auth-core's NativeAuthStrategy
 *          can be wired up on desktop exactly as it is on React Native (where
 *          @nself/native-bridge ExpoSecureStore supplies the same contract).
 * Inputs:  key (string), value (string) — token-pair fields, stored as strings.
 * Outputs: raw string | null on read, void on write; throws SecureStoreError on a
 *          backend failure (matching the canonical throw-on-error contract used by
 *          auth-core/types.ts and native-bridge — NOT the Result monad).
 * Constraints: The Rust side must register `secure_store_get`/`_set`/`_delete`
 *              #[tauri::command]s (keyring/keytar-backed). In a non-Tauri runtime
 *              every call throws SecureStoreError (no silent no-op), so misuse on
 *              web/Node is loud rather than a silent auth failure.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/tauri-bridge (SecureStore seam)
 */

import { isErr } from '@nself/errors';
import { invoke } from './ipc.js';

/**
 * SecureStoreError — typed error thrown by the Tauri SecureStore.
 *
 * Mirrors @nself/native-bridge's SecureStoreError so callers on either platform
 * can `instanceof`-narrow a single error type from the canonical SecureStore.
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
 * SecureStoreInterface — canonical contract (identical to @nself/auth-core
 * src/types.ts and @nself/native-bridge): raw string values, void writes, throw
 * on backend error. Declared structurally to avoid a dependency cycle.
 */
export interface SecureStoreInterface {
  /** Retrieve a value by key. Returns null if not found. Throws on backend error. */
  get(key: string): Promise<string | null>;
  /** Store a value under key. Throws on backend error. */
  set(key: string, value: string): Promise<void>;
  /** Delete a key. No-op if not found. Throws on backend error. */
  delete(key: string): Promise<void>;
}

/** Rust command names the desktop app must register (keychain-backed). */
const CMD = {
  get: 'secure_store_get',
  set: 'secure_store_set',
  delete: 'secure_store_delete',
} as const;

/**
 * TauriSecureStore — OS-keychain-backed SecureStore for Tauri desktop.
 *
 * Pass directly to createNativeAuthStrategy() from @nself/auth-core:
 *   createNativeAuthStrategy(new TauriSecureStore(), { authBaseUrl })
 */
export class TauriSecureStore implements SecureStoreInterface {
  async get(key: string): Promise<string | null> {
    const result = await invoke<string | null>(CMD.get, { key });
    if (isErr(result)) {
      throw new SecureStoreError(`TauriSecureStore.get failed for key "${key}"`, result.error);
    }
    return result.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const result = await invoke<void>(CMD.set, { key, value });
    if (isErr(result)) {
      throw new SecureStoreError(`TauriSecureStore.set failed for key "${key}"`, result.error);
    }
  }

  async delete(key: string): Promise<void> {
    const result = await invoke<void>(CMD.delete, { key });
    if (isErr(result)) {
      throw new SecureStoreError(`TauriSecureStore.delete failed for key "${key}"`, result.error);
    }
  }
}
