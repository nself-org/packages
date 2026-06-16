# @nself/errors

Result<T,E> typed-error pattern and AppError discriminated union for nSelf.

## Overview

This package provides:
- **Result<T, E>** — a discriminated union for composable error handling
- **AppError** — a canonical discriminated union of all nSelf application error types
- **Type guards** — narrow error variants safely
- **Helper functions** — chain, map, and match on Results

No untyped throws anywhere in the nSelf stack. Every fallible operation returns `Result<T, E>`.

## Usage

### Basic Result Operations

```typescript
import { ok, err, isOk, isErr } from '@nself/errors';

const divide = (a: number, b: number) => {
  if (b === 0) {
    return err({ code: 'validation_error' as const, message: 'Cannot divide by zero', status: 422 });
  }
  return ok(a / b);
};

const result = divide(10, 2);

if (isOk(result)) {
  console.log('Result:', result.value); // 5
} else {
  console.log('Error:', result.error.message);
}
```

### Chaining Results

```typescript
import { chainResult } from '@nself/errors';

const fetchUser = () => ok({ id: 1, name: 'Alice' });
const fetchPosts = (userId: number) =>
  userId === 1 ? ok([{ id: 1, title: 'Hello' }]) : err(...);

const result = chainResult(fetchUser(), (user) => fetchPosts(user.id));
```

### Mapping Results

```typescript
import { mapResult } from '@nself/errors';

const result = ok(5);
const doubled = mapResult(result, (n) => n * 2); // ok(10)
```

### Pattern Matching

```typescript
import { match } from '@nself/errors';

const message = match(
  result,
  (value) => `Success: ${value}`,
  (error) => `Failed: ${error.message}`,
);
```

## Error Types

All errors extend the `AppError` discriminated union:

```typescript
type AppError =
  | AuthFailedError        // code: 'auth_failed', status: 401
  | NotFoundError          // code: 'not_found', status: 404
  | ForbiddenError         // code: 'forbidden', status: 403
  | ValidationError        // code: 'validation_error', status: 422
  | RateLimitedError       // code: 'rate_limited', status: 429
  | InternalError          // code: 'internal', status: 500
  | LicenseRequiredError   // code: 'license_required', status: 402
  | TenantMismatchError    // code: 'tenant_mismatch', status: 403
```

Each variant has an HTTP status code and a discriminant `code` field for narrowing.

### Type Guards

Safely narrow error variants:

```typescript
import {
  isValidationError,
  isAuthFailedError,
  isNotFoundError,
} from '@nself/errors';

if (isValidationError(error)) {
  console.log('Field errors:', error.fields);
} else if (isAuthFailedError(error)) {
  console.log('Auth failed:', error.status); // 401
} else if (isNotFoundError(error)) {
  console.log('Resource not found:', error.status); // 404
}
```

## API Reference

### Types

- `Result<T, E = AppError>` — Ok<T> | Err<E>
- `AppError` — union of all error types
- `AppErrorCode` — literal union of valid error codes

### Functions

- `ok<T>(value: T): Ok<T>` — wrap a success value
- `err<E>(error: E): Err<E>` — wrap an error
- `isOk<T, E>(result: Result<T, E>): result is Ok<T>` — type guard
- `isErr<T, E>(result: Result<T, E>): result is Err<E>` — type guard
- `mapResult<T, U, E>(result: Result<T, E>, fn: (v: T) => U): Result<U, E>` — transform Ok value
- `chainResult<T, U, E>(result: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E>` — flatMap
- `getOrElse<T, E>(result: Result<T, E>, fallback: T): T` — extract or default
- `match<T, E, U>(result, onOk, onErr): U` — pattern match both branches

### Type Guards

- `isAuthFailedError(error: unknown): error is AuthFailedError`
- `isNotFoundError(error: unknown): error is NotFoundError`
- `isForbiddenError(error: unknown): error is ForbiddenError`
- `isValidationError(error: unknown): error is ValidationError`
- `isRateLimitedError(error: unknown): error is RateLimitedError`
- `isInternalError(error: unknown): error is InternalError`
- `isLicenseRequiredError(error: unknown): error is LicenseRequiredError`
- `isTenantMismatchError(error: unknown): error is TenantMismatchError`
- `isAppError(error: unknown): error is AppError`
- `isValidErrorCode(code: unknown): code is AppErrorCode`

## Architecture

This package is zero-dependency and types-only at runtime. Used by all nSelf packages and app code to ensure type-safe error handling at every layer (backend, frontend, SDK).

No untyped throw/catch chains. Every fallible operation declares its error type in the signature.
