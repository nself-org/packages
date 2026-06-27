/**
 * StorageAdapter interface for @nself/offline-queue.
 *
 * Purpose: Defines the minimal persistence contract that all platform adapters
 *          (MMKV, IndexedDB, Tauri FS, Memory) must implement.
 * Inputs:  QueuedMutation[] — the full queue state.
 * Outputs: QueuedMutation[] on read; void on write/clear.
 * Constraints: write() is a full overwrite (not append) — callers must pass the
 *              complete desired state. Implementations must be safe to call
 *              concurrently with themselves (though QueueProcessor serialises drain).
 * SPORT: Part of @nself/offline-queue package.
 */

import type { QueuedMutation } from './types.js';

/**
 * Minimal persistence contract for an offline queue backend.
 * All methods are async to accommodate both sync and async storage layers.
 */
export interface StorageAdapter {
  /**
   * Read and return all currently persisted items in FIFO order.
   * Returns an empty array when the store is empty or uninitialised.
   */
  read(): Promise<QueuedMutation[]>;

  /**
   * Overwrite the persisted store with `items`.
   * Passing an empty array is equivalent to clearing.
   */
  write(items: QueuedMutation[]): Promise<void>;

  /**
   * Remove all persisted items.
   */
  clear(): Promise<void>;
}
