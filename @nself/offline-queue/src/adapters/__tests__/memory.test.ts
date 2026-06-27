/**
 * Unit tests for MemoryAdapter.
 *
 * Coverage:
 * - read() returns [] on fresh instance
 * - write() → read() roundtrip preserves all fields
 * - clear() empties the store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryAdapter } from '../memory.js';
import type { QueuedMutation } from '../../types.js';

const makeItem = (overrides: Partial<QueuedMutation> = {}): QueuedMutation => ({
  id: 'test-id-1',
  type: 'CREATE_TASK',
  payload: { title: 'Buy milk' },
  retryCount: 0,
  maxRetries: 3,
  enqueuedAt: 1000,
  ...overrides,
});

describe('MemoryAdapter', () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter();
  });

  it('read() returns [] on a fresh instance', async () => {
    const result = await adapter.read();
    expect(result).toEqual([]);
  });

  it('write() → read() roundtrip preserves all fields', async () => {
    const item = makeItem({
      id: 'abc123',
      type: 'DELETE_TASK',
      payload: { id: 42 },
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

  it('write() with multiple items preserves order', async () => {
    const items = [
      makeItem({ id: 'a', enqueuedAt: 100 }),
      makeItem({ id: 'b', enqueuedAt: 200 }),
      makeItem({ id: 'c', enqueuedAt: 300 }),
    ];

    await adapter.write(items);
    const result = await adapter.read();

    expect(result).toHaveLength(3);
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('clear() empties the store', async () => {
    await adapter.write([makeItem()]);
    expect(await adapter.read()).toHaveLength(1);

    await adapter.clear();
    expect(await adapter.read()).toEqual([]);
  });

  it('read() returns a copy — mutations to result do not affect internal state', async () => {
    await adapter.write([makeItem({ id: 'immutable' })]);
    const result = await adapter.read();
    result.pop();

    const second = await adapter.read();
    expect(second).toHaveLength(1);
  });
});
