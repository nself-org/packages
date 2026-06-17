/**
 * @nself/tauri-bridge — public API barrel.
 *
 * Purpose: Single import point for all nSelf desktop code that needs to
 *          interact with the Tauri 2 runtime.
 * Outputs: isTauri, bridge, TauriBridge — environment detection and singleton
 *          invoke — typed IPC command caller
 *          WindowManager — named-window lifecycle helpers
 *          AutoUpdater, UpdateManifest — update-check and install flow
 *          openUrl — allowlist-gated system browser opener
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/tauri-bridge
 */

// Environment detection + singleton
export { isTauri, bridge, TauriBridge } from './bridge.js';

// Typed IPC invoke
export { invoke } from './ipc.js';

// Window management
export { WindowManager } from './window.js';

// Auto-updater
export { AutoUpdater } from './update.js';
export type { UpdateManifest } from './update.js';

// Shell / system browser
export { openUrl } from './shell.js';

// SecureStore — OS-keychain-backed, canonical get/set/delete contract
// (matches @nself/auth-core SecureStoreInterface and @nself/native-bridge).
export type { SecureStoreInterface } from './secure-store.js';
export { TauriSecureStore, SecureStoreError } from './secure-store.js';
