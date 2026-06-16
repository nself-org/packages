/**
 * @nself/tauri-bridge — TauriBridge class and isTauri() environment detector.
 *
 * Purpose: Central bridge instance that detects whether code is running inside a
 *          Tauri 2 desktop runtime. When not in Tauri (e.g. browser dev mode) all
 *          methods return Result.err rather than throwing, ensuring apps can load
 *          and be iterated without the full desktop runtime.
 * Inputs:  None — instantiated once as the default export.
 * Outputs: TauriBridge singleton; isTauri() boolean detector.
 * Constraints: Never import @tauri-apps/api at module evaluation time — only inside
 *              isTauri()-gated branches so browser environments do not crash on import.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/tauri-bridge
 */

import { type AppError, err, type Result } from '@nself/errors';

/** Returns true only when the code is executing inside a Tauri 2 webview. */
export function isTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    '__TAURI__' in window &&
    window.__TAURI__ !== undefined
  );
}

/** Canonical stub error returned by every bridge method in non-Tauri contexts. */
export function notTauriError(): AppError {
  return {
    code: 'internal',
    message: 'not-tauri: operation requires the Tauri desktop runtime',
    status: 500,
  };
}

/**
 * TauriBridge — the root abstraction for Tauri 2 interactions.
 *
 * All nSelf desktop code calls methods on this class rather than importing
 * @tauri-apps/api directly. This ensures a single place for:
 * - Environment detection (isTauri())
 * - Stub behaviour in browser dev mode (returns Result.err, never throws)
 * - Type-safe command invocation via ipc.ts
 * - Window, updater, and shell delegation
 */
export class TauriBridge {
  /**
   * Returns true when running inside Tauri. All methods use this internally.
   * Exposed so callers can conditionally render desktop-only UI.
   */
  readonly isDesktop: boolean;

  constructor() {
    this.isDesktop = isTauri();
  }

  /**
   * Stub helper: returns a standard not-tauri error as a Result.err.
   * Used internally by ipc, window, updater, and shell modules.
   */
  stubErr<T>(): Result<T, AppError> {
    return err(notTauriError());
  }
}

/** Singleton bridge instance — import this, never construct your own. */
export const bridge = new TauriBridge();
