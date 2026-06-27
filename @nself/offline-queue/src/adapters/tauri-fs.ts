/**
 * TauriFsAdapter — @tauri-apps/plugin-fs StorageAdapter for @nself/offline-queue.
 *
 * Purpose: Persist the offline queue to the local filesystem via Tauri v2's
 *          plugin-fs, for use in Tauri desktop apps (Windows/macOS/Linux).
 * Inputs:  Optional filePath (default: 'ntask-offline-queue.json').
 *          Callers should resolve the full path using appDataDir() at runtime.
 * Outputs: QueuedMutation[] on read; void on write/clear.
 * Constraints:
 *   - Guards against non-Tauri environments: throws if window.__TAURI__ is absent.
 *   - Uses dynamic import of @tauri-apps/plugin-fs (optional peerDependency).
 *   - read() returns [] on ENOENT or any parse error (file-not-found is safe).
 *   - @tauri-apps/plugin-fs is optional peerDep — not imported statically.
 * SPORT: Part of @nself/offline-queue package.
 */

import type { StorageAdapter } from '../adapter.js';
import type { QueuedMutation } from '../types.js';

const DEFAULT_FILE_PATH = 'ntask-offline-queue.json';

function assertTauriEnv(): void {
  if (typeof window === 'undefined' || !('__TAURI__' in window)) {
    throw new Error(
      'TauriFsAdapter requires a Tauri environment (window.__TAURI__ not found). ' +
        'Use a different adapter (IdbAdapter, MmkvAdapter, MemoryAdapter) in non-Tauri contexts.',
    );
  }
}

type TauriFs = {
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, contents: string): Promise<void>;
};

async function getTauriFs(): Promise<TauriFs> {
  // Dynamic import keeps this out of non-Tauri bundles
  const mod = (await import('@tauri-apps/plugin-fs')) as TauriFs;
  return mod;
}

export class TauriFsAdapter implements StorageAdapter {
  private readonly filePath: string;

  constructor(filePath: string = DEFAULT_FILE_PATH) {
    this.filePath = filePath;
  }

  async read(): Promise<QueuedMutation[]> {
    assertTauriEnv();
    try {
      const fs = await getTauriFs();
      const raw = await fs.readTextFile(this.filePath);
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as QueuedMutation[];
    } catch {
      // ENOENT or JSON parse error — treat as empty queue
      return [];
    }
  }

  async write(items: QueuedMutation[]): Promise<void> {
    assertTauriEnv();
    const fs = await getTauriFs();
    await fs.writeTextFile(this.filePath, JSON.stringify(items));
  }

  async clear(): Promise<void> {
    assertTauriEnv();
    const fs = await getTauriFs();
    await fs.writeTextFile(this.filePath, '[]');
  }
}

/**
 * Factory function for TauriFsAdapter.
 * @param filePath - Full path to the queue file. Default is relative;
 *                   callers should resolve an absolute path using
 *                   `appDataDir()` from @tauri-apps/api/path at startup.
 */
export function createTauriFsAdapter(filePath?: string): StorageAdapter {
  return new TauriFsAdapter(filePath);
}
