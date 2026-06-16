/**
 * @nself/push-client — public API barrel.
 *
 * Purpose: Unified push notification client for web (Web Push API + service worker)
 *          and React Native (Expo Notifications via @nself/native-bridge).
 *          All nSelf apps call PushClient.subscribe() — no platform-specific
 *          push code lives in app repositories.
 * Inputs:  createPushClient(platform, deps) factory — the only public instantiation path.
 * Outputs: PushClient interface, PushPermission enum, DeviceToken type, factory.
 * Constraints:
 *   - createPushClient() is the ONLY public way to create a client (CR-C).
 *     WebPushClient and NativePushClient constructors are internal.
 *   - Typed Result<T, AppError> returns — no untyped throws escape this module.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/push-client (unified web+native push)
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export type { PushClient, DeviceToken } from './types.js';
export { PushPermission } from './types.js';
export type { GqlClientDeps } from './register.js';

// ─── Factory ──────────────────────────────────────────────────────────────────

import { WebPushClient } from './web.js';
import { NativePushClient } from './native.js';
import type { PushClient } from './types.js';
import type { GqlClientDeps } from './register.js';
import type { PushTokenProvider } from '@nself/native-bridge';

/**
 * WebPushClientDeps — dependencies for the web push client.
 */
export interface WebPushClientDeps {
  gqlClient: GqlClientDeps;
  /** Optional service worker path; defaults to '/sw.js'. */
  swPath?: string;
}

/**
 * NativePushClientDeps — dependencies for the native push client.
 */
export interface NativePushClientDeps {
  gqlClient: GqlClientDeps;
  /** PushTokenProvider from @nself/native-bridge (ExpoNotificationsProvider or mock). */
  pushTokenProvider: PushTokenProvider;
}

/**
 * createPushClient — factory for the platform-appropriate PushClient.
 *
 * This is the ONLY public instantiation path (CR-C). Do not import
 * WebPushClient or NativePushClient directly — they are internal.
 *
 * @param platform  'web' | 'native'
 * @param deps      Platform-specific dependencies.
 * @returns         A PushClient instance for the requested platform.
 *
 * @example
 * // Web
 * const client = createPushClient('web', { gqlClient });
 *
 * // React Native
 * const client = createPushClient('native', {
 *   gqlClient,
 *   pushTokenProvider: new ExpoNotificationsProvider(),
 * });
 */
export function createPushClient(platform: 'web', deps: WebPushClientDeps): PushClient;
export function createPushClient(platform: 'native', deps: NativePushClientDeps): PushClient;
export function createPushClient(
  platform: 'web' | 'native',
  deps: WebPushClientDeps | NativePushClientDeps,
): PushClient {
  if (platform === 'web') {
    const webDeps = deps as WebPushClientDeps;
    return new WebPushClient(webDeps.gqlClient, webDeps.swPath);
  }

  const nativeDeps = deps as NativePushClientDeps;
  return new NativePushClient(nativeDeps.pushTokenProvider, nativeDeps.gqlClient);
}
