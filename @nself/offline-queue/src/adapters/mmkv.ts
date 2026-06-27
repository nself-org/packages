/**
 * MmkvAdapter — react-native-mmkv StorageAdapter for @nself/offline-queue.
 *
 * Purpose: Persist the offline queue in MMKV for React Native (iOS/Android).
 *          Does NOT import react-native-mmkv directly — accepts a minimal `MmkvLike`
 *          interface so the adapter compiles cleanly in web builds where MMKV is absent.
 * Inputs:  MmkvLike instance (typically `new MMKV()` from react-native-mmkv),
 *          optional storage key (default: 'ntask:offline-queue:v1').
 * Outputs: QueuedMutation[] on read; void on write/clear.
 * Constraints: react-native-mmkv is an optional peerDependency.
 *              Callers must pass the MMKV instance; this file never instantiates it.
 * SPORT: Part of @nself/offline-queue package.
 */

import type { StorageAdapter } from '../adapter.js';
import type { QueuedMutation } from '../types.js';

const DEFAULT_KEY = 'ntask:offline-queue:v1';

/**
 * Minimal interface matching the subset of react-native-mmkv's MMKV class
 * used by this adapter. Using a structural type avoids importing the package
 * and keeps web bundle trees clean.
 */
export interface MmkvLike {
  getString(key: string): string | undefined | null;
  set(key: string, value: string): void;
  delete(key: string): void;
}

export class MmkvAdapter implements StorageAdapter {
  private readonly mmkv: MmkvLike;
  private readonly key: string;

  constructor(mmkv: MmkvLike, key: string = DEFAULT_KEY) {
    this.mmkv = mmkv;
    this.key = key;
  }

  async read(): Promise<QueuedMutation[]> {
    try {
      const raw = this.mmkv.getString(this.key);
      if (raw == null || raw === '') return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as QueuedMutation[];
    } catch {
      return [];
    }
  }

  async write(items: QueuedMutation[]): Promise<void> {
    this.mmkv.set(this.key, JSON.stringify(items));
  }

  async clear(): Promise<void> {
    this.mmkv.delete(this.key);
  }
}

/**
 * Factory function for MmkvAdapter.
 */
export function createMmkvAdapter(mmkv: MmkvLike, key?: string): StorageAdapter {
  return new MmkvAdapter(mmkv, key);
}
