/**
 * NclawModule.interfaces.ts — opaque handles + Groups A/B/C HybridObject interface specs.
 *
 * Purpose: Define typed TypeScript interfaces for the synchronous FFI groups of
 *          the libnclaw Rust→RN JSI seam (react-native-nitro-modules). Groups A–C
 *          are synchronous (sub-microsecond, CPU-bound); opaque NativeState handles
 *          let JS GC trigger libnclaw_keypair_free / libnclaw_cipher_free.
 *
 * Inputs:  None — pure type declarations.
 * Outputs: NativeDeviceKeypair, NativeSessionCipher (opaque handles);
 *          NclawCryptoModule (Group A), NclawDampersModule (Group B),
 *          NclawCoreModule (Group C).
 *
 * Constraints:
 *   - Groups A–C are synchronous (sub-microsecond CPU-bound); never return Promise.
 *   - libnclaw_last_error, libnclaw_free_string are INTERNAL to native; not exposed.
 *   - libnclaw_keypair_free, libnclaw_cipher_free handled by NativeState destructors.
 *   - NativeDeviceKeypair and NativeSessionCipher are opaque branded types.
 *
 * SPORT: F08-SERVICE-INVENTORY.md — libnclaw JSI bridge in native-bridge package
 * Cross-ref: T-P3-E4-W1-S1-T02 (FFI symbol audit — §5 Groups A–C)
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
