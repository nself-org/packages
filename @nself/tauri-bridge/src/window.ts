/**
 * @nself/tauri-bridge — WindowManager: Tauri 2 window lifecycle helpers.
 *
 * Purpose: Wraps @tauri-apps/api/window with a Map-backed ref tracker so callers
 *          can create, focus, and control named windows without holding raw refs.
 *          Closed/destroyed windows are pruned from the map to prevent leaks.
 * Inputs:  label: string — Tauri window label (must be unique per app)
 *          url: string   — initial URL for new windows
 * Outputs: Result<void | WebviewWindow, AppError> for each operation
 * Constraints: WebviewWindow refs are tracked by label; destroy() prunes the entry.
 *              All methods return Err immediately in stub (non-Tauri) mode.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/tauri-bridge
 */

import { type AppError, err, ok, type Result } from '@nself/errors';
import { isTauri, notTauriError } from './bridge.js';

/** Minimal interface matching the @tauri-apps/api WebviewWindow surface we use. */
interface WebviewWindowLike {
  label: string;
  setFocus(): Promise<void>;
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  close(): Promise<void>;
  once(event: string, handler: () => void): Promise<() => void>;
}

/**
 * WindowManager — create and control named Tauri webview windows.
 *
 * Usage:
 *   const wm = new WindowManager();
 *   await wm.create('settings', 'tauri://localhost/settings');
 *   await wm.focus('settings');
 *   await wm.close('settings');
 */
export class WindowManager {
  /** Live WebviewWindow references keyed by label. */
  private readonly refs = new Map<string, WebviewWindowLike>();

  /**
   * Create a new named window. If a window with this label already exists,
   * focuses it instead of opening a duplicate.
   */
  async create(label: string, url: string): Promise<Result<void, AppError>> {
    if (!isTauri()) return err(notTauriError());

    const existing = this.refs.get(label);
    if (existing) {
      await existing.setFocus();
      return ok(undefined);
    }

    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      const win = new WebviewWindow(label, { url });

      // Prune ref when the window is destroyed.
      await win.once('tauri://destroyed', () => {
        this.refs.delete(label);
      });

      this.refs.set(label, win as unknown as WebviewWindowLike);
      return ok(undefined);
    } catch (raw: unknown) {
      return err(toWindowError('create', label, raw));
    }
  }

  /** Bring an existing window to the foreground. */
  async focus(label: string): Promise<Result<void, AppError>> {
    if (!isTauri()) return err(notTauriError());
    const win = this.refs.get(label);
    if (!win) return err(notFoundError(label));
    try {
      await win.setFocus();
      return ok(undefined);
    } catch (raw: unknown) {
      return err(toWindowError('focus', label, raw));
    }
  }

  /** Minimize a window. */
  async minimize(label: string): Promise<Result<void, AppError>> {
    if (!isTauri()) return err(notTauriError());
    const win = this.refs.get(label);
    if (!win) return err(notFoundError(label));
    try {
      await win.minimize();
      return ok(undefined);
    } catch (raw: unknown) {
      return err(toWindowError('minimize', label, raw));
    }
  }

  /** Maximize a window. */
  async maximize(label: string): Promise<Result<void, AppError>> {
    if (!isTauri()) return err(notTauriError());
    const win = this.refs.get(label);
    if (!win) return err(notFoundError(label));
    try {
      await win.maximize();
      return ok(undefined);
    } catch (raw: unknown) {
      return err(toWindowError('maximize', label, raw));
    }
  }

  /**
   * Close and remove a window from the ref map.
   * Pruning happens eagerly here AND via the tauri://destroyed listener.
   */
  async close(label: string): Promise<Result<void, AppError>> {
    if (!isTauri()) return err(notTauriError());
    const win = this.refs.get(label);
    if (!win) return err(notFoundError(label));
    try {
      await win.close();
      this.refs.delete(label);
      return ok(undefined);
    } catch (raw: unknown) {
      return err(toWindowError('close', label, raw));
    }
  }

  /** Returns labels of all currently tracked windows. */
  openLabels(): string[] {
    return Array.from(this.refs.keys());
  }
}

// ─── helpers ───────────────────────────────────────────────────────────────

function notFoundError(label: string): AppError {
  return {
    code: 'not_found',
    message: `window '${label}' not found in WindowManager`,
    status: 404,
  };
}

function toWindowError(op: string, label: string, raw: unknown): AppError {
  const message =
    raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : 'unknown';
  return {
    code: 'internal',
    message: `window:${op}:${label}: ${message}`,
    status: 500,
  };
}
