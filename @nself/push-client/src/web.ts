/**
 * @nself/push-client — web.ts
 *
 * Purpose: WebPushClient — Web Push API implementation of PushClient.
 *          Uses the Notification API for permission and the Service Worker
 *          PushManager for obtaining a subscription token.
 * Inputs:  Browser globals (Notification, navigator.serviceWorker).
 * Outputs: Result<PushPermission, AppError>, Result<DeviceToken, AppError>.
 * Constraints:
 *   - Never calls Notification.requestPermission() if permission is already DENIED.
 *   - Service worker path defaults to '/sw.js' (must be served by the app).
 *   - No React/RN dependencies — plain TypeScript.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/push-client
 */

import { ok, err, type Result, type AppError } from '@nself/errors';
import type { PushClient, DeviceToken } from './types.js';
import { PushPermission } from './types.js';
import type { GqlClientDeps } from './register.js';
import { registerDeviceToken } from './register.js';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function mapNotificationPermission(status: NotificationPermission): PushPermission {
  if (status === 'granted') return PushPermission.GRANTED;
  if (status === 'denied') return PushPermission.DENIED;
  return PushPermission.NOT_ASKED;
}

function permissionDeniedError(): AppError {
  return {
    code: 'forbidden',
    message: 'Push notification permission was denied by the user or OS policy.',
    status: 403,
  };
}

// ─── WebPushClient ────────────────────────────────────────────────────────────

/**
 * WebPushClient — Web Push API implementation.
 *
 * Instantiate via createPushClient('web', deps) — do not construct directly.
 *
 * @internal Exported for testing only; public API is createPushClient().
 */
export class WebPushClient implements PushClient {
  private readonly _gqlClient: GqlClientDeps;
  private readonly _swPath: string;

  constructor(deps: GqlClientDeps, swPath = '/sw.js') {
    this._gqlClient = deps;
    this._swPath = swPath;
  }

  /**
   * Request push notification permission.
   *
   * Returns immediately with DENIED if Notification.permission === 'denied'
   * — never prompts the OS when already denied (CR-A compliance).
   * Returns NOT_ASKED if the Notifications API is unavailable.
   */
  async requestPermission(): Promise<Result<PushPermission, AppError>> {
    if (typeof Notification === 'undefined') {
      return ok(PushPermission.NOT_ASKED);
    }

    const current = Notification.permission;
    if (current === 'denied') {
      // CR-A: do NOT call requestPermission() again — return immediately
      return err(permissionDeniedError());
    }

    if (current === 'granted') {
      return ok(PushPermission.GRANTED);
    }

    // current === 'default' — ask the user
    try {
      const result = await Notification.requestPermission();
      return ok(mapNotificationPermission(result));
    } catch (cause) {
      return err({
        code: 'internal',
        message: `Notification.requestPermission failed: ${String(cause)}`,
        status: 500,
      });
    }
  }

  /**
   * Retrieve the device push token via Service Worker PushManager.
   *
   * Registers '/sw.js' (or the configured swPath) and returns the
   * PushSubscription endpoint URL as DeviceToken.
   */
  async getToken(): Promise<Result<DeviceToken, AppError>> {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return err(permissionDeniedError());
    }

    if (!('serviceWorker' in navigator)) {
      return err({
        code: 'internal',
        message: 'Service Worker API is not available in this browser.',
        status: 500,
      });
    }

    try {
      const registration = await navigator.serviceWorker.register(this._swPath);
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
      });

      return ok(subscription.endpoint as DeviceToken);
    } catch (cause) {
      return err({
        code: 'internal',
        message: `Service Worker push subscription failed: ${String(cause)}`,
        status: 500,
      });
    }
  }

  /**
   * Register the device token with the nSelf backend.
   * Calls getToken() internally; propagates any error.
   */
  async registerWithBackend(): Promise<Result<void, AppError>> {
    const tokenResult = await this.getToken();
    if (tokenResult._tag === 'Err') return tokenResult;
    return registerDeviceToken(tokenResult.value, this._gqlClient);
  }
}
