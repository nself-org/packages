/**
 * Core types for @nself/offline-queue.
 *
 * Purpose: Define the storage-level QueuedMutation shape and processor
 *          configuration options used across all adapters and the QueueProcessor.
 * Inputs:  N/A (type declarations only)
 * Outputs: Exported interfaces consumed by adapter.ts, processor.ts, and consumers.
 * Constraints: payload is `unknown` at storage level; consumers use TypedQueuedMutation<T>
 *              for typed access. exactOptionalPropertyTypes is on — use `field?: T` not
 *              `field: T | undefined`.
 * SPORT: Part of @nself/offline-queue package (packages F-file inventory).
 */

/**
 * Storage-level queued mutation record.
 * `payload` is `unknown` here so adapters can work without type parameters.
 * Consumers who need typed payloads should cast to `TypedQueuedMutation<T>`.
 */
export interface QueuedMutation {
  /** Idempotency key — used for deduplication on enqueue. */
  id: string;
  /** Discriminant string; consumers narrow locally (e.g. 'CREATE_TASK', 'DELETE_TASK'). */
  type: string;
  /** Opaque payload. Cast to a typed shape at the consumer call site. */
  payload: unknown;
  /** How many times this item has been attempted (starts at 0). */
  retryCount: number;
  /** Maximum number of retry attempts before the item is dropped as failed. */
  maxRetries: number;
  /** Unix ms timestamp when the item was first enqueued (Date.now()). */
  enqueuedAt: number;
  /** Unix ms timestamp of the most recent attempt, if any. */
  lastAttemptAt?: number;
}

/**
 * Convenience alias for consumers who want a typed payload.
 * Cast a raw `QueuedMutation` to this when the type discriminant is known.
 */
export type TypedQueuedMutation<T> = Omit<QueuedMutation, 'payload'> & { payload: T };

/**
 * Options for QueueProcessor.
 */
export interface QueueProcessorOptions {
  /** Max retry attempts per item. Defaults to 3. */
  maxRetries?: number;
  /** Base backoff in ms for exponential delay: `backoffMs * 2^retryCount`. Defaults to 500. */
  backoffMs?: number;
  /** HTTP header name for the idempotency key. Defaults to 'X-Idempotency-Key'. */
  idempotencyHeader?: string;
}
