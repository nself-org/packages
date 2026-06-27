/**
 * Unit tests for TauriFsAdapter.
 *
 * Coverage:
 * - read() returns [] when file is missing (simulated by readTextFile throwing)
 * - write() → read() roundtrip (mocked fs)
 * - clear() → read() returns []
 * - Non-Tauri environment throws on any operation
 *
 * Uses vi.mock to intercept @tauri-apps/plugin-fs dynamic import.
 * window.__TAURI__ is set/deleted per test to simulate Tauri/non-Tauri.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { QueuedMutation } from '../../types.js';

// Mocked filesystem state shared between mock and tests
const mockFsState = {
  files: new Map<string, string>(),
  shouldThrowOnRead: false,
};

// Mock @tauri-apps/plugin-fs before importing the adapter
vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(async (path: string) => {
    if (mockFsState.shouldThrowOnRead) {
      throw new Error('os error 2: No such file or directory');
    }
    const contents = mockFsState.files.get(path);
    if (contents === undefined) {
      throw new Error('os error 2: No such file or directory');
    }
    return contents;
  }),
  writeTextFile: vi.fn(async (path: string, contents: string) => {
    mockFsState.files.set(path, contents);
  }),
}));

// Import after mock is set up
import { TauriFsAdapter } from '../tauri-fs.js';

const TEST_FILE = 'test-queue.json';

const makeItem = (overrides: Partial<QueuedMutation> = {}): QueuedMutation => ({
  id: 'tauri-item-1',
  type: 'CREATE_TASK',
  payload: { title: 'Tauri task' },
  retryCount: 0,
  maxRetries: 3,
  enqueuedAt: 1000,
  ...overrides,
});

function setTauriEnv(active: boolean): void {
  if (active) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__TAURI__ = {};
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).__TAURI__;
  }
}

describe('TauriFsAdapter', () => {
  let adapter: TauriFsAdapter;

  beforeEach(() => {
    mockFsState.files.clear();
    mockFsState.shouldThrowOnRead = false;
    setTauriEnv(true);
    adapter = new TauriFsAdapter(TEST_FILE);
  });

  afterEach(() => {
    setTauriEnv(false);
    vi.clearAllMocks();
  });

  it('read() returns [] when file does not exist', async () => {
    const result = await adapter.read();
    expect(result).toEqual([]);
  });

  it('read() returns [] on unexpected read error', async () => {
    mockFsState.shouldThrowOnRead = true;
    const result = await adapter.read();
    expect(result).toEqual([]);
  });

  it('write() → read() roundtrip preserves all fields', async () => {
    const item = makeItem({
      id: 'roundtrip-id',
      type: 'UPDATE_TASK',
      payload: { done: true },
      retryCount: 1,
      maxRetries: 3,
      enqueuedAt: 1700000000000,
      lastAttemptAt: 1700000001000,
    });

    await adapter.write([item]);
    const result = await adapter.read();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(item);
  });

  it('write() with multiple items roundtrips correctly', async () => {
    const items = [
      makeItem({ id: 'a', enqueuedAt: 100 }),
      makeItem({ id: 'b', enqueuedAt: 200 }),
    ];

    await adapter.write(items);
    const result = await adapter.read();
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('clear() → read() returns []', async () => {
    await adapter.write([makeItem()]);
    expect(await adapter.read()).toHaveLength(1);

    await adapter.clear();
    const result = await adapter.read();
    expect(result).toEqual([]);
  });

  it('throws in non-Tauri environment (read)', async () => {
    setTauriEnv(false);
    const nonTauriAdapter = new TauriFsAdapter(TEST_FILE);
    await expect(nonTauriAdapter.read()).rejects.toThrow('TauriFsAdapter requires a Tauri environment');
  });

  it('throws in non-Tauri environment (write)', async () => {
    setTauriEnv(false);
    const nonTauriAdapter = new TauriFsAdapter(TEST_FILE);
    await expect(nonTauriAdapter.write([makeItem()])).rejects.toThrow(
      'TauriFsAdapter requires a Tauri environment',
    );
  });

  it('throws in non-Tauri environment (clear)', async () => {
    setTauriEnv(false);
    const nonTauriAdapter = new TauriFsAdapter(TEST_FILE);
    await expect(nonTauriAdapter.clear()).rejects.toThrow(
      'TauriFsAdapter requires a Tauri environment',
    );
  });
});
