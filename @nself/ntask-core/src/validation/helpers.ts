/**
 * validate<T> — wraps Zod safeParse into Result<T, AppError>.
 * Purpose: Unified validation entry point; consumers never import zod directly.
 * Inputs: ZodType schema, unknown data.
 * Outputs: Result<T, AppError> — Ok(data) or Err(ValidationError).
 * SPORT: Part of @nself/ntask-core.
 */

import { type ZodType, type ZodError } from 'zod';
import type { AppError } from '@nself/errors';
import { ok, err } from '@nself/errors';
import type { Result } from '@nself/errors';

/** Serialize Zod field errors into the AppError.fields format. */
const zodErrorToFields = (
  zodError: ZodError,
): Readonly<Record<string, string>> => {
  const fields: Record<string, string> = {};
  for (const issue of zodError.issues) {
    const path = issue.path.join('.');
    fields[path || '_'] = issue.message;
  }
  return fields;
};

/**
 * validate — parse unknown data with a Zod schema, returning a typed Result.
 * @param schema - Any Zod schema.
 * @param data - Raw unknown input (form data, API payload, etc.).
 * @returns Ok(parsedData) or Err(ValidationError).
 */
export const validate = <T>(
  schema: ZodType<T>,
  data: unknown,
): Result<T, AppError> => {
  const result = schema.safeParse(data);
  if (result.success) {
    return ok(result.data);
  }
  // Build a ValidationError-shaped object and cast to AppError (which includes ValidationError)
  const validationError = {
    code: 'validation_error' as const,
    message: 'Validation failed',
    status: 422 as const,
    fields: zodErrorToFields(result.error),
  } satisfies AppError;
  return err(validationError);
};
