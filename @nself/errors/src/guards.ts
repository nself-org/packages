/**
 * Type guards for AppError variants.
 *
 * Purpose: Predicate functions to narrow AppError unions in pattern matches.
 * Inputs:  Unknown value (typically from a result.error).
 * Outputs: Boolean type guard; narrows error type in `if` branches.
 * Constraints: Must handle non-AppError inputs gracefully (return false).
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/errors (implementation)
 */

import type {
  AppError,
  AppErrorCode,
  AuthFailedError,
  ForbiddenError,
  InternalError,
  LicenseRequiredError,
  NotFoundError,
  RateLimitedError,
  TenantMismatchError,
  ValidationError,
} from './types.js';

/** Type guard: is this an AuthFailedError? */
export const isAuthFailedError = (error: unknown): error is AuthFailedError =>
  error !== null &&
  typeof error === 'object' &&
  'code' in error &&
  (error as Record<string, unknown>).code === 'auth_failed';

/** Type guard: is this a NotFoundError? */
export const isNotFoundError = (error: unknown): error is NotFoundError =>
  error !== null &&
  typeof error === 'object' &&
  'code' in error &&
  (error as Record<string, unknown>).code === 'not_found';

/** Type guard: is this a ForbiddenError? */
export const isForbiddenError = (error: unknown): error is ForbiddenError =>
  error !== null &&
  typeof error === 'object' &&
  'code' in error &&
  (error as Record<string, unknown>).code === 'forbidden';

/** Type guard: is this a ValidationError? */
export const isValidationError = (error: unknown): error is ValidationError =>
  error !== null &&
  typeof error === 'object' &&
  'code' in error &&
  (error as Record<string, unknown>).code === 'validation_error';

/** Type guard: is this a RateLimitedError? */
export const isRateLimitedError = (error: unknown): error is RateLimitedError =>
  error !== null &&
  typeof error === 'object' &&
  'code' in error &&
  (error as Record<string, unknown>).code === 'rate_limited';

/** Type guard: is this an InternalError? */
export const isInternalError = (error: unknown): error is InternalError =>
  error !== null &&
  typeof error === 'object' &&
  'code' in error &&
  (error as Record<string, unknown>).code === 'internal';

/** Type guard: is this a LicenseRequiredError? */
export const isLicenseRequiredError = (
  error: unknown,
): error is LicenseRequiredError =>
  error !== null &&
  typeof error === 'object' &&
  'code' in error &&
  (error as Record<string, unknown>).code === 'license_required';

/** Type guard: is this a TenantMismatchError? */
export const isTenantMismatchError = (
  error: unknown,
): error is TenantMismatchError =>
  error !== null &&
  typeof error === 'object' &&
  'code' in error &&
  (error as Record<string, unknown>).code === 'tenant_mismatch';

/** Type guard: is this an AppError (any variant)? */
export const isAppError = (error: unknown): error is AppError =>
  error !== null &&
  typeof error === 'object' &&
  'code' in error &&
  'message' in error &&
  'status' in error &&
  typeof (error as Record<string, unknown>).code === 'string' &&
  typeof (error as Record<string, unknown>).message === 'string' &&
  typeof (error as Record<string, unknown>).status === 'number';

/** Check if error code is a valid AppErrorCode. */
export const isValidErrorCode = (code: unknown): code is AppErrorCode =>
  code === 'auth_failed' ||
  code === 'not_found' ||
  code === 'forbidden' ||
  code === 'validation_error' ||
  code === 'rate_limited' ||
  code === 'internal' ||
  code === 'license_required' ||
  code === 'tenant_mismatch';
