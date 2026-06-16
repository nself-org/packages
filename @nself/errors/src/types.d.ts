/**
 * AppError — discriminated union for all nSelf application errors.
 *
 * Purpose: Single canonical error type propagated through Result<T, AppError>
 *          across all nSelf surfaces (web, mobile, desktop, CLI SDK).
 * Inputs:  None — pure type definitions.
 * Outputs: AppError union, individual error tag types, and AppErrorCode literal union.
 * Constraints: 8 canonical error codes — do not add new codes here without a PCI;
 *              every code must map to an HTTP status in the `status` field.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/errors (implementation)
 */
/** Union of all canonical error code strings. */
export type AppErrorCode = 'auth_failed' | 'not_found' | 'forbidden' | 'validation_error' | 'rate_limited' | 'internal' | 'license_required' | 'tenant_mismatch';
/** Base shape shared by every AppError variant. */
interface AppErrorBase {
    readonly code: AppErrorCode;
    readonly message: string;
    /** HTTP status code equivalent — used when surfacing via REST or GraphQL extensions. */
    readonly status: number;
}
/** Authentication failure — token missing, expired, or invalid signature. */
export interface AuthFailedError extends AppErrorBase {
    readonly code: 'auth_failed';
    readonly status: 401;
}
/** Resource does not exist or caller is not allowed to know it exists. */
export interface NotFoundError extends AppErrorBase {
    readonly code: 'not_found';
    readonly status: 404;
}
/** Caller is authenticated but lacks permission for this resource. */
export interface ForbiddenError extends AppErrorBase {
    readonly code: 'forbidden';
    readonly status: 403;
}
/** Request payload failed schema or business-rule validation. */
export interface ValidationError extends AppErrorBase {
    readonly code: 'validation_error';
    readonly status: 422;
    /** Field-level detail map — key is field path, value is human-readable message. */
    readonly fields?: Readonly<Record<string, string>>;
}
/** Caller has exceeded rate limits; include retry-after when possible. */
export interface RateLimitedError extends AppErrorBase {
    readonly code: 'rate_limited';
    readonly status: 429;
    /** Epoch seconds at which the rate limit window resets. */
    readonly resetAt?: number;
}
/** Unhandled internal error — do NOT expose implementation detail in message. */
export interface InternalError extends AppErrorBase {
    readonly code: 'internal';
    readonly status: 500;
}
/**
 * The caller's license does not include the required bundle or plugin.
 * Surface: `nself license set <key>` prompt; include `bundleId` when known.
 */
export interface LicenseRequiredError extends AppErrorBase {
    readonly code: 'license_required';
    readonly status: 402;
    /** The bundle that would unlock this feature. Omit if unknown. */
    readonly bundleId?: string;
}
/**
 * tenant_id mismatch — a Cloud-tenancy row was accessed by a request whose
 * X-Hasura-Tenant-Id does not match the row's tenant_id. Hard rule violation.
 * See: docs/architecture/multi-tenant-conventions.md (nself project) §Convention B.
 */
export interface TenantMismatchError extends AppErrorBase {
    readonly code: 'tenant_mismatch';
    readonly status: 403;
}
/** Canonical application error union — use as the E parameter in Result<T, AppError>. */
export type AppError = AuthFailedError | NotFoundError | ForbiddenError | ValidationError | RateLimitedError | InternalError | LicenseRequiredError | TenantMismatchError;
export {};
//# sourceMappingURL=types.d.ts.map