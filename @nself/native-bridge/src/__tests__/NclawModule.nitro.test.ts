/**
 * @nself/native-bridge — NclawModule.nitro.ts integration tests.
 *
 * Purpose: Verify NclawModuleStub throws NclawModuleNotImplementedError on all
 *          methods, NativeNclaw proxy routes to the registered impl, and
 *          registerNativeNclaw / getNativeNclaw hot-swap correctly.
 *
 * QA-A acceptance gate (unit-testable portion):
 *   - NativeNclaw.chatSend('hello') rejects with NclawModuleNotImplementedError
 *     until native module is registered.
 *   - After registerNativeNclaw(mockImpl), chatSend resolves without throw.
 *   - All async methods return Promise<T> — verified by resolves/rejects assertions.
 *   - Sync void methods (dampers) do not throw in stub (intentional no-ops).
 *
 * Note: xcodebuild + ./gradlew build verification runs in CI (QA-A native),
 *       not in this Jest/Vitest unit test. This test covers the TS interface
 *       contract and stub/registry behavior.
 *
 * Cross-ref: NclawModule.nitro.ts (interface spec)
 *            T-P3-E4-W2-S3-T03 (this ticket)
 *            T-P3-E4-W2-S3-T04 (nclaw/mobile wires real native module)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  NclawModuleStub,
  NclawModuleNotImplementedError,
  getNativeNclaw,
  registerNativeNclaw,
  NativeNclaw,
  type NclawModule,
  type NativeDeviceKeypair,
  type NativeSessionCipher,
} from '../NclawModule.nitro.js';

// Reset registry to stub before each test.
beforeEach(() => {
  registerNativeNclaw(new NclawModuleStub());
});

// =============================================================================
// NclawModuleStub — primary chat + memory surface
// =============================================================================

describe('NclawModuleStub — primary surface', () => {
  it('chatSend() throws NclawModuleNotImplementedError (stub)', async () => {
    await expect(getNativeNclaw().chatSend('hello')).rejects.toThrow(
      NclawModuleNotImplementedError,
    );
  });

  it('memorySearch() throws NclawModuleNotImplementedError', async () => {
    await expect(getNativeNclaw().memorySearch('query', 10)).rejects.toThrow(
      NclawModuleNotImplementedError,
    );
  });

  it('memoryInsert() throws NclawModuleNotImplementedError', async () => {
    await expect(
      getNativeNclaw().memoryInsert('{"id":"msg-1","role":"user","content":"hi"}'),
    ).rejects.toThrow(NclawModuleNotImplementedError);
  });

  it('memoryReplace() throws NclawModuleNotImplementedError', async () => {
    await expect(
      getNativeNclaw().memoryReplace('mem-id-1', '{"id":"mem-1","content":"updated"}'),
    ).rejects.toThrow(NclawModuleNotImplementedError);
  });

  it('NclawModuleNotImplementedError includes method name', async () => {
    try {
      await getNativeNclaw().chatSend('test');
    } catch (e) {
      expect(e).toBeInstanceOf(NclawModuleNotImplementedError);
      expect((e as NclawModuleNotImplementedError).message).toContain('chatSend');
      expect((e as NclawModuleNotImplementedError).code).toBe(
        'nclaw_native_not_implemented',
      );
    }
  });
});

// =============================================================================
// NclawModuleStub — crypto sub-module (Group A)
// =============================================================================

describe('NclawModuleStub — crypto sub-module', () => {
  it('crypto.getVersion() throws NclawModuleNotImplementedError', () => {
    expect(() => getNativeNclaw().crypto.getVersion()).toThrow(
      NclawModuleNotImplementedError,
    );
  });

  it('crypto.keypairGenerate() throws NclawModuleNotImplementedError', () => {
    expect(() => getNativeNclaw().crypto.keypairGenerate()).toThrow(
      NclawModuleNotImplementedError,
    );
  });

  it('crypto.keypairPublicB64() throws NclawModuleNotImplementedError', () => {
    const fakeKp = { __brand: 'NativeDeviceKeypair' } as NativeDeviceKeypair;
    expect(() => getNativeNclaw().crypto.keypairPublicB64(fakeKp)).toThrow(
      NclawModuleNotImplementedError,
    );
  });

  it('crypto.keypairDh() throws NclawModuleNotImplementedError', () => {
    const fakeKp = { __brand: 'NativeDeviceKeypair' } as NativeDeviceKeypair;
    expect(() =>
      getNativeNclaw().crypto.keypairDh(fakeKp, 'base64pubkey=='),
    ).toThrow(NclawModuleNotImplementedError);
  });

  it('crypto.cipherEncrypt() throws NclawModuleNotImplementedError', () => {
    const fakeCipher = {
      __brand: 'NativeSessionCipher',
    } as NativeSessionCipher;
    expect(() =>
      getNativeNclaw().crypto.cipherEncrypt(fakeCipher, 'plaintext'),
    ).toThrow(NclawModuleNotImplementedError);
  });

  it('crypto.cipherDecrypt() throws NclawModuleNotImplementedError', () => {
    const fakeCipher = {
      __brand: 'NativeSessionCipher',
    } as NativeSessionCipher;
    expect(() =>
      getNativeNclaw().crypto.cipherDecrypt(fakeCipher, 'wiredata=='),
    ).toThrow(NclawModuleNotImplementedError);
  });
});

// =============================================================================
// NclawModuleStub — dampers sub-module (Group B)
// Damper setters are intentional no-ops in stub — no throw expected.
// =============================================================================

describe('NclawModuleStub — dampers sub-module (no-op stub)', () => {
  it('dampers.setLowPower() does not throw (fire-and-forget no-op)', () => {
    expect(() => getNativeNclaw().dampers.setLowPower(true)).not.toThrow();
    expect(() => getNativeNclaw().dampers.setLowPower(false)).not.toThrow();
  });

  it('dampers.setBatteryPct() does not throw', () => {
    expect(() => getNativeNclaw().dampers.setBatteryPct(75)).not.toThrow();
    expect(() => getNativeNclaw().dampers.setBatteryPct(0)).not.toThrow();
    expect(() => getNativeNclaw().dampers.setBatteryPct(100)).not.toThrow();
  });

  it('dampers.setThermalLevel() does not throw', () => {
    expect(() => getNativeNclaw().dampers.setThermalLevel(0)).not.toThrow();
    expect(() => getNativeNclaw().dampers.setThermalLevel(3)).not.toThrow();
  });
});

// =============================================================================
// NclawModuleStub — core sub-module (Group C)
// =============================================================================

describe('NclawModuleStub — core sub-module', () => {
  it('core.nclawVersion() throws NclawModuleNotImplementedError', () => {
    expect(() => getNativeNclaw().core.nclawVersion()).toThrow(
      NclawModuleNotImplementedError,
    );
  });

  it('core.probeDevice() throws NclawModuleNotImplementedError', () => {
    expect(() => getNativeNclaw().core.probeDevice()).toThrow(
      NclawModuleNotImplementedError,
    );
  });

  it('core.classifyTier() throws NclawModuleNotImplementedError', () => {
    expect(() =>
      getNativeNclaw().core.classifyTier('{}', false),
    ).toThrow(NclawModuleNotImplementedError);
  });
});

// =============================================================================
// NclawModuleStub — LLM sub-module (Group D)
// llmIsReady() returns false (safe no-op). llmUnload() is a no-op.
// =============================================================================

describe('NclawModuleStub — llm sub-module', () => {
  it('llm.initLlm() throws NclawModuleNotImplementedError', async () => {
    await expect(
      getNativeNclaw().llm.initLlm('/path/to/model.gguf', '{}'),
    ).rejects.toThrow(NclawModuleNotImplementedError);
  });

  it('llm.llmInferStream() throws NclawModuleNotImplementedError', () => {
    expect(() =>
      getNativeNclaw().llm.llmInferStream('prompt text', 512),
    ).toThrow(NclawModuleNotImplementedError);
  });

  it('llm.llmEmbed() throws NclawModuleNotImplementedError', async () => {
    await expect(
      getNativeNclaw().llm.llmEmbed('embed this text'),
    ).rejects.toThrow(NclawModuleNotImplementedError);
  });

  it('llm.llmIsReady() returns false safely (no native module loaded)', () => {
    // llmIsReady is a safe no-op in stub — returns false, not throw.
    expect(getNativeNclaw().llm.llmIsReady()).toBe(false);
  });

  it('llm.llmUnload() does not throw (no-op stub)', () => {
    expect(() => getNativeNclaw().llm.llmUnload()).not.toThrow();
  });
});

// =============================================================================
// NclawModuleStub — vault sub-module (Group D)
// =============================================================================

describe('NclawModuleStub — vault sub-module', () => {
  it('vault.initVault() throws NclawModuleNotImplementedError', async () => {
    await expect(
      getNativeNclaw().vault.initVault('com.nself.nclaw'),
    ).rejects.toThrow(NclawModuleNotImplementedError);
  });

  it('vault.vaultSet() throws NclawModuleNotImplementedError', async () => {
    await expect(
      getNativeNclaw().vault.vaultSet('api_key', 'secret-value'),
    ).rejects.toThrow(NclawModuleNotImplementedError);
  });

  it('vault.vaultGet() throws NclawModuleNotImplementedError', async () => {
    await expect(getNativeNclaw().vault.vaultGet('api_key')).rejects.toThrow(
      NclawModuleNotImplementedError,
    );
  });

  it('vault.vaultDelete() throws NclawModuleNotImplementedError', async () => {
    await expect(
      getNativeNclaw().vault.vaultDelete('api_key'),
    ).rejects.toThrow(NclawModuleNotImplementedError);
  });

  it('vault.vaultContains() throws NclawModuleNotImplementedError', async () => {
    await expect(
      getNativeNclaw().vault.vaultContains('api_key'),
    ).rejects.toThrow(NclawModuleNotImplementedError);
  });
});

// =============================================================================
// NclawModuleStub — sync sub-module (Group D)
// =============================================================================

describe('NclawModuleStub — sync sub-module', () => {
  it('sync.initSync() throws NclawModuleNotImplementedError', async () => {
    await expect(
      getNativeNclaw().sync.initSync('https://api.nself.org', 'jwt-token'),
    ).rejects.toThrow(NclawModuleNotImplementedError);
  });

  it('sync.syncPush() throws NclawModuleNotImplementedError', async () => {
    await expect(
      getNativeNclaw().sync.syncPush('[{"id":"evt-1","type":"message"}]'),
    ).rejects.toThrow(NclawModuleNotImplementedError);
  });

  it('sync.syncPull() throws NclawModuleNotImplementedError', async () => {
    await expect(getNativeNclaw().sync.syncPull('cursor-abc')).rejects.toThrow(
      NclawModuleNotImplementedError,
    );
  });

  it('sync.syncAck() throws NclawModuleNotImplementedError', async () => {
    await expect(
      getNativeNclaw().sync.syncAck('["evt-1","evt-2"]'),
    ).rejects.toThrow(NclawModuleNotImplementedError);
  });
});

// =============================================================================
// Registry — registerNativeNclaw / getNativeNclaw / NativeNclaw proxy
// =============================================================================

describe('Registry — registerNativeNclaw + NativeNclaw proxy', () => {
  it('getNativeNclaw() returns stub by default', () => {
    expect(getNativeNclaw()).toBeInstanceOf(NclawModuleStub);
  });

  it('NativeNclaw.chatSend resolves after registerNativeNclaw (mock impl)', async () => {
    const mockImpl: NclawModule = new NclawModuleStub();
    // Override chatSend to resolve successfully.
    mockImpl.chatSend = async (_msg: string) => 'mock response from NativeNclaw';

    registerNativeNclaw(mockImpl);

    // Acceptance test criterion: chatSend('hello') resolves without native crash.
    const result = await NativeNclaw.chatSend('hello');
    expect(result).toBe('mock response from NativeNclaw');
  });

  it('NativeNclaw proxy reflects registerNativeNclaw hot-swap', async () => {
    // Before registration: throws.
    await expect(NativeNclaw.chatSend('pre-registration')).rejects.toThrow(
      NclawModuleNotImplementedError,
    );

    // After registration: resolves.
    const impl = new NclawModuleStub();
    impl.chatSend = async () => 'registered';
    registerNativeNclaw(impl);

    const result = await NativeNclaw.chatSend('post-registration');
    expect(result).toBe('registered');
  });

  it('all Promise-returning methods are async (return Promise<T>)', () => {
    const stub = getNativeNclaw();
    // Verify each method returns a Promise (thenable) before it rejects.
    const chatResult = stub.chatSend('test');
    expect(typeof chatResult.then).toBe('function');
    chatResult.catch(() => null);  // suppress unhandled rejection

    const searchResult = stub.memorySearch('q', 5);
    expect(typeof searchResult.then).toBe('function');
    searchResult.catch(() => null);

    const insertResult = stub.memoryInsert('{}');
    expect(typeof insertResult.then).toBe('function');
    insertResult.catch(() => null);

    const replaceResult = stub.memoryReplace('id', '{}');
    expect(typeof replaceResult.then).toBe('function');
    replaceResult.catch(() => null);
  });

  it('damper setters are synchronous void (not Promise)', () => {
    const stub = getNativeNclaw();
    // These should NOT return a Promise.
    const lowPowerResult = stub.dampers.setLowPower(false);
    const batteryResult = stub.dampers.setBatteryPct(50);
    const thermalResult = stub.dampers.setThermalLevel(1);

    // Return type should be void (undefined), not thenable.
    expect(lowPowerResult).toBeUndefined();
    expect(batteryResult).toBeUndefined();
    expect(thermalResult).toBeUndefined();
  });
});
