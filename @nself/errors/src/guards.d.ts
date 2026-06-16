/**
 * Type guards for AppError variants.
 *
 * Purpose: Predicate functions to narrow AppError unions in pattern matches.
 * Inputs:  Unknown value (typically from a result.error).
 * Outputs: Boolean type guard; narrows error type in `if` branches.
 * Constraints: Must handle non-AppError inputs gracefully (return false).
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/errors (implementation)
 */
import type { AppError, AppErrorCode, AuthFailedError, ForbiddenError, InternalError, LicenseRequiredError, NotFoundError, RateLimitedError, TenantMismatchError, ValidationError } from './types.js';
/** Type guard: is this an AuthFailedError? */
export declare const isAuthFailedError: (error: unknown) => error is AuthFailedError;
/** Type guard: is this a NotFoundError? */
export declare const isNotFoundError: (error: unknown) => error is NotFoundError;
/** Type guard: is this a ForbiddenError? */
export declare const isForbiddenError: (error: unknown) => error is ForbiddenError;
/** Type guard: is this a ValidationError? */
export declare const isValidationError: (error: unknown) => error is ValidationError;
/** Type guard: is this a RateLimitedError? */
export declare const isRateLimitedError: (error: unknown) => error is RateLimitedError;
/** Type guard: is this an InternalError? */
export declare const isInternalError: (error: unknown) => error is InternalError;
/** Type guard: is this a LicenseRequiredError? */
export declare const isLicenseRequiredError: (error: unknown) => error is LicenseRequiredError;
/** Type guard: is this a TenantMismatchError? */
export declare const isTenantMismatchError: (error: unknown) => error is TenantMismatchError;
/** Type guard: is this an AppError (any variant)? */
export declare const isAppError: (error: unknown) => error is AppError;
/** Check if error code is a valid AppErrorCode. */
export declare const isValidErrorCode: (code: unknown) => code is AppErrorCode;
//# sourceMappingURL=guards.d.ts.map