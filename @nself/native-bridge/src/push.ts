/**
 * @nself/native-bridge — Push notification token provider for React Native.
 *
 * Purpose: Typed interface wrapping expo-notifications so push-client
 *          can request permission and retrieve Expo push tokens without
 *          direct expo dependency in higher-level packages.
 * Inputs:  None for permission request; none for token retrieval.
 * Outputs: Result<T, AppError> — no untyped throws escape this module.
 * Constraints: expo-notifications is a peer dep — only present in React Native
 *              environments. Must be called after app is foregrounded.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/native-bridge (push token seam)
 */

import { ok, err, type Result, type AppError } from '@nself/errors';

/**
 * PushTokenProvider — canonical contract for push notification permission + token retrieval.
 *
 * Implemented by ExpoNotificationsProvider in this module.
 * Consumed by @nself/push-client (W4-S03).
 */
export interface PushTokenProvider {
  /** Request OS-level permission for push notifications. Returns Ok(true) if granted. */
  requestPermission(): Promise<Result<boolean, AppError>>;
  /** Retrieve the Expo push token for this device/install. Requires granted permission. */
  getExpoPushToken(): Promise<Result<string, AppError>>;
}

/**
 * ExpoNotificationsProvider — production implementation backed by expo-notifications.
 *
 * All expo-notifications calls are wrapped in try/catch → AppError{code:'internal'}.
 */
export class ExpoNotificationsProvider implements PushTokenProvider {
  async requestPermission(): Promise<Result<boolean, AppError>> {
    try {
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      return ok(status === 'granted');
    } catch (cause) {
      return err({
        code: 'internal',
        message: `Push permission request failed: ${String(cause)}`,
        status: 500,
      });
    }
  }

  async getExpoPushToken(): Promise<Result<string, AppError>> {
    try {
      const Notifications = await import('expo-notifications');
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return ok(tokenData.data);
    } catch (cause) {
      return err({
        code: 'internal',
        message: `Failed to retrieve Expo push token: ${String(cause)}`,
        status: 500,
      });
    }
  }
}
