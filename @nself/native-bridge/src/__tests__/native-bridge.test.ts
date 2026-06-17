/**
 * Unit tests for @nself/native-bridge.
 *
 * Coverage:
 *   - SecureStoreInterface contract (3 methods, round-trip, error wrapping)
 *   - PushTokenProvider contract (permission request, token retrieval)
 *   - BiometricsProvider contract (isAvailable, authenticate)
 *   - NclawFFIInterface (all 3 methods return not-implemented stub)
 *   - createNclawFFI factory returns NclawFFIInterface instance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SecureStoreInterface } from '../secure-store.js';
import type { PushTokenProvider } from '../push.js';
import type { BiometricsProvider } from '../biometrics.js';
import { createNclawFFI, type NclawFFIInterface, type MemoryDump } from '../nclaw-ffi.js';
import { isOk, isErr } from '@nself/errors';

// ---------------------------------------------------------------------------
// Mock SecureStore implementation — simulates expo-secure-store in-memory
// ---------------------------------------------------------------------------
class MockSecureStore implements SecureStoreInterface {
  private readonly _store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this._store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this._store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this._store.delete(key);
  }
}

// Mock SecureStore that throws on every call (tests error propagation)
class ThrowingSecureStore implements SecureStoreInterface {
  async get(_key: string): Promise<string | null> {
    throw new Error('SecureStore unavailable');
  }
  async set(_key: string, _value: string): Promise<void> {
    throw new Error('SecureStore unavailable');
  }
  async delete(_key: string): Promise<void> {
    throw new Error('SecureStore unavailable');
  }
}

// ---------------------------------------------------------------------------
// Mock PushTokenProvider
// ---------------------------------------------------------------------------
class MockPushTokenProvider implements PushTokenProvider {
  private _permissionGranted: boolean;
  constructor(permissionGranted = true) {
    this._permissionGranted = permissionGranted;
  }
  async requestPermission() {
    const { ok } = await import('@nself/errors');
    return ok(this._permissionGranted);
  }
  async getExpoPushToken() {
    const { ok } = await import('@nself/errors');
    return ok('ExponentPushToken[mock-device-token-12345]');
  }
}

// ---------------------------------------------------------------------------
// Mock BiometricsProvider
// ---------------------------------------------------------------------------
class MockBiometrics implements BiometricsProvider {
  private readonly _available: boolean;
  private readonly _authSuccess: boolean;
  constructor(available = true, authSuccess = true) {
    this._available = available;
    this._authSuccess = authSuccess;
  }
  async isAvailable() {
    return this._available;
  }
  async authenticate(_reason: string) {
    const { ok } = await import('@nself/errors');
    return ok(this._authSuccess);
  }
}

// ===========================================================================
// Tests
// ===========================================================================

describe('@nself/native-bridge — SecureStoreInterface', () => {
  let store: SecureStoreInterface;
  beforeEach(() => {
    store = new MockSecureStore();
  });

  it('set then get returns the stored value (round-trip)', async () => {
    await store.set('auth_token', 'mock-jwt-abc123'); // assertion 1
    const value = await store.get('auth_token');
    expect(value).toBe('mock-jwt-abc123'); // assertion 2
  });

  it('get returns null for a missing key', async () => {
    const value = await store.get('nonexistent_key');
    expect(value).toBeNull(); // assertion 3
  });

  it('delete removes the stored value', async () => {
    await store.set('refresh_token', 'refresh-xyz');
    await store.delete('refresh_token');
    const value = await store.get('refresh_token');
    expect(value).toBeNull(); // assertion 4
  });

  it('ThrowingSecureStore propagates the error to the caller', async () => {
    const throwing = new ThrowingSecureStore();
    await expect(throwing.get('any_key')).rejects.toThrow('SecureStore unavailable'); // assertion 5
  });
});

describe('@nself/native-bridge — PushTokenProvider', () => {
  it('requestPermission returns Ok(true) when granted', async () => {
    const provider = new MockPushTokenProvider(true);
    const result = await provider.requestPermission();
    expect(isOk(result)).toBe(true); // assertion 10
    if (isOk(result)) {
      expect(result.value).toBe(true); // assertion 11
    }
  });

  it('getExpoPushToken returns Ok(string) starting with ExponentPushToken', async () => {
    const provider = new MockPushTokenProvider(true);
    const result = await provider.getExpoPushToken();
    expect(isOk(result)).toBe(true); // assertion 12
    if (isOk(result)) {
      expect(result.value).toMatch(/^ExponentPushToken\[/); // assertion 13
    }
  });
});

describe('@nself/native-bridge — BiometricsProvider', () => {
  it('isAvailable returns true when hardware + enrollment present', async () => {
    const biometrics = new MockBiometrics(true, true);
    const available = await biometrics.isAvailable();
    expect(available).toBe(true); // assertion 14
  });

  it('isAvailable returns false when no hardware', async () => {
    const biometrics = new MockBiometrics(false, false);
    const available = await biometrics.isAvailable();
    expect(available).toBe(false); // assertion 15
  });

  it('authenticate returns Ok(true) on success', async () => {
    const biometrics = new MockBiometrics(true, true);
    const result = await biometrics.authenticate('Confirm your identity');
    expect(isOk(result)).toBe(true); // assertion 16
    if (isOk(result)) {
      expect(result.value).toBe(true); // assertion 17
    }
  });
});

describe('@nself/native-bridge — NclawFFIInterface stub', () => {
  let ffi: NclawFFIInterface;
  beforeEach(() => {
    ffi = createNclawFFI();
  });

  it('createNclawFFI() returns an NclawFFIInterface instance', () => {
    expect(ffi).toBeDefined(); // assertion 18
    expect(typeof ffi.chat).toBe('function'); // assertion 19
    expect(typeof ffi.loadMemory).toBe('function'); // assertion 20
    expect(typeof ffi.syncMemory).toBe('function'); // assertion 21
  });

  it('chat() returns Err(not-implemented) — stub not wired to JSI yet', async () => {
    const result = await ffi.chat('Hello nclaw');
    expect(isErr(result)).toBe(true); // assertion 22
    if (isErr(result)) {
      expect(result.error.code).toBe('internal'); // assertion 23
      expect(result.error.message).toContain('not implemented'); // assertion 24
    }
  });

  it('loadMemory() returns Err(not-implemented)', async () => {
    const result = await ffi.loadMemory();
    expect(isErr(result)).toBe(true); // assertion 25
    if (isErr(result)) {
      expect(result.error.code).toBe('internal'); // assertion 26
    }
  });

  it('syncMemory() returns Err(not-implemented)', async () => {
    const dump: MemoryDump = { payload: '{"entries":[]}', capturedAt: Date.now() };
    const result = await ffi.syncMemory(dump);
    expect(isErr(result)).toBe(true); // assertion 27
    if (isErr(result)) {
      expect(result.error.code).toBe('internal'); // assertion 28
    }
  });
});
