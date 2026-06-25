/**
 * NclawModule.stub.ts — NOT_IMPLEMENTED stubs + runtime registry for NclawModule.
 *
 * Purpose: Provide stub implementations of all NclawModule sub-interfaces so that
 *          nclaw/mobile can safely import and call NativeNclaw before the real
 *          react-native-nitro-modules registration completes. All stub methods throw
 *          NclawModuleNotImplementedError with a descriptive message.
 *
 * Inputs:  NclawModule and all sub-interface types from NclawModule.nitro.ts.
 * Outputs: NclawModuleNotImplementedError, NclawModuleStub (exported),
 *          registerNativeNclaw(), getNativeNclaw(), NativeNclaw proxy.
 *
 * Constraints:
 *   - NclawDampersModule stubs are safe no-ops (damper setters are fire-and-forget).
 *   - NclawLlmModule.llmIsReady() returns false (safe: no native module loaded).
 *   - Do NOT add I/O or side effects to any stub.
 *   - Index re-exports this module via NclawModule.nitro.js (co-import path).
 *
 * SPORT: F08-SERVICE-INVENTORY.md — libnclaw JSI bridge in native-bridge package
 * Cross-ref: NclawModule.nitro.ts (interface specs)
 *            T-P3-E4-W2-S3-T04 (nclaw/mobile native module bootstrap)
 */

import type {
  NativeDeviceKeypair,
  NativeSessionCipher,
  NclawCryptoModule,
  NclawDampersModule,
  NclawCoreModule,
  NclawDbModule,
  NclawLlmModule,
  NclawVaultModule,
  NclawSyncModule,
  NclawModule,
} from './NclawModule.nitro.js';

// =============================================================================
// NclawModuleNotImplementedError
// =============================================================================

/**
 * NclawModuleNotImplementedError — thrown by NclawModuleStub for every method.
 *
 * Purpose: Surface missing native module registration clearly at runtime rather
 *          than silently returning undefined or crashing with a cryptic error.
 * Inputs:  method — the method name that was called (e.g. "chatSend").
 * Outputs: Error with code 'nclaw_native_not_implemented'.
 * Constraints: code field is readonly const to allow type narrowing.
 * SPORT: F08-SERVICE-INVENTORY.md — libnclaw JSI bridge
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

// =============================================================================
// Sub-module stubs (package-private — not exported from index.ts)
// =============================================================================

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

// =============================================================================
// NclawModuleStub — top-level stub
// =============================================================================

/**
 * NclawModuleStub — full NclawModule NOT_IMPLEMENTED placeholder.
 *
 * Purpose: Returned by getNativeNclaw() until registerNativeNclaw() is called.
 *          chatSend() and all primary methods throw NclawModuleNotImplementedError.
 * Inputs:  None — constructed without arguments.
 * Outputs: NclawModule that throws on all chat/memory methods and delegates
 *          to sub-module stubs for crypto/dampers/core/db/llm/vault/sync.
 * Constraints: Must fully implement NclawModule interface.
 * SPORT: F08-SERVICE-INVENTORY.md — libnclaw JSI bridge
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
 * registerNativeNclaw — register the real NativeNclaw native module.
 *
 * Purpose: Called once by nclaw/mobile native bootstrap; after this call
 *          getNativeNclaw() returns the real implementation.
 * Inputs:  impl — native module instance implementing NclawModule.
 * Outputs: void (mutates module-level registry).
 * Constraints: Call only once per app lifecycle. Subsequent calls replace impl.
 * SPORT: F08-SERVICE-INVENTORY.md — libnclaw JSI bridge
 */
export function registerNativeNclaw(impl: NclawModule): void {
  _nativeNclaw = impl;
}

/**
 * getNativeNclaw — retrieve the active NativeNclaw implementation.
 *
 * Purpose: Always returns the current (possibly stubbed) NclawModule.
 *          Returns NclawModuleStub until registerNativeNclaw() is called.
 * Inputs:  None.
 * Outputs: NclawModule (real or stub).
 * Constraints: Do NOT hold the returned value — always call getNativeNclaw()
 *              fresh so hot-swapping in tests works correctly.
 * SPORT: F08-SERVICE-INVENTORY.md — libnclaw JSI bridge
 */
export function getNativeNclaw(): NclawModule {
  return _nativeNclaw;
}

/**
 * NativeNclaw — getter-backed proxy over getNativeNclaw().
 *
 * Purpose: Stable named export for nclaw/mobile; hot-swap-safe because each
 *          property access delegates to the current getNativeNclaw() value.
 * Inputs:  None — proxy constructed at module load.
 * Outputs: NclawModule facade that always delegates to the live impl.
 * Constraints: Do NOT destructure — always access as NativeNclaw.chatSend().
 * SPORT: F08-SERVICE-INVENTORY.md — libnclaw JSI bridge
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
