/**
 * @nself/errors — Result<T,E> typed-error pattern and AppError discriminated union.
 *
 * Purpose: Eliminate untyped throw/catch chains; every fallible operation returns
 *          Result<T, E> so callers handle success and failure at the type boundary.
 * Inputs:  T — success value type; E — error type (defaults to AppError).
 * Outputs: Discriminated union Ok<T> | Err<E>; helpers ok(), err(), isOk(), isErr();
 *          AppError and AppErrorCode types; type guards for each error variant.
 * Constraints: No runtime dependencies — this package is types + trivial helpers only.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/errors (implementation)
 */
export type { AppError, AppErrorCode, AuthFailedError, ForbiddenError, InternalError, LicenseRequiredError, NotFoundError, RateLimitedError, TenantMismatchError, ValidationError, } from './types.js';
export { isAppError, isAuthFailedError, isForbiddenError, isInternalError, isLicenseRequiredError, isNotFoundError, isRateLimitedError, isTenantMismatchError, isValidationError, isValidErrorCode, } from './guards.js';
import type { AppError } from './types.js';
/** Successful result wrapper. */
export type Ok<T> = {
    readonly _tag: 'Ok';
    readonly value: T;
};
/** Error result wrapper. */
export type Err<E> = {
    readonly _tag: 'Err';
    readonly error: E;
};
/**
 * Result<T, E> — the canonical return type for all fallible nSelf operations.
 * Narrow with `if (result._tag === 'Ok') { result.value } else { result.error }`.
 */
export type Result<T, E = AppError> = Ok<T> | Err<E>;
/** Construct a successful Result. */
export declare const ok: <T>(value: T) => Ok<T>;
/** Construct a failure Result. */
export declare const err: <E>(error: E) => Err<E>;
/** Type guard: returns true if result is Ok. */
export declare const isOk: <T, E>(result: Result<T, E>) => result is Ok<T>;
/** Type guard: returns true if result is Err. */
export declare const isErr: <T, E>(result: Result<T, E>) => result is Err<E>;
/**
 * mapResult — transform the success value, preserving errors.
 *
 * @param result The Result to map
 * @param fn Transform function applied to Ok value
 * @returns New Result with transformed value or original error
 */
export declare const mapResult: <T, U, E>(result: Result<T, E>, fn: (value: T) => U) => Result<U, E>;
/**
 * chainResult (flatMap) — sequence Result-returning operations.
 *
 * @param result The Result to chain
 * @param fn Function that takes Ok value and returns a new Result
 * @returns The chained Result, or original error
 */
export declare const chainResult: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>) => Result<U, E>;
/**
 * getOrElse — extract value from Ok, or provide a fallback for Err.
 *
 * @param result The Result to extract from
 * @param fallback Value to use if result is Err
 * @returns The Ok value, or the fallback value
 */
export declare const getOrElse: <T, E>(result: Result<T, E>, fallback: T) => T;
/**
 * match — pattern match on Result to handle both branches.
 *
 * @param result The Result to match
 * @param onOk Function to apply if result is Ok
 * @param onErr Function to apply if result is Err
 * @returns The result of the applied function
 */
export declare const match: <T, E, U>(result: Result<T, E>, onOk: (value: T) => U, onErr: (error: E) => U) => U;
//# sourceMappingURL=index.d.ts.map