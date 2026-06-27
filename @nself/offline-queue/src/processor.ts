/**
 * QueueProcessor — FIFO offline mutation queue with idempotency and exponential backoff.
 *
 * Purpose: Accept mutations while offline, persist them via a StorageAdapter,
 *          and drain them in enqueuedAt order when connectivity resumes.
 *          Provides idempotency-key deduplication, exponential backoff retry,
 *          and permanent-failure removal after maxRetries exhausted.
 * Inputs:  StorageAdapter (persistence), executeFn (network call), QueueProcessorOptions.
 * Outputs: drain() → { processed, failed } summary; peek() → read-only item list.
 * Constraints:
 *   - drain() processes items strictly in FIFO (enqueuedAt) order.
 *   - Backoff is applied via `await delay(backoffMs * 2^retryCount)` before each retry.
 *   - Items that exceed maxRetries are removed and counted as `failed` (not re-queued).
 *   - enqueue() with a duplicate id is silently ignored (idempotent write).
 *   - noUncheckedIndexedAccess: array access guarded where needed.
 * SPORT: Part of @nself/offline-queue package.
 */

import type { StorageAdapter } from './adapter.js';
import type { QueuedMutation, QueueProcessorOptions } from './types.js';

const DEFAULT_OPTS = {
  maxRetries: 3,
  backoffMs: 500,
  idempotencyHeader: 'X-Idempotency-Key',
} as const satisfies Required<QueueProcessorOptions>;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class QueueProcessor {
  private readonly adapter: StorageAdapter;
  private readonly executeFn: (m: QueuedMutation) => Promise<void>;
  private readonly opts: Required<QueueProcessorOptions>;

  constructor(
    adapter: StorageAdapter,
    executeFn: (m: QueuedMutation) => Promise<void>,
    opts?: QueueProcessorOptions,
  ) {
    this.adapter = adapter;
    this.executeFn = executeFn;
    this.opts = {
      maxRetries: opts?.maxRetries ?? DEFAULT_OPTS.maxRetries,
      backoffMs: opts?.backoffMs ?? DEFAULT_OPTS.backoffMs,
      idempotencyHeader: opts?.idempotencyHeader ?? DEFAULT_OPTS.idempotencyHeader,
    };
  }

  /**
   * Add a mutation to the queue.
   * If `id` is not provided, a unique idempotency key is generated.
   * If an item with the same `id` already exists, the enqueue is skipped (dedup).
   */
  async enqueue(type: string, payload: unknown, id?: string): Promise<void> {
    const itemId = id ?? generateId();
    const items = await this.adapter.read();

    // Deduplication: skip if id already present
    if (items.some((item) => item.id === itemId)) {
      return;
    }

    const mutation: QueuedMutation = {
      id: itemId,
      type,
      payload,
      retryCount: 0,
      maxRetries: this.opts.maxRetries,
      enqueuedAt: Date.now(),
    };

    await this.adapter.write([...items, mutation]);
  }

  /**
   * Process all queued items in FIFO (enqueuedAt) order.
   * - On success: removes the item from the queue.
   * - On failure with retries remaining: increments retryCount, updates lastAttemptAt,
   *   applies exponential backoff (`backoffMs * 2^retryCount`), then retries inline.
   * - On permanent failure (retryCount >= maxRetries after the attempt): removes item,
   *   increments `failed` counter, and continues.
   *
   * Returns: `{ processed: number; failed: number }`
   */
  async drain(): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    // Sort by enqueuedAt for strict FIFO
    const items = (await this.adapter.read()).sort((a, b) => a.enqueuedAt - b.enqueuedAt);

    for (const item of items) {
      let current = item;
      let succeeded = false;

      // Attempt up to (maxRetries + 1) times total (initial + retries)
      while (true) {
        try {
          await this.executeFn(current);
          succeeded = true;
          break;
        } catch {
          const newRetryCount = current.retryCount + 1;
          current = {
            ...current,
            retryCount: newRetryCount,
            lastAttemptAt: Date.now(),
          };

          if (newRetryCount > current.maxRetries) {
            // Permanent failure — drop item
            break;
          }

          // Apply exponential backoff before next attempt
          const backoff = this.opts.backoffMs * Math.pow(2, current.retryCount - 1);
          await delay(backoff);
        }
      }

      // Update persisted queue: remove this item (either success or permanent failure)
      if (succeeded) {
        processed++;
        const remaining = (await this.adapter.read()).filter((i) => i.id !== current.id);
        await this.adapter.write(remaining);
      } else {
        failed++;
        const remaining = (await this.adapter.read()).filter((i) => i.id !== current.id);
        await this.adapter.write(remaining);
      }
    }

    return { processed, failed };
  }

  /**
   * Return all queued items without modifying the queue.
   */
  async peek(): Promise<QueuedMutation[]> {
    return this.adapter.read();
  }

  /**
   * Remove all items from the queue.
   */
  async clear(): Promise<void> {
    await this.adapter.clear();
  }

  /**
   * Return the number of items currently in the queue.
   */
  async size(): Promise<number> {
    const items = await this.adapter.read();
    return items.length;
  }
}
