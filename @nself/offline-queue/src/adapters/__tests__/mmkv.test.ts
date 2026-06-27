/**
 * Unit tests for MmkvAdapter.
 *
 * Coverage:
 * - read() returns [] when key is absent
 * - read() returns [] when stored value is malformed JSON
 * - write() → read() roundtrip preserves all fields
 * - clear() removes data (subsequent read returns [])
 * - Uses a plain in-memory mock (Map-backed) matching MmkvLike interface
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MmkvAdapter } from '../mmkv.js';
import type { MmkvLike } from '../mmkv.js';
import type { QueuedMutation } from '../../types.js';

/** Minimal MMKV mock backed by a plain Map. */
function createMockMmkv(): MmkvLike & { _store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    _store: store,
    getString(key: string) {
      return store.get(key) ?? null;
    },
    set(key: string, value: string) {
      store.set(key, value);
    },
    delete(key: string) {
      store.delete(key);
    },
  };
}

const makeItem = (overrides: Partial<QueuedMutation> = {}): QueuedMutation => ({
  id: 'item-1',
  type: 'CREATE_TASK',
  payload: { title: 'Do something' },
  retryCount: 0,
  maxRetries: 3,
  enqueuedAt: 1000,
  ...overrides,
});

describe('MmkvAdapter', () => {
  let mockMmkv: ReturnType<typeof createMockMmkv>;
  let adapter: MmkvAdapter;

  beforeEach(() => {
    mockMmkv = createMockMmkv();
    adapter = new MmkvAdapter(mockMmkv);
  });

  it('read() returns [] when key is absent', async () => {
    const result = await adapter.read();
    expect(result).toEqual([]);
  });

  it('read() returns [] on malformed JSON', async () => {
    mockMmkv.set('ntask:offline-queue:v1', '{not valid json}}');
    const result = await adapter.read();
    expect(result).toEqual([]);
  });

  it('read() returns [] when stored value is not an array', async () => {
    mockMmkv.set('ntask:offline-queue:v1', JSON.stringify({ some: 'object' }));
    const result = await adapter.read();
    expect(result).toEqual([]);
  });

  it('write() → read() roundtrip preserves all fields', async () => {
    const item = makeItem({
      id: 'xyz',
      type: 'UPDATE_TASK',
      payload: { id: 1, done: true },
      retryCount: 2,
      maxRetries: 5,
      enqueuedAt: 1700000000000,
      lastAttemptAt: 1700000005000,
    });

    await adapter.write([item]);
    const result = await adapter.read();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(item);
  });

  it('write() serialises correctly to the underlying MMKV store', async () => {
    const items = [makeItem({ id: 'a' }), makeItem({ id: 'b' })];
    await adapter.write(items);

    const raw = mockMmkv.getString('ntask:offline-queue:v1');
    expect(raw).toBeDefined();
    expect(JSON.parse(raw!)).toHaveLength(2);
  });

  it('clear() removes data — subsequent read returns []', async () => {
    await adapter.write([makeItem()]);
    expect(await adapter.read()).toHaveLength(1);

    await adapter.clear();
    expect(await adapter.read()).toEqual([]);
  });

  it('supports a custom storage key', async () => {
    const customAdapter = new MmkvAdapter(mockMmkv, 'custom:key');
    await customAdapter.write([makeItem({ id: 'custom' })]);

    // Default key is untouched
    expect(mockMmkv.getString('ntask:offline-queue:v1')).toBeNull();
    // Custom key has data
    const raw = mockMmkv.getString('custom:key');
    expect(raw).toBeDefined();
  });
});
