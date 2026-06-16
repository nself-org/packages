/**
 * Type guards for AppError variants.
 *
 * Purpose: Predicate functions to narrow AppError unions in pattern matches.
 * Inputs:  Unknown value (typically from a result.error).
 * Outputs: Boolean type guard; narrows error type in `if` branches.
 * Constraints: Must handle non-AppError inputs gracefully (return false).
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/errors (implementation)
 */
/** Type guard: is this an AuthFailedError? */
export const isAuthFailedError = (error) => error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'auth_failed';
/** Type guard: is this a NotFoundError? */
export const isNotFoundError = (error) => error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'not_found';
/** Type guard: is this a ForbiddenError? */
export const isForbiddenError = (error) => error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'forbidden';
/** Type guard: is this a ValidationError? */
export const isValidationError = (error) => error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'validation_error';
/** Type guard: is this a RateLimitedError? */
export const isRateLimitedError = (error) => error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'rate_limited';
/** Type guard: is this an InternalError? */
export const isInternalError = (error) => error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'internal';
/** Type guard: is this a LicenseRequiredError? */
export const isLicenseRequiredError = (error) => error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'license_required';
/** Type guard: is this a TenantMismatchError? */
export const isTenantMismatchError = (error) => error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'tenant_mismatch';
/** Type guard: is this an AppError (any variant)? */
export const isAppError = (error) => error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error &&
    'status' in error &&
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof error.status === 'number';
/** Check if error code is a valid AppErrorCode. */
export const isValidErrorCode = (code) => code === 'auth_failed' ||
    code === 'not_found' ||
    code === 'forbidden' ||
    code === 'validation_error' ||
    code === 'rate_limited' ||
    code === 'internal' ||
    code === 'license_required' ||
    code === 'tenant_mismatch';
//# sourceMappingURL=guards.js.map