/**
 * @nself/offline-queue/adapters — adapter barrel.
 *
 * Purpose: Re-export all platform adapters from the `/adapters` subpath export.
 *          Consumers import from `@nself/offline-queue/adapters` (or a more specific
 *          subpath) to opt-in to platform-specific dependencies without polluting
 *          the main bundle tree.
 * SPORT: Part of @nself/offline-queue package.
 */

export { MmkvAdapter, createMmkvAdapter } from './mmkv.js';
export type { MmkvLike } from './mmkv.js';
export { IdbAdapter, createIdbAdapter } from './idb.js';
export { TauriFsAdapter, createTauriFsAdapter } from './tauri-fs.js';
export { MemoryAdapter, createMemoryAdapter } from './memory.js';
