/**
 * NclawModule.nitro.ts — Group D async HybridObject specs + unified NclawModule facade.
 *
 * Purpose: Define TypeScript interfaces for the planned async FFI groups (D: db/llm/vault/sync)
 *          and the top-level NclawModule HybridObject that exposes all groups as sub-modules.
 *          Opaque handles and synchronous groups (A/B/C) live in NclawModule.interfaces.ts.
 *          Stub implementations and registry live in NclawModule.stub.ts.
 *
 * Inputs:  Sub-interface types imported from NclawModule.interfaces.ts.
 * Outputs: NclawDbModule, NclawLlmModule, NclawVaultModule, NclawSyncModule (Group D);
 *          NclawModule (unified facade); re-exports from NclawModule.stub.ts.
 *
 * Constraints:
 *   - Group D symbols have NO current Rust implementation — planned for S15.T18+.
 *   - All Group D methods are Promise<T> (I/O-bound: SQLite, model load, network).
 *   - libnclaw_last_error is INTERNAL to native; not exposed here.
 *   - This file is the canonical single import for consumers:
 *       import { NativeNclaw } from '@nself/native-bridge';
 *
 * SPORT: F08-SERVICE-INVENTORY.md — libnclaw JSI bridge in native-bridge package
 * Cross-ref: NclawModule.interfaces.ts (Groups A–C + opaque handles)
 *            NclawModule.stub.ts (stubs + registry)
 *            T-P3-E4-W1-S1-T02 (FFI symbol audit — §5 Group D)
 */

import type {
  NclawCryptoModule,
  NclawDampersModule,
  NclawCoreModule,
} from './NclawModule.interfaces.js';

export type {
  NativeDeviceKeypair,
  NativeSessionCipher,
  NclawCryptoModule,
  NclawDampersModule,
  NclawCoreModule,
} from './NclawModule.interfaces.js';

// =============================================================================
// Group D — Planned async modules (NclawDbModule, NclawLlmModule,
//           NclawVaultModule, NclawSyncModule)
//
// Maps FFI audit §5 Group D: planned Dart stub symbols (D1–D19).
// These symbols have NO current Rust implementation — planned for S15.T18
// and future sprints. The TypeScript spec is defined here so nclaw/mobile
// can depend on the interface contract before the Rust impl lands.
//
// All I/O-bound operations are Promise<T>. Sync flag reads (D9 llmIsReady,
// D10 llmUnload) remain synchronous per the audit.
// =============================================================================

/**
 * NclawDbModule — NitroModules HybridObject spec for SQLite + vector DB.
 *
 * Maps planned Rust symbols D1–D5 (nclaw_init_db, nclaw_db_*).
 * All operations are async (SQLite I/O + potential schema migration).
 *
 * Message JSON format: serialized nclaw/core/src/types.rs Message struct.
 * Embedding format: Float32Array (see RF-03 — typed array transfer via ArrayBuffer).
 */
export interface NclawDbModule {
  /**
   * Initialize the nclaw SQLite database.
   * Maps: D1 — nclaw_init_db(db_path) — opens file, may migrate schema.
   * @param dbPath — absolute path to database file
   * @throws Error if path is invalid or migration fails.
   */
  initDb(dbPath: string): Promise<void>;

  /**
   * Insert a message into persistent storage.
   * Maps: D2 — nclaw_db_insert_message(message_json) — SQLite insert.
   * @param messageJson — JSON-serialized nclaw/core/src/types.rs Message struct
   * @throws Error on serialization failure or SQLite write error.
   */
  dbInsertMessage(messageJson: string): Promise<void>;

  /**
   * Query messages by topic identifier.
   * Maps: D3 — nclaw_db_query_by_topic(topic) — SQLite read.
   * @param topic — topic identifier string
   * @returns JSON array of Message structs
   * @throws Error on SQLite read failure.
   */
  dbQueryByTopic(topic: string): Promise<string>;

  /**
   * Perform approximate nearest-neighbour vector search.
   * Maps: D4 — nclaw_db_vector_search(embedding, limit) — vector index scan.
   * RF-03: Float32Array transfer via JSI ArrayBuffer.
   * Rust allocates f32[] array → raw ptr → JSI ArrayBuffer; freed via libnclaw_free_f32_array.
   * @param embedding — query embedding vector (Float32Array)
   * @param limit     — maximum number of results to return
   * @returns JSON array of matching Message structs
   * @throws Error on index failure.
   */
  dbVectorSearch(embedding: Float32Array, limit: number): Promise<string>;

  /**
   * Clear all messages from the database.
   * Maps: D5 — nclaw_db_clear() — SQLite DELETE ALL.
   * @throws Error on SQLite failure.
   */
  dbClear(): Promise<void>;
}

/**
 * NclawLlmModule — NitroModules HybridObject spec for on-device LLM inference.
 *
 * Maps planned Rust symbols D6–D10 (nclaw_init_llm, nclaw_llm_*).
 *
 * RF-02 CRITICAL: llmInferStream uses NitroModules event emitter pattern.
 * Cannot be Promise<string> — LLM inference is token-by-token streaming.
 * onToken fires for each generated token; onDone fires on completion.
 * The Rust side needs nclaw_llm_infer_stream(prompt, max_tokens, callback_fn)
 * with a C-ABI callback pointer — streaming protocol is option (a) from RF-02.
 */
export interface NclawLlmModule {
  /**
   * Initialize the on-device LLM from a model file.
   * Maps: D6 — nclaw_init_llm(model_path, config_json) — model load from disk.
   * Can take 2–30 seconds; always await before calling llmInferStream.
   * @param modelPath  — absolute path to the model file (.gguf or equivalent)
   * @param configJson — JSON-serialized model configuration
   * @throws Error if model file is missing, corrupt, or config is invalid.
   */
  initLlm(modelPath: string, configJson: string): Promise<void>;

  /**
   * Start streaming LLM inference (token-by-token).
   * Maps: D7 — nclaw_llm_infer_stream(prompt, max_tokens, callback_fn).
   * Fires onToken for each generated token; fires onDone on completion.
   * DOES NOT return a Promise — call is fire-and-forget; completion is via events.
   * @param prompt    — user prompt string
   * @param maxTokens — maximum number of tokens to generate
   */
  llmInferStream(prompt: string, maxTokens: number): void;

  /**
   * Event callback: fired for each generated LLM token during streaming.
   * Set before calling llmInferStream().
   */
  onToken: ((token: string) => void) | null;

  /**
   * Event callback: fired when LLM streaming inference completes.
   * Set before calling llmInferStream().
   */
  onDone: (() => void) | null;

  /**
   * Compute embedding vector for a text string.
   * Maps: D8 — nclaw_llm_embed(text) — vector computation 50–500ms.
   * RF-03: Float32Array transfer via JSI ArrayBuffer.
   * @param text — text to embed
   * @returns embedding vector as Float32Array
   * @throws Error on embedding failure.
   */
  llmEmbed(text: string): Promise<Float32Array>;

  /**
   * Check whether the LLM model is loaded and ready for inference.
   * Maps: D9 — nclaw_llm_is_ready() — atomic flag read; synchronous.
   * @returns true if model is loaded and initialized
   */
  llmIsReady(): boolean;

  /**
   * Unload the LLM model and free its memory.
   * Maps: D10 — nclaw_llm_unload() — synchronous cleanup.
   */
  llmUnload(): void;
}

/**
 * NclawVaultModule — NitroModules HybridObject spec for OS keychain access.
 *
 * Maps planned Rust symbols D11–D15 (nclaw_init_vault, nclaw_vault_*).
 * All operations are async — OS keychain may show biometric prompt on D11/D12/D13.
 * Namespace isolates different apps' keys within the same keychain.
 */
export interface NclawVaultModule {
  /**
   * Initialize the vault for a given namespace.
   * Maps: D11 — nclaw_init_vault(namespace) — OS keychain access; may prompt biometrics.
   * @param namespace — keychain service identifier (e.g. "com.nself.nclaw")
   * @throws Error on keychain access failure or biometric rejection.
   */
  initVault(namespace: string): Promise<void>;

  /**
   * Store a secret value in the OS keychain.
   * Maps: D12 — nclaw_vault_set(key, secret) — OS keychain write.
   * @param key    — key identifier
   * @param secret — secret value to store (UTF-8 string)
   * @throws Error on keychain write failure.
   */
  vaultSet(key: string, secret: string): Promise<void>;

  /**
   * Retrieve a secret value from the OS keychain.
   * Maps: D13 — nclaw_vault_get(key) — OS keychain read; nullable return.
   * @param key — key identifier
   * @returns secret value, or null if key does not exist
   * @throws Error on keychain read failure (distinct from missing key → null).
   */
  vaultGet(key: string): Promise<string | null>;

  /**
   * Delete a secret from the OS keychain.
   * Maps: D14 — nclaw_vault_delete(key) — OS keychain delete.
   * @param key — key identifier
   * @throws Error on keychain delete failure.
   */
  vaultDelete(key: string): Promise<void>;

  /**
   * Check whether a key exists in the OS keychain.
   * Maps: D15 — nclaw_vault_contains(key) — OS keychain probe.
   * @param key — key identifier
   * @returns true if the key exists
   * @throws Error on keychain probe failure.
   */
  vaultContains(key: string): Promise<boolean>;
}

/**
 * NclawSyncModule — NitroModules HybridObject spec for server sync.
 *
 * Maps planned Rust symbols D16–D19 (nclaw_init_sync, nclaw_sync_*).
 * All operations are async — network I/O.
 * JSON serialization format matches nclaw/core event types.
 */
export interface NclawSyncModule {
  /**
   * Initialize the sync connection to the nSelf server.
   * Maps: D16 — nclaw_init_sync(server_url, jwt) — network + JWT auth handshake.
   * @param serverUrl — base URL of the nSelf sync server
   * @param jwt       — JWT authentication token
   * @throws Error on network failure or auth rejection.
   */
  initSync(serverUrl: string, jwt: string): Promise<void>;

  /**
   * Push local events to the server.
   * Maps: D17 — nclaw_sync_push(events_json) — network write.
   * @param eventsJson — JSON-serialized array of sync events
   * @throws Error on network failure or server rejection.
   */
  syncPush(eventsJson: string): Promise<void>;

  /**
   * Pull remote events from the server since a cursor.
   * Maps: D18 — nclaw_sync_pull(cursor) — network read.
   * @param cursor — opaque cursor string from the previous pull
   * @returns JSON array of Message structs since cursor
   * @throws Error on network failure.
   */
  syncPull(cursor: string): Promise<string>;

  /**
   * Acknowledge receipt of processed events by ID.
   * Maps: D19 — nclaw_sync_ack(event_ids_json) — network I/O.
   * @param eventIdsJson — JSON-serialized array of event ID strings
   * @throws Error on network failure.
   */
  syncAck(eventIdsJson: string): Promise<void>;
}

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
 * This is the main entry point for nclaw/mobile. It provides:
 *   - Convenience methods for chat + memory (the primary nclaw/mobile surface).
 *   - Sub-module accessors for crypto, dampers, core, db, llm, vault, sync.
 *
 * All methods comply with the thread-safety rules from RF-01:
 *   - Blocking FFI calls run on a dedicated serial background queue.
 *   - libnclaw_last_error() is captured on the same thread as the failing call.
 *   - Error message is propagated to JS as a rejected Promise.
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
