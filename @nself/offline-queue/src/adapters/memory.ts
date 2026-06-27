/**
 * MemoryAdapter — in-memory StorageAdapter for @nself/offline-queue.
 *
 * Purpose: Provide a zero-dependency, ephemeral adapter suitable for TV apps,
 *          unit tests, and SSR environments where no persistent storage is needed.
 * Inputs:  None (state is internal).
 * Outputs: QueuedMutation[] on read; void on write/clear.
 * Constraints: State is lost on process restart. Not suitable for production mobile/desktop.
 * SPORT: Part of @nself/offline-queue package.
 */

import type { StorageAdapter } from '../adapter.js';
import type { QueuedMutation } from '../types.js';

export class MemoryAdapter implements StorageAdapter {
  private items: QueuedMutation[] = [];

  async read(): Promise<QueuedMutation[]> {
    return [...this.items];
  }

  async write(items: QueuedMutation[]): Promise<void> {
    this.items = [...items];
  }

  async clear(): Promise<void> {
    this.items = [];
  }
}

/**
 * Factory function for MemoryAdapter.
 * Each call returns a fresh, independent adapter instance.
 */
export function createMemoryAdapter(): StorageAdapter {
  return new MemoryAdapter();
}
