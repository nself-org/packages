/**
 * Auth types — Session, User, and JWTPayload for all nSelf surfaces.
 *
 * Purpose: Canonical auth contracts imported by every app that reads session
 *          state, validates tokens, or calls the nSelf auth plugin.
 * Inputs:  None — pure type definitions.
 * Outputs: Session, User, UserRole, JWTPayload types.
 * Constraints: - tenant_id is optional; it is ONLY present for Cloud SaaS sessions.
 *              - source_account_id is always present; defaults to 'primary' for
 *                single-user self-hosted deploys (multi-app isolation convention).
 *              - JWTPayload follows RFC 7519 claim names (sub, iat, exp).
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/types (implementation)
 */

/** Role assigned to a nSelf user. */
export type UserRole = 'owner' | 'admin' | 'member' | 'guest';

/** Authenticated user identity — minimal shape shared across surfaces. */
export interface User {
  /** Stable UUID assigned at registration; never recycled. */
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  /** Display name; may be absent for anonymous/guest sessions. */
  readonly name?: string;
}

/**
 * Session — the live authentication context for a request or UI component.
 *
 * Both source_account_id (multi-app isolation) and tenant_id (Cloud SaaS
 * multi-tenancy) may coexist when a paying Cloud customer runs multiple apps
 * within a single nSelf deploy. They solve distinct scoping problems; see
 * multi-tenant.ts for the hard-rule distinction.
 */
export interface Session {
  /** Opaque session identifier (UUID). */
  readonly session_id: string;
  readonly user_id: string;
  /**
   * Multi-App Isolation identifier.
   * Defaults to 'primary' for single-app self-hosted deploys.
   * See: docs/architecture/multi-tenant-conventions.md §Convention A.
   */
  readonly source_account_id: string;
  /**
   * Cloud SaaS tenant UUID.
   * Present ONLY when the session belongs to a paying nSelf Cloud customer.
   * NEVER use this for multi-app isolation within a single deploy.
   * See: docs/architecture/multi-tenant-conventions.md §Convention B.
   */
  readonly tenant_id?: string;
  /** ISO 8601 timestamp at which this session expires. */
  readonly expires_at: string;
  readonly user: User;
}

/**
 * JWTPayload — decoded claims from an nSelf-issued JWT.
 *
 * Standard RFC 7519 fields plus nSelf-specific claims. Consumers must
 * verify `exp > Date.now() / 1000` before trusting any claim.
 */
export interface JWTPayload {
  /** Subject — user_id UUID. */
  readonly sub: string;
  /** Issued-at — Unix timestamp (seconds). */
  readonly iat: number;
  /** Expiry — Unix timestamp (seconds). */
  readonly exp: number;
  /**
   * Multi-App Isolation identifier (forwarded from session to JWT).
   * See source_account_id on Session.
   */
  readonly source_account_id: string;
  /**
   * Cloud SaaS tenant UUID (forwarded from session to JWT).
   * Present only for Cloud SaaS customers.
   */
  readonly tenant_id?: string;
}
