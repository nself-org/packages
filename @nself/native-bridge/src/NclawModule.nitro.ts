/**
 * @nself/native-bridge — NclawModule NitroModules HybridObject spec.
 *
 * Purpose: Typed TypeScript interface for the libnclaw Rust→RN JSI seam via
 *          react-native-nitro-modules. Exposes every C-ABI symbol from the FFI
 *          audit (T-P3-E4-W1-S1-T02 §5 JSI Target Signatures) as typed JSI calls.
 *          Replaces nclaw/mobile's dart:ffi bindings.
 *
 * Inputs:  All method parameters are typed per the FFI audit §5 Groups A–D.
 *          Opaque handles (NativeDeviceKeypair, NativeSessionCipher) are
 *          NativeState objects whose destructors call the corresponding
 *          libnclaw_*_free functions — JS GC triggers Rust deallocation.
 *
 * Outputs: All async methods return Promise<T>. Sync methods (crypto ops that
 *          are sub-microsecond, atomic flag setters) are typed as synchronous
 *          T (not Promise<T>). All Rust errors propagate as JS Error objects.
 *
 * Constraints:
 *   - libnclaw_free_string and libnclaw_last_error are INTERNAL to native code;
 *     they are NOT exposed in this TypeScript interface. Native implementations
 *     handle memory bookkeeping before crossing the JSI boundary.
 *   - libnclaw_keypair_free and libnclaw_cipher_free are handled by NativeState
 *     destructors in iOS/Android implementations; not exposed directly.
 *   - Every *mut c_char return in native code must have nclaw_free_string()
 *     called immediately after copying to NSString / jstring.
 *   - All blocking FFI calls run on a dedicated background queue (iOS
 *     DispatchQueue / Android HandlerThread) — never on the JS thread.
 *   - libnclaw_last_error() is thread-local: native code MUST call it on the
 *     same thread as the failing FFI call before returning to JS.
 *
 * SPORT: F08-SERVICE-INVENTORY.md — libnclaw JSI bridge in native-bridge package
 * Cross-ref: T-P3-E4-W1-S1-T02 (FFI symbol audit — §5 is the authoritative spec)
 *            T-P3-E4-W2-S3-T03 (this implementation ticket)
 *            nclaw/core/src/lib.rs (symbols 1–10)
 *            nclaw/core/src/mobile_ffi.rs (symbols 11–13)
 *            nclaw/core/src/api.rs (symbols 14–16, frb-generated)
 */

// =============================================================================
// NativeState opaque handles
//
// NativeDeviceKeypair and NativeSessionCipher are opaque handles wrapping
// Rust-allocated structs (FfiDeviceKeypair*, FfiSessionCipher*). The native
// implementation (iOS NclawModule.mm / Android NclawModule.kt) wraps each
// in a NativeState whose destructor calls the corresponding libnclaw_*_free.
//
// TypeScript sees them as branded opaque types — callers cannot construct
// them directly; they are returned by keypairGenerate() / keypairDh().
// =============================================================================

/**
 * NativeDeviceKeypair — opaque handle for a Rust FfiDeviceKeypair.
 *
 * Returned by keypairGenerate(). Freed automatically when the JS object is
 * garbage-collected (via NativeState destructor → libnclaw_keypair_free).
 * Do NOT hold long-lived references; call keypairFree() when done.
 */
export interface NativeDeviceKeypair {
  /** Opaque brand — prevents accidental construction of plain objects. */
  readonly __brand: 'NativeDeviceKeypair';
}

/**
 * NativeSessionCipher — opaque handle for a Rust FfiSessionCipher.
 *
 * Returned by keypairDh(). Freed automatically when the JS object is
 * garbage-collected (via NativeState destructor → libnclaw_cipher_free).
 * Do NOT hold long-lived references; call cipherFree() when done.
 */
export interface NativeSessionCipher {
  /** Opaque brand — prevents accidental construction of plain objects. */
  readonly __brand: 'NativeSessionCipher';
}

// =============================================================================
// Group A — NclawCryptoModule HybridObject spec
//
// Maps FFI audit §5 Group A: crypto + handshake symbols (lib.rs symbols 2–9).
// All crypto ops are sub-microsecond CPU-bound; they run synchronously on a
// background dispatch queue and return synchronous T (not Promise<T>).
//
// libnclaw_last_error (symbol 1) and libnclaw_free_string (symbol 3) are
// INTERNAL to native implementations; not exposed here.
// libnclaw_keypair_free (symbol 6) and libnclaw_cipher_free (symbol 10) are
// handled by NativeState destructors; not exposed as callable methods.
// =============================================================================

/**
 * NclawCryptoModule — NitroModules HybridObject spec for crypto/handshake FFI.
 *
 * Implemented by native code (NclawCryptoModule.mm / NclawCryptoModule.kt).
 * All methods are synchronous: X25519 keygen/DH and XChaCha20-Poly1305
 * encrypt/decrypt are sub-microsecond — blocking the JS thread is acceptable.
 * Error convention: returns null on failure; callers must check null and throw.
 * Native code captures libnclaw_last_error() on the call thread.
 */
export interface NclawCryptoModule {
  /**
   * Get the libnclaw version string.
   * Maps: libnclaw_version() → *const c_char (static lifetime — DO NOT free).
   * @returns version string, e.g. "0.1.0"
   */
  getVersion(): string;

  /**
   * Generate a new X25519 device keypair.
   * Maps: libnclaw_keypair_generate() → *mut FfiDeviceKeypair.
   * @returns NativeDeviceKeypair handle; NativeState destructor calls libnclaw_keypair_free.
   * @throws Error with Rust error message if keypair generation fails.
   */
  keypairGenerate(): NativeDeviceKeypair;

  /**
   * Get the base64-encoded public key for a keypair.
   * Maps: libnclaw_keypair_public_b64(kp) → *mut c_char (caller owns — nclaw_free_string).
   * Native code copies string to JS and calls libnclaw_free_string immediately.
   * @param kp — device keypair handle from keypairGenerate()
   * @returns base64-encoded public key string
   * @throws Error with Rust error message on failure.
   */
  keypairPublicB64(kp: NativeDeviceKeypair): string;

  /**
   * Perform X25519 Diffie-Hellman key exchange to produce a session cipher.
   * Maps: libnclaw_keypair_dh(kp, remote_pub_b64) → *mut FfiSessionCipher.
   * @param kp           — local device keypair handle
   * @param remotePubB64 — base64-encoded remote public key (must be valid UTF-8 + base64)
   * @returns NativeSessionCipher handle; NativeState destructor calls libnclaw_cipher_free.
   * @throws Error with Rust error message if DH fails or remotePubB64 is malformed.
   */
  keypairDh(kp: NativeDeviceKeypair, remotePubB64: string): NativeSessionCipher;

  /**
   * Encrypt plaintext using XChaCha20-Poly1305.
   * Maps: libnclaw_cipher_encrypt(cipher, plaintext) → *mut c_char.
   * Native code copies result to JS and calls libnclaw_free_string immediately.
   * @param cipher    — session cipher handle from keypairDh()
   * @param plaintext — string to encrypt
   * @returns encrypted wire-format string (base64 + nonce)
   * @throws Error with Rust error message on encryption failure.
   */
  cipherEncrypt(cipher: NativeSessionCipher, plaintext: string): string;

  /**
   * Decrypt a wire-format string using XChaCha20-Poly1305.
   * Maps: libnclaw_cipher_decrypt(cipher, wire) → *mut c_char.
   * Native code copies result to JS and calls libnclaw_free_string immediately.
   * @param cipher — session cipher handle from keypairDh()
   * @param wire   — encrypted wire-format string
   * @returns decrypted plaintext string
   * @throws Error with Rust error message on decryption failure (MAC mismatch, etc.).
   */
  cipherDecrypt(cipher: NativeSessionCipher, wire: string): string;
}

// =============================================================================
// Group B — NclawDampersModule HybridObject spec
//
// Maps FFI audit §5 Group B: platform damper symbols (mobile_ffi.rs symbols 11–13).
// All are atomic flag stores — sub-microsecond; synchronous T return is correct.
// =============================================================================

/**
 * NclawDampersModule — NitroModules HybridObject spec for platform dampers.
 *
 * iOS: setLowPower wires UIDevice.isLowPowerModeEnabled notification + FFI call.
 *      setBatteryPct wires UIDevice.batteryLevel (requires isBatteryMonitoringEnabled=true).
 *      setThermalLevel wires ProcessInfo.thermalState (planned, iOS 11+).
 * Android: All three wire BatteryManager + PowerManager APIs + JNI call.
 */
export interface NclawDampersModule {
  /**
   * Notify Rust core of low-power mode change.
   * Maps: nclaw_set_low_power(flag: bool) — atomic store, no return.
   * @param flag — true when device is in low-power mode
   */
  setLowPower(flag: boolean): void;

  /**
   * Update Rust core with current battery percentage.
   * Maps: nclaw_set_battery_pct(pct: u8) — atomic store, no return.
   * JS number is clamped to [0, 100] before crossing FFI boundary.
   * @param pct — battery level 0–100
   */
  setBatteryPct(pct: number): void;

  /**
   * Update Rust core with current thermal throttle level.
   * Maps: nclaw_set_thermal_level(level: u8) — atomic store, no return.
   * JS number is clamped to [0, 3] before crossing FFI boundary.
   * Level semantics: 0=nominal, 1=fair, 2=serious, 3=critical.
   * @param level — thermal level 0–3
   */
  setThermalLevel(level: number): void;
}

// =============================================================================
// Group C — NclawCoreModule HybridObject spec
//
// Maps FFI audit §5 Group C: flutter_rust_bridge (frb) symbols (api.rs symbols 14–16).
// frb generates Dart FFI bindings automatically; JSI port must implement manually.
// All are sync (#[frb(sync)]) pure-computation functions.
// =============================================================================

/**
 * NclawCoreModule — NitroModules HybridObject spec for frb-ported core functions.
 *
 * These are manually ported from flutter_rust_bridge api.rs since frb generates
 * only Dart bindings. Sync because all are CPU-bound with no I/O.
 */
export interface NclawCoreModule {
  /**
   * Get the nclaw version string (frb port of nclaw_version → String).
   * Maps: frb symbol 14 — pub fn nclaw_version() → String.
   * @returns version string
   */
  nclawVersion(): string;

  /**
   * Probe device capabilities and return JSON-encoded DeviceProbe.
   * Maps: frb symbol 15 — pub fn probe_device() → String.
   * @returns JSON string of DeviceProbe struct
   */
  probeDevice(): string;

  /**
   * Classify device performance tier based on probe result.
   * Maps: frb symbol 16 — pub fn classify_tier(probe_json: String, allow_t4: bool) → String.
   * @param probeJson — JSON string from probeDevice()
   * @param allowT4   — whether to allow Tier-4 (lowest) classification
   * @returns JSON string of tier classification result
   */
  classifyTier(probeJson: string, allowT4: boolean): string;
}

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

// =============================================================================
// NclawModuleStub — NOT_IMPLEMENTED placeholder
//
// Returned by getNativeNclaw() until the nclaw/mobile native module
// registers the real react-native-nitro-modules implementation.
// Every method throws a descriptive error so callers detect missing native
// module at runtime rather than getting silent no-ops.
// =============================================================================

/**
 * NclawModuleNotImplementedError — thrown by NclawModuleStub for every method.
 */
export class NclawModuleNotImplementedError extends Error {
  readonly code = 'nclaw_native_not_implemented' as const;

  constructor(method: string) {
    super(
      `NativeNclaw.${method}() is not implemented. ` +
        'The libnclaw JSI native module (react-native-nitro-modules) has not been registered. ' +
        'Ensure nclaw/mobile has completed the native module bootstrap (T-P3-E4-W2-S3-T04).',
    );
    this.name = 'NclawModuleNotImplementedError';
  }
}

/** Stub implementation of NclawCryptoModule — throws on all calls. */
class NclawCryptoModuleStub implements NclawCryptoModule {
  getVersion(): string {
    throw new NclawModuleNotImplementedError('crypto.getVersion');
  }
  keypairGenerate(): NativeDeviceKeypair {
    throw new NclawModuleNotImplementedError('crypto.keypairGenerate');
  }
  keypairPublicB64(_kp: NativeDeviceKeypair): string {
    throw new NclawModuleNotImplementedError('crypto.keypairPublicB64');
  }
  keypairDh(
    _kp: NativeDeviceKeypair,
    _remotePubB64: string,
  ): NativeSessionCipher {
    throw new NclawModuleNotImplementedError('crypto.keypairDh');
  }
  cipherEncrypt(
    _cipher: NativeSessionCipher,
    _plaintext: string,
  ): string {
    throw new NclawModuleNotImplementedError('crypto.cipherEncrypt');
  }
  cipherDecrypt(_cipher: NativeSessionCipher, _wire: string): string {
    throw new NclawModuleNotImplementedError('crypto.cipherDecrypt');
  }
}

/** Stub implementation of NclawDampersModule — all are safe no-ops. */
class NclawDampersModuleStub implements NclawDampersModule {
  setLowPower(_flag: boolean): void {
    // Intentional no-op stub — damper setters are fire-and-forget.
  }
  setBatteryPct(_pct: number): void {
    // Intentional no-op stub.
  }
  setThermalLevel(_level: number): void {
    // Intentional no-op stub.
  }
}

/** Stub implementation of NclawCoreModule — throws on all calls. */
class NclawCoreModuleStub implements NclawCoreModule {
  nclawVersion(): string {
    throw new NclawModuleNotImplementedError('core.nclawVersion');
  }
  probeDevice(): string {
    throw new NclawModuleNotImplementedError('core.probeDevice');
  }
  classifyTier(_probeJson: string, _allowT4: boolean): string {
    throw new NclawModuleNotImplementedError('core.classifyTier');
  }
}

/** Stub implementation of NclawDbModule — throws on all calls. */
class NclawDbModuleStub implements NclawDbModule {
  async initDb(_dbPath: string): Promise<void> {
    throw new NclawModuleNotImplementedError('db.initDb');
  }
  async dbInsertMessage(_messageJson: string): Promise<void> {
    throw new NclawModuleNotImplementedError('db.dbInsertMessage');
  }
  async dbQueryByTopic(_topic: string): Promise<string> {
    throw new NclawModuleNotImplementedError('db.dbQueryByTopic');
  }
  async dbVectorSearch(
    _embedding: Float32Array,
    _limit: number,
  ): Promise<string> {
    throw new NclawModuleNotImplementedError('db.dbVectorSearch');
  }
  async dbClear(): Promise<void> {
    throw new NclawModuleNotImplementedError('db.dbClear');
  }
}

/** Stub implementation of NclawLlmModule — throws on all calls. */
class NclawLlmModuleStub implements NclawLlmModule {
  onToken: ((token: string) => void) | null = null;
  onDone: (() => void) | null = null;

  async initLlm(_modelPath: string, _configJson: string): Promise<void> {
    throw new NclawModuleNotImplementedError('llm.initLlm');
  }
  llmInferStream(_prompt: string, _maxTokens: number): void {
    throw new NclawModuleNotImplementedError('llm.llmInferStream');
  }
  async llmEmbed(_text: string): Promise<Float32Array> {
    throw new NclawModuleNotImplementedError('llm.llmEmbed');
  }
  llmIsReady(): boolean {
    return false; // Safe: false is the correct state when no native module is loaded.
  }
  llmUnload(): void {
    // Intentional no-op stub.
  }
}

/** Stub implementation of NclawVaultModule — throws on all calls. */
class NclawVaultModuleStub implements NclawVaultModule {
  async initVault(_namespace: string): Promise<void> {
    throw new NclawModuleNotImplementedError('vault.initVault');
  }
  async vaultSet(_key: string, _secret: string): Promise<void> {
    throw new NclawModuleNotImplementedError('vault.vaultSet');
  }
  async vaultGet(_key: string): Promise<string | null> {
    throw new NclawModuleNotImplementedError('vault.vaultGet');
  }
  async vaultDelete(_key: string): Promise<void> {
    throw new NclawModuleNotImplementedError('vault.vaultDelete');
  }
  async vaultContains(_key: string): Promise<boolean> {
    throw new NclawModuleNotImplementedError('vault.vaultContains');
  }
}

/** Stub implementation of NclawSyncModule — throws on all calls. */
class NclawSyncModuleStub implements NclawSyncModule {
  async initSync(_serverUrl: string, _jwt: string): Promise<void> {
    throw new NclawModuleNotImplementedError('sync.initSync');
  }
  async syncPush(_eventsJson: string): Promise<void> {
    throw new NclawModuleNotImplementedError('sync.syncPush');
  }
  async syncPull(_cursor: string): Promise<string> {
    throw new NclawModuleNotImplementedError('sync.syncPull');
  }
  async syncAck(_eventIdsJson: string): Promise<void> {
    throw new NclawModuleNotImplementedError('sync.syncAck');
  }
}

/**
 * NclawModuleStub — full NclawModule NOT_IMPLEMENTED placeholder.
 *
 * Returned by getNativeNclaw() until registerNativeNclaw() is called.
 * chatSend() and all primary methods throw NclawModuleNotImplementedError.
 */
export class NclawModuleStub implements NclawModule {
  readonly crypto: NclawCryptoModule = new NclawCryptoModuleStub();
  readonly dampers: NclawDampersModule = new NclawDampersModuleStub();
  readonly core: NclawCoreModule = new NclawCoreModuleStub();
  readonly db: NclawDbModule = new NclawDbModuleStub();
  readonly llm: NclawLlmModule = new NclawLlmModuleStub();
  readonly vault: NclawVaultModule = new NclawVaultModuleStub();
  readonly sync: NclawSyncModule = new NclawSyncModuleStub();

  async chatSend(_message: string): Promise<string> {
    throw new NclawModuleNotImplementedError('chatSend');
  }
  async memorySearch(_query: string, _limit: number): Promise<string> {
    throw new NclawModuleNotImplementedError('memorySearch');
  }
  async memoryInsert(_messageJson: string): Promise<void> {
    throw new NclawModuleNotImplementedError('memoryInsert');
  }
  async memoryReplace(_id: string, _messageJson: string): Promise<void> {
    throw new NclawModuleNotImplementedError('memoryReplace');
  }
}

// =============================================================================
// Registry — runtime registration/retrieval of the real native implementation
// =============================================================================

/** Module-level registry holding the active NativeNclaw implementation. */
let _nativeNclaw: NclawModule = new NclawModuleStub();

/**
 * Register the real NativeNclaw implementation.
 *
 * Called once by nclaw/mobile's native module bootstrap (T-P3-E4-W2-S3-T04).
 * After registration, getNativeNclaw() returns the real native implementation.
 * @param impl — native module instance implementing NclawModule
 */
export function registerNativeNclaw(impl: NclawModule): void {
  _nativeNclaw = impl;
}

/**
 * Retrieve the active NativeNclaw implementation.
 *
 * Returns the stub (NclawModuleStub) until registerNativeNclaw() is called.
 * Returns the real native implementation after nclaw/mobile bootstrap.
 *
 * Pattern: always call getNativeNclaw().chatSend(...) rather than holding a
 * reference, so hot-swapping works correctly in tests.
 */
export function getNativeNclaw(): NclawModule {
  return _nativeNclaw;
}

/**
 * NativeNclaw — convenience re-export of getNativeNclaw().
 *
 * nclaw/mobile imports this as:
 *   import { NativeNclaw } from '@nself/native-bridge';
 *   await NativeNclaw.chatSend('hello');
 *
 * This is a getter-backed proxy so hot-swapping via registerNativeNclaw()
 * is reflected immediately without re-importing.
 */
export const NativeNclaw: NclawModule = new Proxy({} as NclawModule, {
  get(_target, prop: string | symbol): unknown {
    const impl = getNativeNclaw();
    // Cast through unknown to access dynamic property — NclawModule interface
    // does not have an index signature (intentional strict typing), but the
    // proxy must route all property accesses to the live implementation.
    return (impl as unknown as Record<string | symbol, unknown>)[prop];
  },
});
