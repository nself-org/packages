/**
 * Result<T, E> — typed railway pattern for all nSelf API and service calls.
 *
 * Purpose: Eliminate untyped throw/catch chains; every fallible operation returns
 *          Result<T, E> so callers handle success and failure at the type boundary.
 * Inputs:  T — success value type; E — error type, defaults to AppError.
 * Outputs: Discriminated union Ok<T> | Err<E>; narrow with `result._tag === 'Ok'`.
 * Constraints: No runtime dependencies — this file is types + trivial constructors only.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/types (implementation)
 */

import type { AppError } from './errors.js';

/** Successful result wrapper. */
export type Ok<T> = { readonly _tag: 'Ok'; readonly value: T };

/** Error result wrapper. */
export type Err<E> = { readonly _tag: 'Err'; readonly error: E };

/**
 * Result<T, E> — the canonical return type for all fallible nSelf operations.
 * Narrow with `if (result._tag === 'Ok') { result.value } else { result.error }`.
 */
export type Result<T, E = AppError> = Ok<T> | Err<E>;

/** Construct a successful Result. */
export const ok = <T>(value: T): Ok<T> => ({ _tag: 'Ok', value });

/** Construct a failure Result. */
export const err = <E>(error: E): Err<E> => ({ _tag: 'Err', error });

/** Type guard: returns true if result is Ok. */
export const isOk = <T, E>(result: Ok<T> | Err<E>): result is Ok<T> =>
  result._tag === 'Ok';

/** Type guard: returns true if result is Err. */
export const isErr = <T, E>(result: Ok<T> | Err<E>): result is Err<E> =>
  result._tag === 'Err';
