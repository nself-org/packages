/**
 * @nself/native-bridge — Android JNI bridge to libnclaw Rust static library.
 *
 * Purpose: Implements JNI native methods declared in NclawModule.kt, bridging
 *          the Android/Kotlin layer to libnclaw C-ABI functions. All blocking
 *          FFI calls run here; results bubble up to Kotlin as primitive types
 *          or jstrings.
 *
 * Inputs:  libnclaw.h (cbindgen-generated C header)
 *          android/libs/arm64-v8a/libnclaw.so (built by scripts/build.sh)
 *
 * Thread model:
 *   - All JNI methods called from NclawModule.kt's Dispatchers.IO coroutine.
 *   - NEVER called from the main thread or JS thread.
 *   - libnclaw_last_error() captured on the JNI call thread (RF-01).
 *
 * Memory rules:
 *   - *const c_char returns (last_error, version): GetStringUTFChars + copy.
 *     DO NOT call ReleaseStringUTFChars on Rust pointers — they are static.
 *   - *mut c_char returns (keypair_public_b64, cipher_encrypt/decrypt):
 *     NewStringUTF to copy to jstring, then libnclaw_free_string immediately.
 *   - FfiDeviceKeypair*, FfiSessionCipher*: stored as jlong handles in Kotlin.
 *     Freed via destroyKeypair/destroyCipher JNI calls from Kotlin finalizer.
 *
 * Cross-ref: T-P3-E4-W1-S1-T02 (FFI audit §3 memory ownership)
 *            android/src/main/kotlin/com/nself/nativebridge/NclawModule.kt
 */

#include <jni.h>
#include <string>
#include <cstdint>

// cbindgen-generated C header for nclaw/core.
// Path at build time: packages/native-bridge/android/libs/nclaw.h
#include "../../../../libs/nclaw.h"

extern "C" {

// ---------------------------------------------------------------------------
// Helper: capture libnclaw_last_error as jstring (thread-local — RF-01)
// ---------------------------------------------------------------------------

static jstring captureLastError(JNIEnv *env, const char *fallback) {
    const char *raw = libnclaw_last_error();
    return env->NewStringUTF((raw != nullptr) ? raw : fallback);
}

// ---------------------------------------------------------------------------
// Group A — Crypto JNI (lib.rs symbols 2–9)
// ---------------------------------------------------------------------------

/**
 * Java_com_nself_nativebridge_NclawModule_nativeGetVersion
 * libnclaw_version → *const c_char (static — no free)
 */
JNIEXPORT jstring JNICALL
Java_com_nself_nativebridge_NclawModule_nativeGetVersion(JNIEnv *env, jobject /* this */) {
    const char *raw = libnclaw_version();
    return env->NewStringUTF((raw != nullptr) ? raw : "unknown");
}

/**
 * Java_com_nself_nativebridge_NclawModule_nativeKeypairGenerate
 * Returns FfiDeviceKeypair* as jlong handle; 0 = failure.
 * libnclaw_keypair_generate → *mut FfiDeviceKeypair
 */
JNIEXPORT jlong JNICALL
Java_com_nself_nativebridge_NclawModule_nativeKeypairGenerate(JNIEnv *env, jobject /* this */) {
    FfiDeviceKeypair *kp = libnclaw_keypair_generate();
    return (jlong)(intptr_t)kp;  // 0 (nullptr) = failure; Kotlin checks
}

/**
 * Java_com_nself_nativebridge_NclawModule_nativeKeypairFree
 * Frees a FfiDeviceKeypair handle. Called from Kotlin finalizer.
 */
JNIEXPORT void JNICALL
Java_com_nself_nativebridge_NclawModule_nativeKeypairFree(
        JNIEnv *env, jobject /* this */, jlong handle) {
    if (handle != 0) {
        libnclaw_keypair_free((FfiDeviceKeypair *)(intptr_t)handle);
    }
}

/**
 * Java_com_nself_nativebridge_NclawModule_nativeKeypairPublicB64
 * libnclaw_keypair_public_b64 → *mut c_char (caller-owned — free after copy)
 */
JNIEXPORT jstring JNICALL
Java_com_nself_nativebridge_NclawModule_nativeKeypairPublicB64(
        JNIEnv *env, jobject /* this */, jlong handle) {
    char *raw = libnclaw_keypair_public_b64((const FfiDeviceKeypair *)(intptr_t)handle);
    if (raw == nullptr) {
        return captureLastError(env, "keypairPublicB64 failed");
    }
    jstring result = env->NewStringUTF(raw);
    libnclaw_free_string(raw);  // Free caller-owned Rust allocation immediately.
    return result;
}

/**
 * Java_com_nself_nativebridge_NclawModule_nativeKeypairDh
 * libnclaw_keypair_dh → *mut FfiSessionCipher as jlong; 0 = failure.
 */
JNIEXPORT jlong JNICALL
Java_com_nself_nativebridge_NclawModule_nativeKeypairDh(
        JNIEnv *env, jobject /* this */,
        jlong kpHandle, jstring remotePubB64) {
    const char *remoteCStr = env->GetStringUTFChars(remotePubB64, nullptr);
    FfiSessionCipher *cipher = libnclaw_keypair_dh(
        (const FfiDeviceKeypair *)(intptr_t)kpHandle,
        remoteCStr
    );
    env->ReleaseStringUTFChars(remotePubB64, remoteCStr);
    return (jlong)(intptr_t)cipher;  // 0 = failure
}

/**
 * Java_com_nself_nativebridge_NclawModule_nativeCipherFree
 * Frees a FfiSessionCipher handle. Called from Kotlin finalizer.
 */
JNIEXPORT void JNICALL
Java_com_nself_nativebridge_NclawModule_nativeCipherFree(
        JNIEnv *env, jobject /* this */, jlong handle) {
    if (handle != 0) {
        libnclaw_cipher_free((FfiSessionCipher *)(intptr_t)handle);
    }
}

/**
 * Java_com_nself_nativebridge_NclawModule_nativeCipherEncrypt
 * libnclaw_cipher_encrypt → *mut c_char (caller-owned — free after copy)
 */
JNIEXPORT jstring JNICALL
Java_com_nself_nativebridge_NclawModule_nativeCipherEncrypt(
        JNIEnv *env, jobject /* this */,
        jlong cipherHandle, jstring plaintext) {
    const char *plainCStr = env->GetStringUTFChars(plaintext, nullptr);
    char *raw = libnclaw_cipher_encrypt(
        (const FfiSessionCipher *)(intptr_t)cipherHandle,
        plainCStr
    );
    env->ReleaseStringUTFChars(plaintext, plainCStr);
    if (raw == nullptr) {
        return captureLastError(env, "cipherEncrypt failed");
    }
    jstring result = env->NewStringUTF(raw);
    libnclaw_free_string(raw);
    return result;
}

/**
 * Java_com_nself_nativebridge_NclawModule_nativeCipherDecrypt
 * libnclaw_cipher_decrypt → *mut c_char (caller-owned — free after copy)
 */
JNIEXPORT jstring JNICALL
Java_com_nself_nativebridge_NclawModule_nativeCipherDecrypt(
        JNIEnv *env, jobject /* this */,
        jlong cipherHandle, jstring wire) {
    const char *wireCStr = env->GetStringUTFChars(wire, nullptr);
    char *raw = libnclaw_cipher_decrypt(
        (const FfiSessionCipher *)(intptr_t)cipherHandle,
        wireCStr
    );
    env->ReleaseStringUTFChars(wire, wireCStr);
    if (raw == nullptr) {
        return captureLastError(env, "cipherDecrypt failed — MAC mismatch or corrupt wire format");
    }
    jstring result = env->NewStringUTF(raw);
    libnclaw_free_string(raw);
    return result;
}

// ---------------------------------------------------------------------------
// Group B — Platform dampers (mobile_ffi.rs symbols 11–13)
// ---------------------------------------------------------------------------

JNIEXPORT void JNICALL
Java_com_nself_nativebridge_NclawModule_nativeSetLowPower(
        JNIEnv *env, jobject /* this */, jboolean flag) {
    nclaw_set_low_power((bool)flag);
}

JNIEXPORT void JNICALL
Java_com_nself_nativebridge_NclawModule_nativeSetBatteryPct(
        JNIEnv *env, jobject /* this */, jbyte pct) {
    // pct is Java byte (signed) — Kotlin passes value clamped to [0, 100].
    uint8_t clamped = (uint8_t)((pct < 0) ? 0 : (pct > 100) ? 100 : pct);
    nclaw_set_battery_pct(clamped);
}

JNIEXPORT void JNICALL
Java_com_nself_nativebridge_NclawModule_nativeSetThermalLevel(
        JNIEnv *env, jobject /* this */, jbyte level) {
    uint8_t clamped = (uint8_t)((level < 0) ? 0 : (level > 3) ? 3 : level);
    nclaw_set_thermal_level(clamped);
}

// ---------------------------------------------------------------------------
// Group C — frb-ported core (api.rs symbols 14–16)
// ---------------------------------------------------------------------------

JNIEXPORT jstring JNICALL
Java_com_nself_nativebridge_NclawModule_nativeNclawVersion(
        JNIEnv *env, jobject /* this */) {
    const char *raw = nclaw_version();
    return env->NewStringUTF((raw != nullptr) ? raw : "unknown");
}

JNIEXPORT jstring JNICALL
Java_com_nself_nativebridge_NclawModule_nativeProbeDevice(
        JNIEnv *env, jobject /* this */) {
    char *raw = probe_device();
    if (raw == nullptr) return env->NewStringUTF("{}");
    jstring result = env->NewStringUTF(raw);
    libnclaw_free_string(raw);
    return result;
}

JNIEXPORT jstring JNICALL
Java_com_nself_nativebridge_NclawModule_nativeClassifyTier(
        JNIEnv *env, jobject /* this */,
        jstring probeJson, jboolean allowT4) {
    const char *probeCStr = env->GetStringUTFChars(probeJson, nullptr);
    char *raw = classify_tier(probeCStr, (bool)allowT4);
    env->ReleaseStringUTFChars(probeJson, probeCStr);
    if (raw == nullptr) return env->NewStringUTF("{}");
    jstring result = env->NewStringUTF(raw);
    libnclaw_free_string(raw);
    return result;
}

// ---------------------------------------------------------------------------
// Primary chat + memory surface
// ---------------------------------------------------------------------------

JNIEXPORT jstring JNICALL
Java_com_nself_nativebridge_NclawModule_nativeChatSend(
        JNIEnv *env, jobject /* this */, jstring message) {
    const char *msgCStr = env->GetStringUTFChars(message, nullptr);
    char *raw = nclaw_chat_send(msgCStr);
    env->ReleaseStringUTFChars(message, msgCStr);
    if (raw == nullptr) {
        return captureLastError(env, "chatSend failed");
    }
    jstring result = env->NewStringUTF(raw);
    libnclaw_free_string(raw);
    return result;
}

JNIEXPORT jstring JNICALL
Java_com_nself_nativebridge_NclawModule_nativeMemorySearch(
        JNIEnv *env, jobject /* this */,
        jstring query, jint limit) {
    const char *queryCStr = env->GetStringUTFChars(query, nullptr);
    char *raw = nclaw_memory_search(queryCStr, (int32_t)limit);
    env->ReleaseStringUTFChars(query, queryCStr);
    if (raw == nullptr) {
        return captureLastError(env, "memorySearch failed");
    }
    jstring result = env->NewStringUTF(raw);
    libnclaw_free_string(raw);
    return result;
}

JNIEXPORT jboolean JNICALL
Java_com_nself_nativebridge_NclawModule_nativeMemoryInsert(
        JNIEnv *env, jobject /* this */, jstring messageJson) {
    const char *jsonCStr = env->GetStringUTFChars(messageJson, nullptr);
    bool ok = nclaw_memory_insert(jsonCStr);
    env->ReleaseStringUTFChars(messageJson, jsonCStr);
    return (jboolean)ok;
}

JNIEXPORT jboolean JNICALL
Java_com_nself_nativebridge_NclawModule_nativeMemoryReplace(
        JNIEnv *env, jobject /* this */,
        jstring id, jstring messageJson) {
    const char *idCStr = env->GetStringUTFChars(id, nullptr);
    const char *jsonCStr = env->GetStringUTFChars(messageJson, nullptr);
    bool ok = nclaw_memory_replace(idCStr, jsonCStr);
    env->ReleaseStringUTFChars(id, idCStr);
    env->ReleaseStringUTFChars(messageJson, jsonCStr);
    return (jboolean)ok;
}

// ---------------------------------------------------------------------------
// Last error retrieval (for Kotlin to surface as exception message)
// ---------------------------------------------------------------------------

JNIEXPORT jstring JNICALL
Java_com_nself_nativebridge_NclawModule_nativeLastError(
        JNIEnv *env, jobject /* this */) {
    const char *raw = libnclaw_last_error();
    return env->NewStringUTF((raw != nullptr) ? raw : "");
}

}  // extern "C"
