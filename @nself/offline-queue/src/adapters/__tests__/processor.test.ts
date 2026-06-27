/**
 * Unit tests for QueueProcessor (via MemoryAdapter).
 *
 * Coverage:
 * - enqueue → size is 1
 * - enqueue same id twice → size is still 1 (deduplication)
 * - drain with always-succeeding executeFn → { processed: 1, failed: 0 }, size = 0
 * - drain with always-failing executeFn → retries up to maxRetries, then removes (failed: 1)
 * - peek() returns items without removing them
 * - clear() empties the queue
 * - drain() with mixed success/failure → correct processed+failed counts
 * - FIFO order is respected by drain()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueueProcessor } from '../../processor.js';
import { MemoryAdapter } from '../memory.js';
import type { QueuedMutation } from '../../types.js';

function makeProcessor(
  executeFn: (m: QueuedMutation) => Promise<void> = async () => {},
  opts?: { maxRetries?: number; backoffMs?: number },
): { processor: QueueProcessor; adapter: MemoryAdapter } {
  const adapter = new MemoryAdapter();
  const processor = new QueueProcessor(adapter, executeFn, {
    backoffMs: 0, // Disable delays in tests
    ...opts,
  });
  return { processor, adapter };
}

describe('QueueProcessor', () => {
  describe('enqueue', () => {
    it('enqueue → size is 1', async () => {
      const { processor } = makeProcessor();
      await processor.enqueue('CREATE_TASK', { title: 'Test' });
      expect(await processor.size()).toBe(1);
    });

    it('enqueue same id twice → size is still 1 (dedup)', async () => {
      const { processor } = makeProcessor();
      await processor.enqueue('CREATE_TASK', { title: 'First' }, 'dedup-key');
      await processor.enqueue('CREATE_TASK', { title: 'Second' }, 'dedup-key');
      expect(await processor.size()).toBe(1);
    });

    it('enqueue different ids → both enqueued', async () => {
      const { processor } = makeProcessor();
      await processor.enqueue('CREATE_TASK', { title: 'A' }, 'id-a');
      await processor.enqueue('CREATE_TASK', { title: 'B' }, 'id-b');
      expect(await processor.size()).toBe(2);
    });

    it('enqueue without explicit id generates a unique id', async () => {
      const { processor } = makeProcessor();
      await processor.enqueue('CREATE_TASK', { title: 'Auto ID 1' });
      await processor.enqueue('CREATE_TASK', { title: 'Auto ID 2' });
      expect(await processor.size()).toBe(2);
    });
  });

  describe('drain — success path', () => {
    it('drain with succeeding executeFn → { processed: 1, failed: 0 }, size = 0', async () => {
      const executeFn = vi.fn(async () => {});
      const { processor } = makeProcessor(executeFn);

      await processor.enqueue('CREATE_TASK', { title: 'Do it' });
      const result = await processor.drain();

      expect(result).toEqual({ processed: 1, failed: 0 });
      expect(await processor.size()).toBe(0);
      expect(executeFn).toHaveBeenCalledTimes(1);
    });

    it('drain on empty queue → { processed: 0, failed: 0 }', async () => {
      const { processor } = makeProcessor();
      const result = await processor.drain();
      expect(result).toEqual({ processed: 0, failed: 0 });
    });
  });

  describe('drain — failure path', () => {
    it('always-failing fn retries maxRetries times then removes (failed: 1)', async () => {
      const executeFn = vi.fn(async () => {
        throw new Error('Network error');
      });
      const { processor } = makeProcessor(executeFn, { maxRetries: 3, backoffMs: 0 });

      await processor.enqueue('CREATE_TASK', { title: 'Fail me' });
      const result = await processor.drain();

      expect(result).toEqual({ processed: 0, failed: 1 });
      expect(await processor.size()).toBe(0); // Removed after permanent failure
      // Initial attempt + 3 retries = 4 total calls
      expect(executeFn).toHaveBeenCalledTimes(4);
    });

    it('partial failure: one succeeds, one fails → correct counts', async () => {
      let callCount = 0;
      const executeFn = vi.fn(async (m: QueuedMutation) => {
        callCount++;
        if (m.id === 'failing') throw new Error('fail');
      });
      const { processor } = makeProcessor(executeFn, { maxRetries: 1, backoffMs: 0 });

      await processor.enqueue('CREATE_TASK', {}, 'succeeding');
      await processor.enqueue('CREATE_TASK', {}, 'failing');

      const result = await processor.drain();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
      expect(await processor.size()).toBe(0);
    });
  });

  describe('drain — FIFO order', () => {
    it('processes items in enqueuedAt order', async () => {
      const order: string[] = [];
      const executeFn = async (m: QueuedMutation) => {
        order.push(m.id);
      };
      const { processor, adapter } = makeProcessor(executeFn);

      // Write directly to adapter with specific enqueuedAt values
      await adapter.write([
        {
          id: 'third',
          type: 'T',
          payload: null,
          retryCount: 0,
          maxRetries: 3,
          enqueuedAt: 3000,
        },
        {
          id: 'first',
          type: 'T',
          payload: null,
          retryCount: 0,
          maxRetries: 3,
          enqueuedAt: 1000,
        },
        {
          id: 'second',
          type: 'T',
          payload: null,
          retryCount: 0,
          maxRetries: 3,
          enqueuedAt: 2000,
        },
      ]);

      await processor.drain();
      expect(order).toEqual(['first', 'second', 'third']);
    });
  });

  describe('peek', () => {
    it('peek() returns items without removing them', async () => {
      const { processor } = makeProcessor();
      await processor.enqueue('CREATE_TASK', { title: 'Peek me' });

      const items = await processor.peek();
      expect(items).toHaveLength(1);
      expect(await processor.size()).toBe(1); // Still in queue
    });

    it('peek() returns empty array on empty queue', async () => {
      const { processor } = makeProcessor();
      const items = await processor.peek();
      expect(items).toEqual([]);
    });
  });

  describe('clear', () => {
    it('clear() empties the queue', async () => {
      const { processor } = makeProcessor();
      await processor.enqueue('T', {});
      await processor.enqueue('T', {});
      expect(await processor.size()).toBe(2);

      await processor.clear();
      expect(await processor.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('size() reflects current queue length', async () => {
      const { processor } = makeProcessor();
      expect(await processor.size()).toBe(0);

      await processor.enqueue('T', {});
      expect(await processor.size()).toBe(1);

      await processor.enqueue('T', {});
      expect(await processor.size()).toBe(2);
    });
  });
});
