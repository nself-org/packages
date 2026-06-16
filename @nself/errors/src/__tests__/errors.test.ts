/**
 * Unit tests for @nself/errors Result<T,E> pattern and AppError types.
 *
 * Coverage:
 * - Result constructors (ok/err)
 * - Type guards (isOk/isErr)
 * - Helper functions (mapResult/chainResult/getOrElse/match)
 * - AppError discriminated union narrowing
 * - Error code type guards
 */

import { describe, it, expect } from 'vitest';
import {
  ok,
  err,
  isOk,
  isErr,
  mapResult,
  chainResult,
  getOrElse,
  match,
  isAuthFailedError,
  isNotFoundError,
  isValidationError,
  isForbiddenError,
  isRateLimitedError,
  isInternalError,
  isLicenseRequiredError,
  isTenantMismatchError,
  isAppError,
  isValidErrorCode,
  type Result,
  type AppError,
  type AppErrorCode,
} from '../index.js';

describe('@nself/errors', () => {
  describe('Result constructors', () => {
    it('ok() creates an Ok result', () => {
      const result = ok(42);
      expect(result._tag).toBe('Ok');
      expect(result.value).toBe(42);
    });

    it('err() creates an Err result', () => {
      const error = { code: 'auth_failed' as const, message: 'Invalid token', status: 401 };
      const result = err(error);
      expect(result._tag).toBe('Err');
      expect(result.error).toEqual(error);
    });
  });

  describe('Type guards', () => {
    it('isOk() returns true for Ok results', () => {
      const result = ok(42);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });

    it('isOk() returns false for Err results', () => {
      const result = err({ code: 'internal' as const, message: 'Error', status: 500 });
      expect(isOk(result)).toBe(false);
    });

    it('isErr() returns true for Err results', () => {
      const error = { code: 'auth_failed' as const, message: 'Invalid token', status: 401 };
      const result = err(error);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe('auth_failed');
      }
    });

    it('isErr() returns false for Ok results', () => {
      const result = ok(42);
      expect(isErr(result)).toBe(false);
    });
  });

  describe('mapResult helper', () => {
    it('transforms Ok value with a function', () => {
      const result = ok(5);
      const mapped = mapResult(result, (n) => n * 2);
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(10);
      }
    });

    it('preserves Err when mapping', () => {
      const error = { code: 'validation_error' as const, message: 'Invalid', status: 422 };
      const result = err(error);
      const mapped = mapResult(result, (n: number) => n * 2);
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error.code).toBe('validation_error');
      }
    });
  });

  describe('chainResult helper', () => {
    it('sequences Ok results', () => {
      const result = ok(5);
      const chained = chainResult(result, (n) => ok(n * 2));
      expect(isOk(chained)).toBe(true);
      if (isOk(chained)) {
        expect(chained.value).toBe(10);
      }
    });

    it('short-circuits on Err', () => {
      const error = { code: 'not_found' as const, message: 'Not found', status: 404 };
      const result = err(error);
      const chained = chainResult(result, (n: number) => ok(n * 2));
      expect(isErr(chained)).toBe(true);
      if (isErr(chained)) {
        expect(chained.error.code).toBe('not_found');
      }
    });

    it('allows downstream error conversion', () => {
      const result = ok(5);
      const downstreamError = { code: 'rate_limited' as const, message: 'Rate limited', status: 429 };
      const chained = chainResult(result, () => err(downstreamError));
      expect(isErr(chained)).toBe(true);
      if (isErr(chained)) {
        expect(chained.error.code).toBe('rate_limited');
      }
    });
  });

  describe('getOrElse helper', () => {
    it('returns value from Ok', () => {
      const result = ok(42);
      const value = getOrElse(result, 0);
      expect(value).toBe(42);
    });

    it('returns fallback from Err', () => {
      const error = { code: 'internal' as const, message: 'Error', status: 500 };
      const result = err(error);
      const value = getOrElse(result, 0);
      expect(value).toBe(0);
    });
  });

  describe('match helper', () => {
    it('applies onOk function for Ok results', () => {
      const result = ok(42);
      const message = match(
        result,
        (v) => `Success: ${v}`,
        () => 'Failure',
      );
      expect(message).toBe('Success: 42');
    });

    it('applies onErr function for Err results', () => {
      const error = { code: 'auth_failed' as const, message: 'Invalid token', status: 401 };
      const result = err(error);
      const message = match(
        result,
        () => 'Success',
        (e) => `Failure: ${e.code}`,
      );
      expect(message).toBe('Failure: auth_failed');
    });
  });

  describe('Error type guards', () => {
    it('isAuthFailedError() identifies auth_failed errors', () => {
      const error: AppError = { code: 'auth_failed', message: 'Invalid token', status: 401 };
      expect(isAuthFailedError(error)).toBe(true);
      expect(isNotFoundError(error)).toBe(false);
    });

    it('isNotFoundError() identifies not_found errors', () => {
      const error: AppError = { code: 'not_found', message: 'Not found', status: 404 };
      expect(isNotFoundError(error)).toBe(true);
      expect(isAuthFailedError(error)).toBe(false);
    });

    it('isValidationError() identifies validation_error errors', () => {
      const error: AppError = {
        code: 'validation_error',
        message: 'Invalid input',
        status: 422,
        fields: { email: 'Invalid email format' },
      };
      expect(isValidationError(error)).toBe(true);
      expect(isAuthFailedError(error)).toBe(false);
    });

    it('guards return false for non-AppError objects', () => {
      const notAnError = { message: 'Just a string' };
      expect(isAuthFailedError(notAnError)).toBe(false);
      expect(isValidationError(notAnError)).toBe(false);
    });

    it('guards handle null and undefined', () => {
      expect(isAuthFailedError(null)).toBe(false);
      expect(isAuthFailedError(undefined)).toBe(false);
      expect(isNotFoundError(null)).toBe(false);
    });

    it('isForbiddenError() identifies forbidden errors', () => {
      const error: AppError = { code: 'forbidden', message: 'Forbidden', status: 403 };
      expect(isForbiddenError(error)).toBe(true);
      expect(isAuthFailedError(error)).toBe(false);
    });

    it('isRateLimitedError() identifies rate_limited errors', () => {
      const error: AppError = { code: 'rate_limited', message: 'Too many requests', status: 429 };
      expect(isRateLimitedError(error)).toBe(true);
      expect(isForbiddenError(error)).toBe(false);
    });

    it('isInternalError() identifies internal errors', () => {
      const error: AppError = { code: 'internal', message: 'Internal server error', status: 500 };
      expect(isInternalError(error)).toBe(true);
      expect(isRateLimitedError(error)).toBe(false);
    });

    it('isLicenseRequiredError() identifies license_required errors', () => {
      const error: AppError = { code: 'license_required', message: 'License required', status: 402, requiredBundle: 'nclaw' };
      expect(isLicenseRequiredError(error)).toBe(true);
      expect(isInternalError(error)).toBe(false);
    });

    it('isTenantMismatchError() identifies tenant_mismatch errors', () => {
      const error: AppError = { code: 'tenant_mismatch', message: 'Tenant mismatch', status: 403 };
      expect(isTenantMismatchError(error)).toBe(true);
      expect(isLicenseRequiredError(error)).toBe(false);
    });

    it('isAppError() validates full AppError shape', () => {
      const error: AppError = { code: 'auth_failed', message: 'Unauthorized', status: 401 };
      expect(isAppError(error)).toBe(true);
      expect(isAppError({ code: 'auth_failed' })).toBe(false); // missing message+status
      expect(isAppError(null)).toBe(false);
      expect(isAppError('string')).toBe(false);
      expect(isAppError({ code: 42, message: 'x', status: 500 })).toBe(false); // non-string code
    });

    it('isValidErrorCode() validates all AppErrorCode values', () => {
      const validCodes: AppErrorCode[] = [
        'auth_failed', 'not_found', 'forbidden', 'validation_error',
        'rate_limited', 'internal', 'license_required', 'tenant_mismatch',
      ];
      for (const code of validCodes) {
        expect(isValidErrorCode(code)).toBe(true);
      }
      expect(isValidErrorCode('unknown_code')).toBe(false);
      expect(isValidErrorCode(null)).toBe(false);
      expect(isValidErrorCode(42)).toBe(false);
    });
  });

  describe('Complex scenarios', () => {
    it('chains multiple operations with Result', () => {
      const fetchUser = (): Result<{ id: number; name: string }> =>
        ok({ id: 1, name: 'Alice' });

      const fetchPosts = (
        userId: number,
      ): Result<Array<{ id: number; title: string }>> =>
        userId === 1 ? ok([{ id: 1, title: 'Hello' }]) : err({
          code: 'not_found' as const,
          message: 'User not found',
          status: 404,
        });

      const result = chainResult(fetchUser(), (user) => fetchPosts(user.id));

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].title).toBe('Hello');
      }
    });

    it('handles error conversion in chains', () => {
      const divide = (a: number, b: number): Result<number> =>
        b === 0
          ? err({
            code: 'validation_error' as const,
            message: 'Cannot divide by zero',
            status: 422,
          })
          : ok(a / b);

      const result = chainResult(divide(10, 2), (quotient) =>
        divide(quotient, 0),
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe('validation_error');
      }
    });
  });
});
