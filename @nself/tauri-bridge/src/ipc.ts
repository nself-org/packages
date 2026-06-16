/**
 * @nself/tauri-bridge — Typed IPC invoke wrapper.
 *
 * Purpose: Wraps @tauri-apps/api/core invoke() with Result<T, AppError> so callers
 *          never deal with raw throws from Tauri commands. In non-Tauri environments
 *          returns Result.err immediately without attempting any @tauri-apps import.
 * Inputs:  command: string — Rust command name registered in src-tauri/
 *          args?: Record<string, unknown> — serialisable payload forwarded to Rust
 * Outputs: Promise<Result<T, AppError>> — Ok on success, Err on any failure
 * Constraints: Import @tauri-apps/api/core ONLY inside the isTauri()-gated path
 *              so browser/Node environments do not crash on the import.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/tauri-bridge
 */

import { type AppError, err, ok, type Result } from '@nself/errors';
import { isTauri, notTauriError } from './bridge.js';

/**
 * invoke<T> — type-safe Tauri command caller.
 *
 * Wraps the raw Tauri invoke so all desktop code gets Result-typed returns.
 * In stub mode (no Tauri runtime) returns Err immediately.
 *
 * @param command - Rust command string (must match #[tauri::command] name)
 * @param args    - Optional serialisable arguments forwarded verbatim
 * @returns Ok<T> on success; Err<AppError> on Tauri error or stub mode
 */
export async function invoke<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<Result<T, AppError>> {
  if (!isTauri()) {
    return err(notTauriError());
  }

  try {
    // Dynamic import keeps @tauri-apps/api out of browser bundles.
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
    const result = await tauriInvoke<T>(command, args);
    return ok(result);
  } catch (raw: unknown) {
    const message =
      raw instanceof Error
        ? raw.message
        : typeof raw === 'string'
          ? raw
          : 'unknown tauri invoke error';
    const error: AppError = {
      code: 'internal',
      message: `tauri:${command}: ${message}`,
      status: 500,
    };
    return err(error);
  }
}
