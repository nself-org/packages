/**
 * @nself/offline-queue — core barrel.
 *
 * Purpose: Export types, the StorageAdapter interface, and QueueProcessor.
 *          Intentionally does NOT re-export adapters/ — those are tree-shaken
 *          via the separate `@nself/offline-queue/adapters` export path, keeping
 *          web/TV bundles free of MMKV/Tauri imports unless explicitly used.
 * SPORT: Part of @nself/offline-queue package.
 */

export type { QueuedMutation, TypedQueuedMutation, QueueProcessorOptions } from './types.js';
export type { StorageAdapter } from './adapter.js';
export { QueueProcessor } from './processor.js';
