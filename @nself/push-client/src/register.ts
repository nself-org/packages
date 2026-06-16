/**
 * @nself/push-client — register.ts
 *
 * Purpose: registerDeviceToken — GraphQL mutation to register a device push
 *          token with the nSelf backend. Uses the np_device_tokens table via
 *          an upsert mutation so duplicate calls are idempotent (CR-B).
 * Inputs:  DeviceToken (string), GqlClientDeps (urql Client-compatible executor).
 * Outputs: Result<void, AppError>.
 * Constraints:
 *   - Mutation MUST be an upsert (on_conflict: do_nothing or update) — never
 *     a plain INSERT to prevent duplicate token rows (CR-B).
 *   - No singleton — deps are injected by createPushClient().
 *   - Works with any executor that accepts a Hasura GraphQL mutation object.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/push-client
 */

import { ok, err, type Result, type AppError } from '@nself/errors';
import type { DeviceToken } from './types.js';

// ─── Deps ──────────────────────────────────────────────────────────────────────

/**
 * GqlClientDeps — minimal GraphQL executor interface required by register.ts.
 *
 * Compatible with @nself/graphql-client's NselfGraphqlClient (urql Client).
 * Accepting the minimal interface allows test mocking without a full urql stub.
 */
export interface GqlClientDeps {
  mutation<Data = unknown, Variables extends Record<string, unknown> = Record<string, unknown>>(
    mutation: string,
    variables: Variables,
  ): Promise<{ data: Data | null | undefined; error?: { message: string } | null }>;
}

// ─── Mutation ─────────────────────────────────────────────────────────────────

/**
 * UPSERT_DEVICE_TOKEN — GraphQL mutation for idempotent device token registration.
 *
 * Uses on_conflict with do_nothing to avoid duplicate rows when the same
 * device_id + token combination is registered more than once (CR-B).
 *
 * The np_device_tokens table columns:
 *   - device_id TEXT NOT NULL  — client-generated stable device identifier
 *   - token     TEXT NOT NULL  — platform push token (endpoint URL or Expo token)
 *   - platform  TEXT NOT NULL  — 'web' | 'native'
 */
const UPSERT_DEVICE_TOKEN_MUTATION = /* GraphQL */ `
  mutation UpsertDeviceToken($device_id: String!, $token: String!, $platform: String!) {
    insert_np_device_tokens_one(
      object: { device_id: $device_id, token: $token, platform: $platform }
      on_conflict: {
        constraint: np_device_tokens_device_id_key
        update_columns: [token, platform]
      }
    ) {
      device_id
    }
  }
`;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * registerDeviceToken — upsert a device push token into np_device_tokens.
 *
 * Idempotent: uses on_conflict update so calling this multiple times with
 * the same device_id is safe (CR-B compliance).
 *
 * @param token      The DeviceToken returned by PushClient.getToken().
 * @param gqlClient  A GqlClientDeps-compatible executor.
 * @param deviceId   Optional stable device identifier; defaults to a uuid-like
 *                   fingerprint derived from the token (platform-specific).
 * @param platform   'web' | 'native' — set by the calling client.
 */
export async function registerDeviceToken(
  token: DeviceToken,
  gqlClient: GqlClientDeps,
  deviceId?: string,
  platform: 'web' | 'native' = 'web',
): Promise<Result<void, AppError>> {
  // Derive a stable device_id from the token when not explicitly provided.
  // This keeps the API simple while still supporting explicit IDs.
  const resolvedDeviceId = deviceId ?? `device:${platform}:${token.slice(0, 64)}`;

  try {
    const result = await gqlClient.mutation<{ insert_np_device_tokens_one: { device_id: string } | null }>(
      UPSERT_DEVICE_TOKEN_MUTATION,
      {
        device_id: resolvedDeviceId,
        token: String(token),
        platform,
      },
    );

    if (result.error) {
      return err({
        code: 'internal',
        message: `Device token registration failed: ${result.error.message}`,
        status: 500,
      });
    }

    return ok(undefined);
  } catch (cause) {
    return err({
      code: 'internal',
      message: `registerDeviceToken threw unexpectedly: ${String(cause)}`,
      status: 500,
    });
  }
}
