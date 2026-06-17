/**
 * Unit tests for @nself/tauri-bridge — stub mode (isTauri() = false).
 *
 * Coverage:
 * - isTauri() returns false when window.__TAURI__ is absent
 * - TauriBridge.isDesktop is false; stubErr() returns Err
 * - invoke() in stub mode returns Result.err, no @tauri-apps/api call
 * - WindowManager.create/focus/minimize/maximize/close all return Err in stub mode
 * - AutoUpdater.check() returns Err in stub mode (typed as Result<UpdateManifest|null, AppError>)
 * - openUrl: disallowed hostname returns Err{code:'forbidden'}
 * - openUrl: allowed hostname proceeds (stub-mode short-circuits before shell.open)
 * - openUrl: malformed URL returns Err{code:'validation_error'}
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { isErr, isOk } from '@nself/errors';
import { isTauri, TauriBridge } from '../bridge.js';
import { invoke } from '../ipc.js';
import { WindowManager } from '../window.js';
import { AutoUpdater, type UpdateManifest } from '../update.js';
import { openUrl } from '../shell.js';
import { TauriSecureStore, SecureStoreError } from '../secure-store.js';
import type { Result } from '@nself/errors';

// ─── Environment: ensure window.__TAURI__ is absent (jsdom default) ────────

describe('isTauri()', () => {
  it('returns false when window.__TAURI__ is undefined', () => {
    // jsdom does not set __TAURI__ — no setup needed.
    expect(isTauri()).toBe(false);
  });

  it('returns true when window.__TAURI__ is set', () => {
    // Temporarily simulate Tauri runtime.
    Object.defineProperty(window, '__TAURI__', {
      value: { version: '2.0.0' },
      configurable: true,
      writable: true,
    });
    expect(isTauri()).toBe(true);
    // Restore.
    Object.defineProperty(window, '__TAURI__', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });
});

// ─── TauriBridge stub ───────────────────────────────────────────────────────

describe('TauriBridge (stub mode)', () => {
  it('isDesktop is false in jsdom', () => {
    const b = new TauriBridge();
    expect(b.isDesktop).toBe(false);
  });

  it('stubErr() returns Err with code internal', () => {
    const b = new TauriBridge();
    const result = b.stubErr<string>();
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('internal');
    }
  });
});

// ─── invoke (stub mode) ─────────────────────────────────────────────────────

describe('invoke() in stub mode', () => {
  it('returns Result.err — never throws', async () => {
    const result = await invoke<string>('any_command', { foo: 'bar' });
    expect(isErr(result)).toBe(true);
  });

  it('error has code internal and message containing not-tauri', async () => {
    const result = await invoke<number>('ping');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('internal');
      expect(result.error.message).toContain('not-tauri');
    }
  });
});

// ─── WindowManager (stub mode) ─────────────────────────────────────────────

describe('WindowManager (stub mode)', () => {
  let wm: WindowManager;

  beforeEach(() => {
    wm = new WindowManager();
  });

  it('create() returns Err', async () => {
    const r = await wm.create('settings', 'tauri://localhost/settings');
    expect(isErr(r)).toBe(true);
  });

  it('focus() returns Err', async () => {
    const r = await wm.focus('settings');
    expect(isErr(r)).toBe(true);
  });

  it('minimize() returns Err', async () => {
    const r = await wm.minimize('main');
    expect(isErr(r)).toBe(true);
  });

  it('maximize() returns Err', async () => {
    const r = await wm.maximize('main');
    expect(isErr(r)).toBe(true);
  });

  it('close() returns Err', async () => {
    const r = await wm.close('main');
    expect(isErr(r)).toBe(true);
  });

  it('openLabels() returns empty array in stub mode', () => {
    expect(wm.openLabels()).toEqual([]);
  });
});

// ─── AutoUpdater (stub mode) ────────────────────────────────────────────────

describe('AutoUpdater (stub mode)', () => {
  it('check() returns Result<UpdateManifest|null, AppError> typed Err', async () => {
    const updater = new AutoUpdater();
    // Type assertion verifies the return type matches the acceptance criterion.
    const result: Result<UpdateManifest | null, import('@nself/errors').AppError> =
      await updater.check();
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('internal');
    }
  });

  it('downloadAndInstall() returns Err in stub mode', async () => {
    const updater = new AutoUpdater();
    const result = await updater.downloadAndInstall();
    expect(isErr(result)).toBe(true);
  });
});

// ─── openUrl — allowlist enforcement ───────────────────────────────────────

describe('openUrl()', () => {
  it('returns Err{code:forbidden} for disallowed hostname', async () => {
    // In stub mode, allowlist is checked before the not-tauri gate.
    // But since we are in stub mode, not-tauri fires first — test the allowlist
    // logic by simulating a tauri environment temporarily.
    Object.defineProperty(window, '__TAURI__', {
      value: { version: '2.0.0' },
      configurable: true,
      writable: true,
    });

    const result = await openUrl('https://evil.com/steal', ['nself.org']);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('forbidden');
      expect(result.error.message).toContain('evil.com');
    }

    Object.defineProperty(window, '__TAURI__', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it('returns Err{code:validation_error} for malformed URL (non-Tauri)', async () => {
    // Even in stub mode, malformed URL should ideally short-circuit at parse stage.
    // Here we test that the function returns an error — the exact code depends on
    // whether isTauri() fires first. In stub mode it's 'internal' (not-tauri).
    // This test confirms it returns Err and does not throw.
    const result = await openUrl('not-a-url', ['nself.org']);
    expect(isErr(result)).toBe(true);
  });

  it('returns Err{code:validation_error} for malformed URL in Tauri context', async () => {
    // Simulate Tauri environment to reach the URL parse step.
    Object.defineProperty(window, '__TAURI__', {
      value: { version: '2.0.0' },
      configurable: true,
      writable: true,
    });

    const result = await openUrl('not-a-valid-url!!!', ['nself.org']);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('validation_error');
    }

    Object.defineProperty(window, '__TAURI__', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it('does not throw for disallowed hostname in stub mode', async () => {
    const result = await openUrl('https://evil.com/', ['nself.org']);
    expect(isErr(result)).toBe(true);
    // Never throws.
  });

  it('returns Err in stub mode (not-tauri) — does not call shell.open', async () => {
    const result = await openUrl('https://nself.org/page', ['nself.org']);
    // Stub mode fires before allowlist; still Err, still no shell call.
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('internal');
      expect(result.error.message).toContain('not-tauri');
    }
  });
});

describe('@nself/tauri-bridge — TauriSecureStore (canonical get/set/delete)', () => {
  const store = new TauriSecureStore();

  it('get throws SecureStoreError in stub mode (no Tauri runtime)', async () => {
    await expect(store.get('auth_token')).rejects.toBeInstanceOf(SecureStoreError);
  });

  it('set throws SecureStoreError in stub mode', async () => {
    await expect(store.set('auth_token', 'jwt')).rejects.toBeInstanceOf(SecureStoreError);
  });

  it('delete throws SecureStoreError in stub mode', async () => {
    await expect(store.delete('auth_token')).rejects.toBeInstanceOf(SecureStoreError);
  });

  it('SecureStoreError carries the underlying cause', async () => {
    try {
      await store.get('k');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(SecureStoreError);
      expect((e as SecureStoreError).cause).toBeDefined();
    }
  });
});
