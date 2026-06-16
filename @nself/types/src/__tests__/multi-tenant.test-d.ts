/**
 * Type-level tests for multi-tenant.ts structural distinctness.
 *
 * These are compile-time assertions — if the types are wrong, tsc fails.
 * Run: pnpm --filter @nself/types exec tsc --noEmit
 *
 * QA-A acceptance: CloudTenancy must NOT be assignable to MultiAppIsolation.
 */

import type {
  MultiAppIsolation,
  CloudTenancy,
  WithIsolation,
  WithTenancy,
  AssertDistinct,
} from '../multi-tenant.js';

// ── Assertion 1: AssertDistinct must be `true`, not `never` ──────────────────
// If CloudTenancy were assignable to MultiAppIsolation, AssertDistinct = never,
// and this line would produce: "Type 'never' is not assignable to type 'true'."
const _check: AssertDistinct = true;

// ── Assertion 2: CloudTenancy does NOT extend MultiAppIsolation ──────────────
// CloudTenancy has `tenant_id`; MultiAppIsolation requires `source_account_id`.
// Since CloudTenancy lacks source_account_id, it cannot extend MultiAppIsolation.
// `false` is the expected evaluation — if this ever becomes `true`, something changed.
type _CloudHasNoSourceId = CloudTenancy extends MultiAppIsolation ? true : false;
const _cloudCheck: _CloudHasNoSourceId = false;   // must be false — enforces hard rule

// ── Assertion 3: MultiAppIsolation does NOT extend CloudTenancy ──────────────
// MultiAppIsolation has `source_account_id`; CloudTenancy requires `tenant_id`.
// Since MultiAppIsolation lacks tenant_id, it cannot extend CloudTenancy.
type _MultiAppHasNoTenantId = MultiAppIsolation extends CloudTenancy ? true : false;
const _multiAppCheck: _MultiAppHasNoTenantId = false;  // must be false

// ── Assertion 4: WithIsolation correctly extends the base type ───────────────
interface BaseRow { id: string }
type IsolatedRow = WithIsolation<BaseRow>;
declare const isolated: IsolatedRow;
const _id: string = isolated.id;                    // from BaseRow
const _sai: string = isolated.source_account_id;   // from MultiAppIsolation

// ── Assertion 5: WithTenancy correctly extends the base type ─────────────────
type TenantedRow = WithTenancy<BaseRow>;
declare const tenanted: TenantedRow;
const _tid: string = tenanted.tenant_id;            // from CloudTenancy

// Suppress unused variable warnings (compile-time checks only)
void _check; void _cloudCheck; void _multiAppCheck; void _id; void _sai; void _tid;
