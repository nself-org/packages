/**
 * IdbAdapter — native IndexedDB StorageAdapter for @nself/offline-queue.
 *
 * Purpose: Persist the offline queue in IndexedDB for browser/Vite web apps.
 *          Uses the native IndexedDB API with no npm dependency.
 * Inputs:  Optional dbName (default: 'ntask-offline') and storeName (default: 'mutations').
 * Outputs: QueuedMutation[] on read (sorted by enqueuedAt, FIFO); void on write/clear.
 * Constraints:
 *   - Throws immediately if `typeof indexedDB === 'undefined'` (guards SSR/Node/RN).
 *   - DB is opened lazily on first use (one-time setup, then reused).
 *   - write() clears then adds all items in a single transaction (full overwrite).
 *   - read() uses the enqueuedAt index for guaranteed FIFO ordering.
 * SPORT: Part of @nself/offline-queue package.
 */

import type { StorageAdapter } from '../adapter.js';
import type { QueuedMutation } from '../types.js';

const DEFAULT_DB_NAME = 'ntask-offline';
const DEFAULT_STORE_NAME = 'mutations';
const ENQUEUEDEAT_INDEX = 'by_enqueuedAt';
const DB_VERSION = 1;

export class IdbAdapter implements StorageAdapter {
  private readonly dbName: string;
  private readonly storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = DEFAULT_DB_NAME, storeName: string = DEFAULT_STORE_NAME) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async getDb(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available in this environment');
    }

    if (this.db !== null) return this.db;

    const storeName = this.storeName;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex(ENQUEUEDEAT_INDEX, 'enqueuedAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.db;
  }

  async read(): Promise<QueuedMutation[]> {
    const db = await this.getDb();

    return new Promise<QueuedMutation[]>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index(ENQUEUEDEAT_INDEX);
      const request = index.getAll();

      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest<QueuedMutation[]>).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async write(items: QueuedMutation[]): Promise<void> {
    const db = await this.getDb();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      // Clear then add all items in the same transaction
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        let remaining = items.length;

        if (remaining === 0) {
          // Nothing to add — tx will complete naturally
          return;
        }

        for (const item of items) {
          const addRequest = store.add(item);
          addRequest.onerror = (event) => {
            reject((event.target as IDBRequest).error);
          };
          addRequest.onsuccess = () => {
            remaining--;
            // All adds queued; tx.oncomplete handles resolution
          };
        }
      };

      clearRequest.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };

      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject((event.target as IDBTransaction).error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDb();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };

      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject((event.target as IDBTransaction).error);
    });
  }
}

/**
 * Factory function for IdbAdapter.
 */
export function createIdbAdapter(dbName?: string, storeName?: string): StorageAdapter {
  return new IdbAdapter(dbName, storeName);
}
