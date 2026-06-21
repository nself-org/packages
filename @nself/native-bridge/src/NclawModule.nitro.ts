/**
 * NclawModule.nitro.ts — Unified NclawModule HybridObject facade + re-exports.
 *
 * Purpose: Define the top-level NclawModule HybridObject that exposes all FFI
 *          groups as sub-modules, and re-export all public symbols from this
 *          package's native-bridge sub-modules so consumers have a single import:
 *            import { NativeNclaw } from '@nself/native-bridge';
 *
 *          Group D async interface specs (NclawDbModule, NclawLlmModule,
 *          NclawVaultModule, NclawSyncModule) are in NclawModule.groups-d.ts.
 *          Opaque handles and synchronous groups (A/B/C) are in NclawModule.interfaces.ts.
 *          Stub implementations and registry are in NclawModule.stub.ts.
 *
 * Inputs:  Sub-interface types from NclawModule.interfaces.ts + NclawModule.groups-d.ts.
 * Outputs: NclawModule (unified facade); all public re-exports.
 *
 * Constraints:
 *   - This file is the canonical single import for consumers.
 *   - libnclaw_last_error is INTERNAL to native; not exposed here.
 *
 * SPORT: F08-SERVICE-INVENTORY.md — libnclaw JSI bridge in native-bridge package
 * Cross-ref: NclawModule.interfaces.ts (Groups A–C + opaque handles)
 *            NclawModule.groups-d.ts (Group D interface specs)
 *            NclawModule.stub.ts (stubs + registry)
 *            T-P3-E4-W1-S1-T02 (FFI symbol audit — §5 Group D)
 */

import type {
  NclawCryptoModule,
  NclawDampersModule,
  NclawCoreModule,
} from './NclawModule.interfaces.js';

import type {
  NclawDbModule,
  NclawLlmModule,
  NclawVaultModule,
  NclawSyncModule,
} from './NclawModule.groups-d.js';

export type {
  NativeDeviceKeypair,
  NativeSessionCipher,
  NclawCryptoModule,
  NclawDampersModule,
  NclawCoreModule,
} from './NclawModule.interfaces.js';

export type {
  NclawDbModule,
  NclawLlmModule,
  NclawVaultModule,
  NclawSyncModule,
} from './NclawModule.groups-d.js';

// =============================================================================
// NclawModule — unified HybridObject facade (JSI entry point)
//
// nclaw/mobile imports NativeNclaw from @nself/native-bridge and calls
// methods directly:
//   import { NativeNclaw } from '@nself/native-bridge';
//   NativeNclaw.chatSend('hello');  // resolves without native crash
//
// chatSend / memorySearch / memoryInsert are the high-level convenience
// methods mapped to the Rust core's primary chat + memory surface.
// Under the hood they delegate to NclawCryptoModule + NclawDbModule.
// =============================================================================

/**
 * NclawModule — top-level NitroModules HybridObject exported as NativeNclaw.
 *
 * Purpose: Primary JSI entry point for nclaw/mobile. Provides convenience methods
 *          for chat + memory (the primary nclaw/mobile surface) and sub-module
 *          accessors for specialised FFI surface groups.
 * Inputs:  (native registration via registerNativeNclaw in NclawModule.stub.ts)
 * Outputs: chatSend, memorySearch, memoryInsert, memoryReplace; sub-module accessors.
 * Constraints:
 *   - All methods comply with thread-safety rules from RF-01.
 *   - Blocking FFI calls run on a dedicated serial background queue.
 *   - libnclaw_last_error() is captured on the same thread as the failing call.
 *   - Error message is propagated to JS as a rejected Promise.
 * SPORT: F08-SERVICE-INVENTORY.md — libnclaw JSI bridge in native-bridge package
 */
export interface NclawModule {
  // ---------------------------------------------------------------------------
  // Primary chat + memory surface (nclaw/mobile high-level API)
  // ---------------------------------------------------------------------------

  /**
   * Send a message to the nclaw Rust inference engine.
   * This is the primary entry point verified by the acceptance test:
   *   NativeNclaw.chatSend('hello') resolves without native crash.
   *
   * Delegates to libnclaw's chat inference pipeline (LLM + memory retrieval).
   * Runs on background thread; JS thread remains responsive.
   * @param message — user message string
   * @returns AI response string
   * @throws Error if the Rust core returns an error (propagated via libnclaw_last_error).
   */
  chatSend(message: string): Promise<string>;

  /**
   * Search persistent memories by semantic similarity.
   * @param query — natural-language search string
   * @param limit — max number of Memory results to return (default: 10)
   * @returns JSON array of Memory structs ordered by relevance
   * @throws Error on DB or embedding failure.
   */
  memorySearch(query: string, limit: number): Promise<string>;

  /**
   * Insert a conversation turn into persistent memory.
   * The Rust side extracts facts, preferences, and events from the turn.
   * @param messageJson — JSON-serialized Message struct
   * @throws Error on storage failure.
   */
  memoryInsert(messageJson: string): Promise<void>;

  /**
   * Replace an existing memory entry (upsert by ID).
   * @param id          — memory ID to replace
   * @param messageJson — JSON-serialized Message struct with new content
   * @throws Error if ID not found or storage failure.
   */
  memoryReplace(id: string, messageJson: string): Promise<void>;

  // ---------------------------------------------------------------------------
  // Sub-module accessors — access specialised FFI surface groups
  // ---------------------------------------------------------------------------

  /** Access Group A: crypto/handshake operations (lib.rs symbols 2–9). */
  readonly crypto: NclawCryptoModule;

  /** Access Group B: platform damper setters (mobile_ffi.rs symbols 11–13). */
  readonly dampers: NclawDampersModule;

  /** Access Group C: frb-ported core functions (api.rs symbols 14–16). */
  readonly core: NclawCoreModule;

  /** Access Group D: DB operations (planned symbols D1–D5). */
  readonly db: NclawDbModule;

  /** Access Group D: LLM inference (planned symbols D6–D10). */
  readonly llm: NclawLlmModule;

  /** Access Group D: OS keychain vault (planned symbols D11–D15). */
  readonly vault: NclawVaultModule;

  /** Access Group D: server sync (planned symbols D16–D19). */
  readonly sync: NclawSyncModule;
}

// Stubs, registry, and NativeNclaw proxy are in NclawModule.stub.ts.
// Index re-exports all public symbols from both files via NclawModule.nitro.js imports.
export {
  NclawModuleNotImplementedError,
  NclawModuleStub,
  registerNativeNclaw,
  getNativeNclaw,
  NativeNclaw,
} from './NclawModule.stub.js';
