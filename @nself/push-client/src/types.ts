/**
 * @nself/push-client — types.ts
 *
 * Purpose: Canonical types for the unified push notification client.
 *          PushClient interface, PushPermission enum, and DeviceToken type
 *          are the public contract consumed by all nSelf apps.
 * Inputs:  None — pure type definitions.
 * Outputs: PushClient, PushPermission, DeviceToken.
 * Constraints: No runtime code — types and enum only. Platform-agnostic.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/push-client
 */

import type { Result, AppError } from '@nself/errors';

// ─── DeviceToken ──────────────────────────────────────────────────────────────

/**
 * DeviceToken — opaque string identifier for a device's push registration.
 *
 * On web: the PushSubscription endpoint URL.
 * On native: the Expo push token string (ExponentPushToken[...]).
 */
export type DeviceToken = string & { readonly _brand: 'DeviceToken' };

// ─── PushPermission ───────────────────────────────────────────────────────────

/**
 * PushPermission — canonical enum for push notification permission state.
 *
 * GRANTED   — OS has granted push notification permission.
 * DENIED    — OS has denied permission (user explicitly rejected or policy).
 * NOT_ASKED — Permission has never been requested on this device.
 */
export enum PushPermission {
  GRANTED = 'granted',
  DENIED = 'denied',
  NOT_ASKED = 'not_asked',
}

// ─── PushClient ───────────────────────────────────────────────────────────────

/**
 * PushClient — platform-agnostic push notification interface.
 *
 * Purpose: Single contract for all nSelf apps to subscribe, retrieve tokens,
 *          and register device tokens with the nSelf backend — without any
 *          platform-specific push code in app repositories.
 *
 * All methods return Result<T, AppError> — no untyped exceptions escape.
 *
 * Usage:
 *   const client = createPushClient('web', { gqlClient });
 *   const permResult = await client.requestPermission();
 *   if (permResult._tag === 'Ok' && permResult.value === PushPermission.GRANTED) {
 *     await client.registerWithBackend();
 *   }
 */
export interface PushClient {
  /**
   * Request push notification permission from the OS.
   * Returns PushPermission.GRANTED | DENIED | NOT_ASKED.
   * Never calls the OS prompt if permission is already DENIED.
   */
  requestPermission(): Promise<Result<PushPermission, AppError>>;

  /**
   * Retrieve the device push token.
   * Must be called after a GRANTED permission result.
   * Returns Result.err(PERMISSION_DENIED) if permission is not granted.
   */
  getToken(): Promise<Result<DeviceToken, AppError>>;

  /**
   * Register the device token with the nSelf backend via GraphQL mutation.
   * Idempotent — uses upsert so duplicate calls are safe.
   * Calls getToken() internally; returns its error if token retrieval fails.
   */
  registerWithBackend(): Promise<Result<void, AppError>>;
}
