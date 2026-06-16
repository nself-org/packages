/**
 * @nself/native-bridge — NclawModule iOS header.
 *
 * Purpose: Declares the Objective-C++ bridge class NclawModule implementing
 *          the NitroModules HybridObject interface for libnclaw Rust FFI.
 *          Exposes every C-ABI symbol from FFI audit §5 Groups A–D to
 *          React Native via JSI on iOS.
 *
 * Inputs:  libnclaw.h (cbindgen-generated C header for nclaw/core).
 *          NitroModules framework (react-native-nitro-modules).
 *
 * Outputs: NclawModule class — registered as "NclawModule" NitroModule.
 *
 * Constraints:
 *   - ALL blocking FFI calls dispatched via _ffiQueue (serial background queue).
 *     NEVER call libnclaw_* on the main thread or JS thread directly.
 *   - libnclaw_last_error() MUST be called on _ffiQueue immediately after
 *     a failing FFI call (thread-local — RF-01 from FFI audit).
 *   - Every *mut c_char return: copy to NSString, then call libnclaw_free_string.
 *     NEVER pass raw char* across this boundary.
 *   - NativeDeviceKeypair / NativeSessionCipher: wrapped in NativeState.
 *     NativeState destructor calls libnclaw_keypair_free / libnclaw_cipher_free.
 *
 * Thread model:
 *   - _ffiQueue: serial dispatch_queue_t for all FFI calls.
 *   - JS calls arrive on JS thread → dispatched to _ffiQueue → resolved back.
 *   - Background queue also handles battery + thermal monitoring callbacks.
 *
 * Cross-ref: T-P3-E4-W1-S1-T02 (FFI audit)
 *            T-P3-E4-W2-S3-T03 (this ticket)
 *            ios/libs/nclaw.h (cbindgen-generated — from build.sh)
 */

#pragma once

#import <Foundation/Foundation.h>

// Forward declaration — concrete type imported in .mm
@class NativeDeviceKeypairState;
@class NativeSessionCipherState;

NS_ASSUME_NONNULL_BEGIN

/**
 * NclawModule — Objective-C++ NitroModules HybridObject.
 *
 * Implements the NclawModule TypeScript interface defined in
 * packages/native-bridge/src/NclawModule.nitro.ts.
 *
 * Registered in AppDelegate as a NitroModule under the name "NclawModule".
 * nclaw/mobile accesses it via NativeNclaw from @nself/native-bridge.
 */
@interface NclawModule : NSObject

/** Initialize with a dedicated serial FFI dispatch queue. */
- (instancetype)init;

// ---------------------------------------------------------------------------
// Group A — Crypto (lib.rs symbols 2–9)
// ---------------------------------------------------------------------------

/** libnclaw_version → NSString (static — no free). */
- (NSString *)getVersion;

/** libnclaw_keypair_generate → NativeDeviceKeypairState (NativeState). */
- (nullable NativeDeviceKeypairState *)keypairGenerate:(NSError **)error;

/** libnclaw_keypair_public_b64 → NSString (caller-owned — freed after copy). */
- (nullable NSString *)keypairPublicB64:(NativeDeviceKeypairState *)kp
                                  error:(NSError **)error;

/** libnclaw_keypair_dh → NativeSessionCipherState (NativeState). */
- (nullable NativeSessionCipherState *)keypairDh:(NativeDeviceKeypairState *)kp
                                     remotePubB64:(NSString *)remotePubB64
                                            error:(NSError **)error;

/** libnclaw_cipher_encrypt → NSString (caller-owned — freed after copy). */
- (nullable NSString *)cipherEncrypt:(NativeSessionCipherState *)cipher
                             plaintext:(NSString *)plaintext
                                 error:(NSError **)error;

/** libnclaw_cipher_decrypt → NSString (caller-owned — freed after copy). */
- (nullable NSString *)cipherDecrypt:(NativeSessionCipherState *)cipher
                                 wire:(NSString *)wire
                                error:(NSError **)error;

// ---------------------------------------------------------------------------
// Group B — Platform dampers (mobile_ffi.rs symbols 11–13)
// ---------------------------------------------------------------------------

/** nclaw_set_low_power(flag) — atomic store. */
- (void)setLowPower:(BOOL)flag;

/** nclaw_set_battery_pct(pct) — atomic store; pct clamped to [0, 100]. */
- (void)setBatteryPct:(uint8_t)pct;

/** nclaw_set_thermal_level(level) — atomic store; level clamped to [0, 3]. */
- (void)setThermalLevel:(uint8_t)level;

// ---------------------------------------------------------------------------
// Group C — frb-ported core (api.rs symbols 14–16)
// ---------------------------------------------------------------------------

/** nclaw_version (frb) → NSString. */
- (NSString *)nclawVersion;

/** probe_device (frb) → JSON NSString. */
- (NSString *)probeDevice;

/** classify_tier (frb) → JSON NSString. */
- (NSString *)classifyTierWithProbeJson:(NSString *)probeJson
                                 allowT4:(BOOL)allowT4;

// ---------------------------------------------------------------------------
// Primary chat + memory surface (convenience methods for nclaw/mobile)
// ---------------------------------------------------------------------------

/** chatSend — dispatches to background queue, resolves Promise. */
- (void)chatSend:(NSString *)message
         resolve:(void (^)(NSString *response))resolve
          reject:(void (^)(NSError *error))reject;

/** memorySearch — dispatches to background queue. */
- (void)memorySearch:(NSString *)query
               limit:(NSInteger)limit
             resolve:(void (^)(NSString *json))resolve
              reject:(void (^)(NSError *error))reject;

/** memoryInsert — dispatches to background queue. */
- (void)memoryInsert:(NSString *)messageJson
             resolve:(void (^)(void))resolve
              reject:(void (^)(NSError *error))reject;

/** memoryReplace — dispatches to background queue. */
- (void)memoryReplaceId:(NSString *)memId
            messageJson:(NSString *)messageJson
                resolve:(void (^)(void))resolve
                 reject:(void (^)(NSError *error))reject;

@end

NS_ASSUME_NONNULL_END
