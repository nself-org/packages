/**
 * @nself/push-client — native.ts
 *
 * Purpose: NativePushClient — React Native implementation of PushClient.
 *          Wraps the PushTokenProvider interface from @nself/native-bridge
 *          (ExpoNotificationsProvider) to request permission and retrieve
 *          Expo push tokens — without importing expo-notifications directly.
 * Inputs:  PushTokenProvider instance (injected via constructor).
 * Outputs: Result<PushPermission, AppError>, Result<DeviceToken, AppError>.
 * Constraints:
 *   - Depends on PushTokenProvider interface only — not the concrete class.
 *   - No web/browser globals used here.
 *   - NativePushClient is internal; instantiate via createPushClient('native', deps).
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/push-client
 */

import { ok, err, type Result, type AppError } from '@nself/errors';
import type { PushTokenProvider } from '@nself/native-bridge';
import type { PushClient, DeviceToken } from './types.js';
import { PushPermission } from './types.js';
import type { GqlClientDeps } from './register.js';
import { registerDeviceToken } from './register.js';

// ─── NativePushClient ─────────────────────────────────────────────────────────

/**
 * NativePushClient — Expo Notifications / React Native implementation.
 *
 * Accepts a PushTokenProvider (structural interface) — any conforming
 * implementation works, including mocks in tests.
 *
 * @internal Exported for testing only; public API is createPushClient().
 */
export class NativePushClient implements PushClient {
  private readonly _provider: PushTokenProvider;
  private readonly _gqlClient: GqlClientDeps;

  constructor(provider: PushTokenProvider, deps: GqlClientDeps) {
    this._provider = provider;
    this._gqlClient = deps;
  }

  /**
   * Request push notification permission via the native PushTokenProvider.
   *
   * Maps the boolean Ok result from requestPermission() to PushPermission.
   * GRANTED if true, DENIED if false.
   */
  async requestPermission(): Promise<Result<PushPermission, AppError>> {
    const result = await this._provider.requestPermission();
    if (result._tag === 'Err') return result;
    return ok(result.value ? PushPermission.GRANTED : PushPermission.DENIED);
  }

  /**
   * Retrieve Expo push token via the native PushTokenProvider.
   *
   * Requests permission first; returns PERMISSION_DENIED if not granted.
   * Returns the Expo push token string as DeviceToken.
   */
  async getToken(): Promise<Result<DeviceToken, AppError>> {
    const permResult = await this.requestPermission();
    if (permResult._tag === 'Err') return permResult;

    if (permResult.value !== PushPermission.GRANTED) {
      return err({
        code: 'forbidden',
        message: 'Push notification permission was not granted.',
        status: 403,
      });
    }

    const tokenResult = await this._provider.getExpoPushToken();
    if (tokenResult._tag === 'Err') return tokenResult;
    return ok(tokenResult.value as DeviceToken);
  }

  /**
   * Register the Expo push token with the nSelf backend.
   * Calls getToken() internally; propagates any error.
   */
  async registerWithBackend(): Promise<Result<void, AppError>> {
    const tokenResult = await this.getToken();
    if (tokenResult._tag === 'Err') return tokenResult;
    return registerDeviceToken(tokenResult.value, this._gqlClient);
  }
}
