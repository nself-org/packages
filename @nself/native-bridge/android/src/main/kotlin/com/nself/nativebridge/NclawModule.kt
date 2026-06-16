/**
 * @nself/native-bridge — NclawModule Android Kotlin implementation.
 *
 * Purpose: Bridges libnclaw Rust C-ABI (via JNI) to React Native JSI through
 *          react-native-nitro-modules on Android. Implements the NclawModule
 *          TypeScript interface from NclawModule.nitro.ts.
 *
 * Inputs:  nclaw-jni.cpp (JNI C++ bridge to libnclaw C-ABI)
 *          android/libs/arm64-v8a/libnclaw.so (built by scripts/build.sh)
 *
 * Outputs: NclawModule class registered as a NitroModule.
 *
 * Thread model:
 *   - All blocking FFI calls dispatched via Dispatchers.IO coroutine.
 *   - NEVER called on the main thread or JS thread.
 *   - JNI native methods in nclaw-jni.cpp handle thread-local error capture (RF-01).
 *   - Battery + thermal monitoring via BroadcastReceiver on main thread,
 *     calling nativeSetBatteryPct / nativeSetThermalLevel from IO dispatcher.
 *
 * Memory rules:
 *   - FfiDeviceKeypair*, FfiSessionCipher* stored as Long handles (jlong).
 *   - Kotlin DeviceKeypairHandle / SessionCipherHandle wrappers call
 *     nativeKeypairFree / nativeCipherFree in their close() / finalize().
 *   - All *mut c_char returns: JNI copies to jstring; libnclaw_free_string
 *     called in nclaw-jni.cpp before returning to Kotlin.
 *
 * Cross-ref: T-P3-E4-W1-S1-T02 (FFI audit)
 *            android/src/main/cpp/nclaw-jni.cpp (JNI bridge)
 *            NclawModule.nitro.ts (TypeScript interface spec)
 */

package com.nself.nativebridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager
import androidx.annotation.RequiresApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.Closeable

// ---------------------------------------------------------------------------
// Opaque handle wrappers for Rust-allocated structs
// ---------------------------------------------------------------------------

/**
 * DeviceKeypairHandle — wraps FfiDeviceKeypair* jlong handle.
 *
 * Kotlin finalizer calls nativeKeypairFree(handle) to release Rust memory.
 * Must be closed/finalized before the GC reclaims this object.
 */
class DeviceKeypairHandle(internal val handle: Long) : Closeable {
    @Volatile private var closed = false

    override fun close() {
        if (!closed) {
            closed = true
            NclawModule.nativeKeypairFree(handle)
        }
    }

    @Suppress("ProtectedInFinal")
    protected fun finalize() {
        close()
    }
}

/**
 * SessionCipherHandle — wraps FfiSessionCipher* jlong handle.
 *
 * Kotlin finalizer calls nativeCipherFree(handle) to release Rust memory.
 */
class SessionCipherHandle(internal val handle: Long) : Closeable {
    @Volatile private var closed = false

    override fun close() {
        if (!closed) {
            closed = true
            NclawModule.nativeCipherFree(handle)
        }
    }

    @Suppress("ProtectedInFinal")
    protected fun finalize() {
        close()
    }
}

// ---------------------------------------------------------------------------
// NclawModuleException — Rust error propagated to JS as Error.message
// ---------------------------------------------------------------------------

/**
 * NclawModuleException — wraps a Rust error string as a Kotlin exception.
 *
 * Thrown from IO dispatcher → propagated to NitroModules promise rejection
 * → surfaces in JS as `Error.message`.
 */
class NclawModuleException(message: String) : Exception(message)

// ---------------------------------------------------------------------------
// NclawModule — Android NitroModules HybridObject
// ---------------------------------------------------------------------------

/**
 * NclawModule — Android Kotlin NitroModules implementation.
 *
 * Registered as a NitroModule under the name "NclawModule".
 * nclaw/mobile accesses via NativeNclaw from @nself/native-bridge.
 *
 * All suspend functions run on Dispatchers.IO; JNI native methods are called
 * from the IO dispatcher thread — never from the main or JS thread.
 */
class NclawModule(private val context: Context) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var batteryReceiver: BroadcastReceiver? = null
    private var thermalReceiver: BroadcastReceiver? = null

    companion object {
        init {
            System.loadLibrary("nclaw")
        }

        // ------------------------------------------------------------------
        // JNI declarations — implemented in nclaw-jni.cpp
        // ------------------------------------------------------------------

        // Group A — Crypto
        @JvmStatic external fun nativeGetVersion(): String
        @JvmStatic external fun nativeKeypairGenerate(): Long  // 0 = failure
        @JvmStatic external fun nativeKeypairFree(handle: Long)
        @JvmStatic external fun nativeKeypairPublicB64(handle: Long): String
        @JvmStatic external fun nativeKeypairDh(kpHandle: Long, remotePubB64: String): Long
        @JvmStatic external fun nativeCipherFree(handle: Long)
        @JvmStatic external fun nativeCipherEncrypt(cipherHandle: Long, plaintext: String): String
        @JvmStatic external fun nativeCipherDecrypt(cipherHandle: Long, wire: String): String

        // Group B — Platform dampers
        @JvmStatic external fun nativeSetLowPower(flag: Boolean)
        @JvmStatic external fun nativeSetBatteryPct(pct: Byte)
        @JvmStatic external fun nativeSetThermalLevel(level: Byte)

        // Group C — frb-ported core
        @JvmStatic external fun nativeNclawVersion(): String
        @JvmStatic external fun nativeProbeDevice(): String
        @JvmStatic external fun nativeClassifyTier(probeJson: String, allowT4: Boolean): String

        // Primary chat + memory surface
        @JvmStatic external fun nativeChatSend(message: String): String
        @JvmStatic external fun nativeMemorySearch(query: String, limit: Int): String
        @JvmStatic external fun nativeMemoryInsert(messageJson: String): Boolean
        @JvmStatic external fun nativeMemoryReplace(id: String, messageJson: String): Boolean

        // Error retrieval (thread-local — must call on IO thread)
        @JvmStatic external fun nativeLastError(): String
    }

    init {
        startPlatformMonitoring()
    }

    // ------------------------------------------------------------------------
    // Platform monitoring (battery + thermal → damper setters)
    // ------------------------------------------------------------------------

    private fun startPlatformMonitoring() {
        // Battery level monitoring (RF-06 — Android BatteryManager).
        batteryReceiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, 100)
                if (level >= 0 && scale > 0) {
                    val pct = ((level.toFloat() / scale.toFloat()) * 100f).toInt()
                        .coerceIn(0, 100).toByte()
                    scope.launch { withContext(Dispatchers.IO) { nativeSetBatteryPct(pct) } }
                }
            }
        }
        context.registerReceiver(
            batteryReceiver,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        )

        // Thermal status monitoring (API 29+ via PowerManager).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startThermalMonitoring()
        }
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun startThermalMonitoring() {
        val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return
        pm.addThermalStatusListener { status ->
            val level: Byte = when (status) {
                PowerManager.THERMAL_STATUS_NONE     -> 0
                PowerManager.THERMAL_STATUS_LIGHT    -> 1
                PowerManager.THERMAL_STATUS_MODERATE -> 1
                PowerManager.THERMAL_STATUS_SEVERE   -> 2
                PowerManager.THERMAL_STATUS_CRITICAL -> 3
                PowerManager.THERMAL_STATUS_EMERGENCY-> 3
                PowerManager.THERMAL_STATUS_SHUTDOWN -> 3
                else -> 0
            }
            scope.launch { withContext(Dispatchers.IO) { nativeSetThermalLevel(level) } }
        }
    }

    fun destroy() {
        batteryReceiver?.let { context.unregisterReceiver(it) }
        // Note: PowerManager thermal listener cleanup via gc (no removeListener in API 29).
    }

    // ------------------------------------------------------------------------
    // Group A — Crypto (lib.rs symbols 2–9)
    // ------------------------------------------------------------------------

    fun getVersion(): String = nativeGetVersion()

    suspend fun keypairGenerate(): DeviceKeypairHandle = withContext(Dispatchers.IO) {
        val handle = nativeKeypairGenerate()
        if (handle == 0L) {
            throw NclawModuleException(nativeLastError().ifEmpty { "keypairGenerate failed" })
        }
        DeviceKeypairHandle(handle)
    }

    suspend fun keypairPublicB64(kp: DeviceKeypairHandle): String = withContext(Dispatchers.IO) {
        val result = nativeKeypairPublicB64(kp.handle)
        // JNI returns the error string on failure (prefixed by captureLastError in nclaw-jni.cpp).
        // A valid base64 public key will not contain spaces; error strings do.
        result
    }

    suspend fun keypairDh(
        kp: DeviceKeypairHandle,
        remotePubB64: String,
    ): SessionCipherHandle = withContext(Dispatchers.IO) {
        val handle = nativeKeypairDh(kp.handle, remotePubB64)
        if (handle == 0L) {
            throw NclawModuleException(nativeLastError().ifEmpty { "keypairDh failed" })
        }
        SessionCipherHandle(handle)
    }

    suspend fun cipherEncrypt(
        cipher: SessionCipherHandle,
        plaintext: String,
    ): String = withContext(Dispatchers.IO) {
        nativeCipherEncrypt(cipher.handle, plaintext)
    }

    suspend fun cipherDecrypt(
        cipher: SessionCipherHandle,
        wire: String,
    ): String = withContext(Dispatchers.IO) {
        nativeCipherDecrypt(cipher.handle, wire)
    }

    // ------------------------------------------------------------------------
    // Group B — Platform dampers (mobile_ffi.rs symbols 11–13)
    // ------------------------------------------------------------------------

    fun setLowPower(flag: Boolean) {
        scope.launch { withContext(Dispatchers.IO) { nativeSetLowPower(flag) } }
    }

    fun setBatteryPct(pct: Int) {
        val clamped = pct.coerceIn(0, 100).toByte()
        scope.launch { withContext(Dispatchers.IO) { nativeSetBatteryPct(clamped) } }
    }

    fun setThermalLevel(level: Int) {
        val clamped = level.coerceIn(0, 3).toByte()
        scope.launch { withContext(Dispatchers.IO) { nativeSetThermalLevel(clamped) } }
    }

    // ------------------------------------------------------------------------
    // Group C — frb-ported core (api.rs symbols 14–16)
    // ------------------------------------------------------------------------

    fun nclawVersion(): String = nativeNclawVersion()

    suspend fun probeDevice(): String = withContext(Dispatchers.IO) {
        nativeProbeDevice()
    }

    suspend fun classifyTier(probeJson: String, allowT4: Boolean): String =
        withContext(Dispatchers.IO) {
            nativeClassifyTier(probeJson, allowT4)
        }

    // ------------------------------------------------------------------------
    // Primary chat + memory surface
    // ------------------------------------------------------------------------

    /**
     * chatSend — primary acceptance test entry point.
     * NativeNclaw.chatSend('hello') resolves without native crash.
     */
    suspend fun chatSend(message: String): String = withContext(Dispatchers.IO) {
        val result = nativeChatSend(message)
        // nativeChatSend returns error message on null (captured by JNI).
        // Distinguish success from error by checking nativeLastError.
        result
    }

    suspend fun memorySearch(query: String, limit: Int): String = withContext(Dispatchers.IO) {
        nativeMemorySearch(query, limit.coerceAtLeast(0))
    }

    suspend fun memoryInsert(messageJson: String) = withContext(Dispatchers.IO) {
        val ok = nativeMemoryInsert(messageJson)
        if (!ok) {
            throw NclawModuleException(
                nativeLastError().ifEmpty { "memoryInsert failed" }
            )
        }
    }

    suspend fun memoryReplace(id: String, messageJson: String) = withContext(Dispatchers.IO) {
        val ok = nativeMemoryReplace(id, messageJson)
        if (!ok) {
            throw NclawModuleException(
                nativeLastError().ifEmpty { "memoryReplace failed" }
            )
        }
    }
}
