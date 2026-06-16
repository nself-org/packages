/**
 * Unit tests for @nself/push-client.
 *
 * Coverage:
 *   - WebPushClient.requestPermission() returns DENIED without prompting when Notification.permission='denied' (QA-A)
 *   - WebPushClient.requestPermission() returns GRANTED when Notification.permission='granted'
 *   - WebPushClient.requestPermission() returns NOT_ASKED when Notification API is absent
 *   - WebPushClient.requestPermission() calls browser prompt when permission='default'
 *   - WebPushClient.getToken() returns err(forbidden) when permission is not granted
 *   - NativePushClient accepts PushTokenProvider interface (structural TS check)
 *   - NativePushClient.requestPermission() returns GRANTED when provider grants
 *   - NativePushClient.requestPermission() returns DENIED when provider denies
 *   - NativePushClient.getToken() returns err when permission denied
 *   - registerDeviceToken calls upsert mutation (mutation name check)
 *   - registerDeviceToken returns ok(undefined) on success
 *   - registerDeviceToken returns err on mutation error
 *   - createPushClient('web', deps) returns a PushClient instance
 *   - createPushClient('native', deps) returns a PushClient instance
 *   - PushPermission enum has GRANTED, DENIED, NOT_ASKED values
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebPushClient } from '../web.js';
import { NativePushClient } from '../native.js';
import { registerDeviceToken } from '../register.js';
import { createPushClient, PushPermission } from '../index.js';
import type { GqlClientDeps } from '../register.js';
import type { PushTokenProvider } from '@nself/native-bridge';
import type { DeviceToken } from '../types.js';
import { ok, err } from '@nself/errors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockGqlClient(overrides?: Partial<GqlClientDeps>): GqlClientDeps {
  return {
    mutation: vi.fn().mockResolvedValue({
      data: { insert_np_device_tokens_one: { device_id: 'test-device' } },
      error: null,
    }),
    ...overrides,
  };
}

function makeMockPushTokenProvider(granted = true): PushTokenProvider {
  return {
    requestPermission: vi.fn().mockResolvedValue(ok(granted)),
    getExpoPushToken: vi.fn().mockResolvedValue(ok('ExponentPushToken[test-token-123]')),
  };
}

// ─── WebPushClient tests ──────────────────────────────────────────────────────

describe('WebPushClient', () => {
  beforeEach(() => {
    // Reset Notification mock between tests
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  it('returns NOT_ASKED when Notification API is absent', async () => {
    // Notification is undefined (set in beforeEach)
    const client = new WebPushClient(makeMockGqlClient());
    const result = await client.requestPermission();
    expect(result._tag).toBe('Ok');
    expect(result._tag === 'Ok' && result.value).toBe(PushPermission.NOT_ASKED);
  });

  it('returns err(forbidden) and NEVER calls requestPermission when permission=denied (QA-A)', async () => {
    const mockRequestPermission = vi.fn();
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: {
        permission: 'denied',
        requestPermission: mockRequestPermission,
      },
    });

    const client = new WebPushClient(makeMockGqlClient());
    const result = await client.requestPermission();

    // CR-A: never calls the browser prompt when already denied
    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(result._tag).toBe('Err');
    expect(result._tag === 'Err' && result.error.code).toBe('forbidden');
  });

  it('returns GRANTED when Notification.permission=granted', async () => {
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: { permission: 'granted' },
    });

    const client = new WebPushClient(makeMockGqlClient());
    const result = await client.requestPermission();
    expect(result._tag).toBe('Ok');
    expect(result._tag === 'Ok' && result.value).toBe(PushPermission.GRANTED);
  });

  it('calls browser prompt when permission=default', async () => {
    const mockRequestPermission = vi.fn().mockResolvedValue('granted');
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: mockRequestPermission,
      },
    });

    const client = new WebPushClient(makeMockGqlClient());
    const result = await client.requestPermission();
    expect(mockRequestPermission).toHaveBeenCalledOnce();
    expect(result._tag).toBe('Ok');
    expect(result._tag === 'Ok' && result.value).toBe(PushPermission.GRANTED);
  });

  it('getToken returns err(forbidden) when Notification permission is not granted', async () => {
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: { permission: 'default' },
    });

    const client = new WebPushClient(makeMockGqlClient());
    const result = await client.getToken();
    expect(result._tag).toBe('Err');
    expect(result._tag === 'Err' && result.error.code).toBe('forbidden');
  });
});

// ─── NativePushClient tests ───────────────────────────────────────────────────

describe('NativePushClient', () => {
  it('accepts PushTokenProvider interface (structural check)', () => {
    const provider = makeMockPushTokenProvider();
    const client = new NativePushClient(provider, makeMockGqlClient());
    // Type check: client satisfies PushClient interface
    expect(typeof client.requestPermission).toBe('function');
    expect(typeof client.getToken).toBe('function');
    expect(typeof client.registerWithBackend).toBe('function');
  });

  it('returns GRANTED when provider grants permission', async () => {
    const provider = makeMockPushTokenProvider(true);
    const client = new NativePushClient(provider, makeMockGqlClient());
    const result = await client.requestPermission();
    expect(result._tag).toBe('Ok');
    expect(result._tag === 'Ok' && result.value).toBe(PushPermission.GRANTED);
  });

  it('returns DENIED when provider denies permission', async () => {
    const provider = makeMockPushTokenProvider(false);
    const client = new NativePushClient(provider, makeMockGqlClient());
    const result = await client.requestPermission();
    expect(result._tag).toBe('Ok');
    expect(result._tag === 'Ok' && result.value).toBe(PushPermission.DENIED);
  });

  it('getToken returns err when permission is denied', async () => {
    const provider = makeMockPushTokenProvider(false);
    const client = new NativePushClient(provider, makeMockGqlClient());
    const result = await client.getToken();
    expect(result._tag).toBe('Err');
    expect(result._tag === 'Err' && result.error.code).toBe('forbidden');
  });

  it('getToken returns DeviceToken when permission is granted', async () => {
    const provider = makeMockPushTokenProvider(true);
    const client = new NativePushClient(provider, makeMockGqlClient());
    const result = await client.getToken();
    expect(result._tag).toBe('Ok');
    expect(result._tag === 'Ok' && result.value).toBe('ExponentPushToken[test-token-123]');
  });
});

// ─── registerDeviceToken tests ────────────────────────────────────────────────

describe('registerDeviceToken', () => {
  it('calls the upsert mutation (UpsertDeviceToken)', async () => {
    const gqlClient = makeMockGqlClient();
    const token = 'https://push.example.com/token' as DeviceToken;
    await registerDeviceToken(token, gqlClient, 'my-device', 'web');

    expect(gqlClient.mutation).toHaveBeenCalledOnce();
    const [mutationStr] = (gqlClient.mutation as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown];
    // CR-B: verify the mutation is named UpsertDeviceToken (not Insert)
    expect(mutationStr).toContain('UpsertDeviceToken');
    // CR-B: verify on_conflict is present (upsert, not plain insert)
    expect(mutationStr).toContain('on_conflict');
  });

  it('returns ok(undefined) on success', async () => {
    const gqlClient = makeMockGqlClient();
    const token = 'https://push.example.com/token' as DeviceToken;
    const result = await registerDeviceToken(token, gqlClient, 'my-device', 'web');
    expect(result._tag).toBe('Ok');
    expect(result._tag === 'Ok' && result.value).toBeUndefined();
  });

  it('returns err on mutation error', async () => {
    const gqlClient = makeMockGqlClient({
      mutation: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'unique constraint violation' },
      }),
    });
    const token = 'https://push.example.com/token' as DeviceToken;
    const result = await registerDeviceToken(token, gqlClient, 'my-device', 'web');
    expect(result._tag).toBe('Err');
    expect(result._tag === 'Err' && result.error.code).toBe('internal');
  });
});

// ─── createPushClient factory tests ──────────────────────────────────────────

describe('createPushClient', () => {
  it("createPushClient('web', deps) returns a PushClient instance", () => {
    const client = createPushClient('web', { gqlClient: makeMockGqlClient() });
    expect(typeof client.requestPermission).toBe('function');
    expect(typeof client.getToken).toBe('function');
    expect(typeof client.registerWithBackend).toBe('function');
  });

  it("createPushClient('native', deps) returns a PushClient instance", () => {
    const client = createPushClient('native', {
      gqlClient: makeMockGqlClient(),
      pushTokenProvider: makeMockPushTokenProvider(),
    });
    expect(typeof client.requestPermission).toBe('function');
    expect(typeof client.getToken).toBe('function');
    expect(typeof client.registerWithBackend).toBe('function');
  });
});

// ─── PushPermission enum ──────────────────────────────────────────────────────

describe('PushPermission', () => {
  it('has GRANTED, DENIED, NOT_ASKED values', () => {
    expect(PushPermission.GRANTED).toBe('granted');
    expect(PushPermission.DENIED).toBe('denied');
    expect(PushPermission.NOT_ASKED).toBe('not_asked');
  });
});
