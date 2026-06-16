/**
 * Multi-tenant type contracts — Multi-App Isolation vs Cloud Multi-Tenancy.
 *
 * Purpose: Enforce the Hard Rule that the two nSelf multi-tenancy mechanisms
 *          are structurally distinct and NOT interchangeable at the type level.
 *
 * THE HARD RULE (nSelf Multi-Tenant Convention Wall):
 *   ┌─────────────────────┬──────────────────────────────────┐
 *   │ MultiAppIsolation   │ source_account_id TEXT NOT NULL  │
 *   │ (Convention A)      │ DEFAULT 'primary'                │
 *   │                     │ → separates independent consumer │
 *   │                     │   apps within ONE nSelf deploy   │
 *   ├─────────────────────┼──────────────────────────────────┤
 *   │ CloudTenancy        │ tenant_id UUID                   │
 *   │ (Convention B)      │ → separates paying customers in  │
 *   │                     │   nSelf Cloud SaaS               │
 *   └─────────────────────┴──────────────────────────────────┘
 *
 *   Mixing them causes SILENT DATA LEAKS across paying customers.
 *   See: docs/architecture/multi-tenant-conventions.md (nself project)
 *
 * Inputs:  None — pure type definitions + compile-time assertion.
 * Outputs: MultiAppIsolation, CloudTenancy, WithIsolation<T>, WithTenancy<T>.
 * Constraints: The compile-time assertion below MUST remain — it enforces the
 *              structural distinctness that prevents accidental interchange.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/types (implementation)
 */

/**
 * Convention A: Multi-App Isolation.
 *
 * Attach to any row/request object that participates in multi-app isolation
 * within a single nSelf deploy (e.g. Flock + Veterans sharing one Postgres).
 *
 * Column: `source_account_id TEXT NOT NULL DEFAULT 'primary'`
 * RLS: PatternUserOwned / PatternPublic per cli/internal/database/rls_tenant.go
 * Plugin manifest: `{ "multiApp": { "supported": true, "isolation_column": "source_account_id" } }`
 */
export interface MultiAppIsolation {
  /**
   * The source account identifier.
   * - 'primary': single-app self-hosted deploy (default, always safe to use)
   * - '<slug>': named app within a shared deploy (e.g. 'unity-flock')
   */
  readonly source_account_id: string;
}

/**
 * Convention B: Cloud Multi-Tenancy.
 *
 * Attach to any row/request object that belongs to a paying nSelf Cloud
 * customer. The UUID maps to a tenant record created via `nself tenant create`.
 *
 * Column: `tenant_id UUID`
 * RLS: `{"tenant_id": {"_eq": "X-Hasura-Tenant-Id"}}` on every np_* table.
 * NEVER use for multi-app isolation within a single deploy.
 */
export interface CloudTenancy {
  /**
   * The tenant UUID for a paying Cloud customer.
   * NEVER default this to 'primary' or any string — it must be a real UUID
   * issued by `nself tenant create`.
   */
  readonly tenant_id: string;
}

/**
 * Utility: extend any row type with Multi-App Isolation columns.
 * Use for plugin table row interfaces that declare `multiApp.supported: true`.
 */
export type WithIsolation<T> = T & MultiAppIsolation;

/**
 * Utility: extend any row type with Cloud Tenancy columns.
 * Use for np_* tables that track per-customer Cloud SaaS metering.
 */
export type WithTenancy<T> = T & CloudTenancy;

/**
 * Compile-time assertion: CloudTenancy must NOT be assignable to MultiAppIsolation.
 *
 * If this type evaluates to `never`, the assertion fails and tsc will error,
 * enforcing the structural distinctness hard rule at build time.
 *
 * CloudTenancy has `tenant_id`; MultiAppIsolation has `source_account_id`.
 * They are structurally distinct — a CloudTenancy object cannot satisfy
 * MultiAppIsolation without also carrying source_account_id.
 */
export type AssertDistinct = CloudTenancy extends MultiAppIsolation ? never : true;

/**
 * Compile-time assertion materialised as a const — tsc evaluates this.
 * If AssertDistinct is `never`, this line errors: "Type 'never' is not
 * assignable to type 'true'."
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assertDistinct: AssertDistinct = true;
