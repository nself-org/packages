/**
 * @nself/tauri-bridge — AutoUpdater: typed wrapper for tauri-plugin-updater.
 *
 * Purpose: Wraps the tauri-plugin-updater JS API with Result<T, AppError> returns.
 *          check() contacts the update server and returns the available manifest or
 *          null (when up-to-date). download() and install() follow the same pattern.
 *          All methods return Err in stub (non-Tauri) mode.
 * Inputs:  None — AutoUpdater is stateless; each check() call is independent.
 * Outputs: Promise<Result<UpdateManifest | null, AppError>>
 * Constraints: tauri-plugin-updater must be enabled in tauri.conf.json; this wrapper
 *              does NOT configure the updater — that belongs in each app's src-tauri/.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/tauri-bridge
 */

import { type AppError, err, ok, type Result } from '@nself/errors';
import { isTauri, notTauriError } from './bridge.js';

/**
 * Canonical update manifest shape returned by AutoUpdater.check().
 * Maps the tauri-plugin-updater Update type to a stable nSelf interface.
 */
export interface UpdateManifest {
  /** New version string (semver). */
  version: string;
  /** Release notes (may be markdown). */
  body: string | null;
  /** Publication date string. */
  date: string | null;
}

/**
 * AutoUpdater — check for, download, and install app updates.
 *
 * Usage:
 *   const updater = new AutoUpdater();
 *   const result = await updater.check();
 *   if (isOk(result) && result.value !== null) {
 *     await updater.downloadAndInstall();
 *   }
 */
export class AutoUpdater {
  /** Holds the pending Update object between check() and downloadAndInstall(). */
  private pendingUpdate: unknown | null = null;

  /**
   * check() — query the configured update server.
   *
   * @returns Ok<UpdateManifest> when an update is available,
   *          Ok<null> when the app is up-to-date,
   *          Err<AppError> on network or plugin errors.
   */
  async check(): Promise<Result<UpdateManifest | null, AppError>> {
    if (!isTauri()) return err(notTauriError());

    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (!update?.available) {
        this.pendingUpdate = null;
        return ok(null);
      }

      this.pendingUpdate = update;

      const manifest: UpdateManifest = {
        version: update.version,
        body: update.body ?? null,
        date: update.date ?? null,
      };
      return ok(manifest);
    } catch (raw: unknown) {
      return err(toUpdaterError('check', raw));
    }
  }

  /**
   * downloadAndInstall() — download and apply the pending update.
   * Must be called after a check() that returned a non-null manifest.
   *
   * @returns Ok<void> when install succeeds (app will restart),
   *          Err when no pending update exists or the download fails.
   */
  async downloadAndInstall(): Promise<Result<void, AppError>> {
    if (!isTauri()) return err(notTauriError());

    if (this.pendingUpdate === null) {
      return err({
        code: 'internal',
        message: 'updater: no pending update — call check() first',
        status: 500,
      });
    }

    try {
      const update = this.pendingUpdate as {
        downloadAndInstall: () => Promise<void>;
      };
      await update.downloadAndInstall();
      this.pendingUpdate = null;
      return ok(undefined);
    } catch (raw: unknown) {
      return err(toUpdaterError('downloadAndInstall', raw));
    }
  }
}

// ─── helper ────────────────────────────────────────────────────────────────

function toUpdaterError(op: string, raw: unknown): AppError {
  const message =
    raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : 'unknown';
  return { code: 'internal', message: `updater:${op}: ${message}`, status: 500 };
}
