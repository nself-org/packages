/**
 * @nself/gql — type contracts for the thin GraphQL client.
 *
 * Purpose: Defines the configuration contract and session-header types used by
 *          createNSelfClient. All surfaces (web, RN, Tauri) configure the client
 *          with the same interface; only the getSession() implementation differs.
 * Inputs:  Session (from @nself/types) — provides user_id, role, source_account_id,
 *          and optionally tenant_id.
 * Outputs: NSelfClientConfig, GetSessionFn, SessionHeaders.
 * Constraints:
 *   - getSession() MUST be async; never cached synchronously at module level.
 *   - useTenantIsolation is ONLY set for nSelf Cloud SaaS surfaces.
 *   - x-hasura-admin-secret is never part of SessionHeaders — server-side only.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/gql (client-implemented)
 */

import type { Session } from '@nself/types';

/**
 * GetSessionFn — the callback each app provides to read the current session.
 *
 * - Web: reads from /api/session endpoint (httpOnly cookie; never touches cookie directly)
 * - React Native: reads from SecureStore
 * - Tauri: reads from the OS keychain via the Tauri secure-storage plugin
 *
 * Returns null when the user is not authenticated or the session has expired.
 */
export type GetSessionFn = () => Promise<Session | null>;

/**
 * NSelfClientConfig — configuration passed to createNSelfClient.
 *
 * endpoint: Full URL to the Hasura GraphQL endpoint (e.g. https://api.example.com/v1/graphql).
 *           Comes from the HASURA_GRAPHQL_URL environment variable — the client
 *           does not default to any specific URL.
 * getSession: Async callback that returns the current Session or null.
 * useTenantIsolation: When true, the client injects x-hasura-tenant-id from
 *                     session.tenant_id if present. Set this ONLY on nSelf Cloud
 *                     SaaS surfaces. Never set for self-hosted deploys.
 */
export interface NSelfClientConfig {
  readonly endpoint: string;
  readonly getSession: GetSessionFn;
  /**
   * Only set for Cloud SaaS surfaces that use tenant_id multi-tenancy.
   * When true and session.tenant_id is set, x-hasura-tenant-id is injected.
   * @default false
   */
  readonly useTenantIsolation?: boolean;
}

/**
 * SessionHeaders — the x-hasura-* header bag built from a live Session.
 *
 * Always present: role, user-id, source-account-id.
 * Conditionally present: tenant-id (only when useTenantIsolation=true and session.tenant_id set).
 *
 * NOTE: x-hasura-admin-secret is deliberately absent. Admin-secret usage is
 * server-side only and must never appear in client-facing code.
 */
export interface SessionHeaders {
  readonly 'x-hasura-role': string;
  readonly 'x-hasura-user-id': string;
  readonly 'x-hasura-source-account-id': string;
  readonly 'x-hasura-tenant-id'?: string;
}
