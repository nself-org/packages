/**
 * admin/types.ts — configuration type for the server-only admin GraphQL client.
 *
 * Purpose: Own the AdminClientConfig shape in a file that imports nothing, so the
 *          browser stub (browser.ts) can export the same type without pulling in
 *          urql or any admin logic.
 * Inputs:  None (type only).
 * Outputs: AdminClientConfig.
 * Constraints:
 *   - Type-only module: no runtime code; the only import is a type (erased).
 *   - There is deliberately no default for `url` or `adminSecret`.
 * SPORT: cap:packages.admin-graphql-client (P7-ADOPT-09, EPIC ADOPT D14)
 */

import type { OnError } from '../exchanges.js';

/**
 * AdminClientConfig — options accepted by createAdminClient.
 *
 * `sourceAccountId` is the multi-app wall (ADR 0004): it selects one app inside
 * a shared backend and is sent as `x-hasura-source-account-id`. It is NOT a
 * tenant id. `tenant_id` identifies a paying customer and is never sent here.
 */
export interface AdminClientConfig {
  /** Hasura GraphQL endpoint, http(s) only. Required, no default. */
  readonly url: string;

  /**
   * Hasura admin secret. Required, non-empty. Held in a closure by the client:
   * it never appears in thrown messages, toString, JSON or onError payloads.
   * Read it from the server environment or the vault, never from source.
   */
  readonly adminSecret: string;

  /** Optional Hasura role to assume, sent as `x-hasura-role`. Omitted = no header. */
  readonly role?: string;

  /**
   * Optional app id (the `source_account_id` column value), sent as
   * `x-hasura-source-account-id`. Omitted = no header.
   */
  readonly sourceAccountId?: string;

  /**
   * Optional extra request headers. The three admin headers above are reserved:
   * naming any of them here is a configuration error.
   */
  readonly headers?: Readonly<Record<string, string>>;
}

/**
 * AdminOnError — onError callback accepted by createAdminClient. Receives an
 * already-redacted AppError and the Operation (its context holds no secret).
 */
export type AdminOnError = OnError;

/** Config plus the optional error callback (kept off the shared config type). */
export type AdminClientOptions = AdminClientConfig & { readonly onError?: AdminOnError };
