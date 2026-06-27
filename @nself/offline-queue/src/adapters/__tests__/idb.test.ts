/**
 * Unit tests for IdbAdapter.
 *
 * Coverage:
 * - read() returns [] on empty store
 * - write() → read() roundtrip returns items in enqueuedAt order (FIFO)
 * - second write() overwrites the first (full replace)
 * - clear() empties the store
 *
 * Uses fake-indexeddb to polyfill the global indexedDB in Node/vitest.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IdbAdapter } from '../idb.js';
import type { QueuedMutation } from '../../types.js';

let dbCounter = 0;

function makeAdapter(): IdbAdapter {
  // Use a unique DB name per test to avoid cross-test state with fake-indexeddb
  dbCounter++;
  return new IdbAdapter(`ntask-offline-test-${dbCounter}`, 'mutations');
}

const makeItem = (overrides: Partial<QueuedMutation> = {}): QueuedMutation => ({
  id: `item-${Date.now()}-${Math.random()}`,
  type: 'CREATE_TASK',
  payload: { title: 'Test task' },
  retryCount: 0,
  maxRetries: 3,
  enqueuedAt: Date.now(),
  ...overrides,
});

describe('IdbAdapter', () => {
  let adapter: IdbAdapter;

  beforeEach(() => {
    adapter = makeAdapter();
  });

  it('read() returns [] on an empty store', async () => {
    const result = await adapter.read();
    expect(result).toEqual([]);
  });

  it('write() → read() roundtrip preserves all fields', async () => {
    const item = makeItem({
      id: 'stable-id',
      type: 'DELETE_TASK',
      payload: { id: 99 },
      retryCount: 1,
      maxRetries: 5,
      enqueuedAt: 1700000000000,
      lastAttemptAt: 1700000001000,
    });

    await adapter.write([item]);
    const result = await adapter.read();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(item);
  });

  it('read() returns items sorted by enqueuedAt (FIFO order)', async () => {
    const items = [
      makeItem({ id: 'c', enqueuedAt: 3000 }),
      makeItem({ id: 'a', enqueuedAt: 1000 }),
      makeItem({ id: 'b', enqueuedAt: 2000 }),
    ];

    await adapter.write(items);
    const result = await adapter.read();

    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('second write() overwrites the first (full replacement)', async () => {
    const first = [makeItem({ id: 'first-1' }), makeItem({ id: 'first-2' })];
    await adapter.write(first);
    expect(await adapter.read()).toHaveLength(2);

    const second = [makeItem({ id: 'second-1' })];
    await adapter.write(second);

    const result = await adapter.read();
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('second-1');
  });

  it('write([]) clears the store', async () => {
    await adapter.write([makeItem()]);
    await adapter.write([]);
    expect(await adapter.read()).toEqual([]);
  });

  it('clear() empties the store', async () => {
    await adapter.write([makeItem(), makeItem({ id: 'second' })]);
    expect(await adapter.read()).toHaveLength(2);

    await adapter.clear();
    expect(await adapter.read()).toEqual([]);
  });

  it('handles multiple items correctly on roundtrip', async () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      makeItem({ id: `item-${i}`, enqueuedAt: i * 1000 }),
    );

    await adapter.write(items);
    const result = await adapter.read();

    expect(result).toHaveLength(5);
    // Verify FIFO ordering
    for (let i = 0; i < result.length - 1; i++) {
      const current = result[i];
      const next = result[i + 1];
      if (current !== undefined && next !== undefined) {
        expect(current.enqueuedAt).toBeLessThanOrEqual(next.enqueuedAt);
      }
    }
  });
});
