/**
 * TaskError — domain-specific error extending @nself/errors AppError.
 * Purpose: Typed task/list operation failures with domain context.
 * Inputs: TaskErrorCode discriminant, optional taskId/listId context.
 * Outputs: TaskError interface, TaskErrorCode union, 3 type guard functions.
 * Constraints: Must be structurally assignable to AppError from @nself/errors.
 * SPORT: Part of @nself/ntask-core.
 */

import type { AppError, AppErrorCode } from '@nself/errors';

/** Domain-specific error codes for task operations. */
export type TaskErrorCode =
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR';

/**
 * TaskError — a plain object structurally compatible with AppError,
 * extended with task-domain context fields.
 * We use a concrete object type rather than `extends AppError` because
 * AppError is a discriminated union (not a single interface).
 */
export interface TaskError {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly status: number;
  readonly taskCode: TaskErrorCode;
  readonly taskId?: string;
  readonly listId?: string;
}

/** Verify TaskError is assignable to AppError at type level. */
type _AssignabilityCheck = TaskError extends AppError ? true : false;

/** Type guard: true if the unknown value is a TaskError. */
export const isTaskError = (e: unknown): e is TaskError =>
  typeof e === 'object' &&
  e !== null &&
  'taskCode' in e &&
  typeof (e as TaskError).taskCode === 'string';

/** Type guard: true if the error is a not-found TaskError. */
export const isTaskNotFound = (
  e: unknown,
): e is TaskError & { taskCode: 'NOT_FOUND' } =>
  isTaskError(e) && e.taskCode === 'NOT_FOUND';

/** Type guard: true if the error is a conflict TaskError. */
export const isTaskConflict = (
  e: unknown,
): e is TaskError & { taskCode: 'CONFLICT' } =>
  isTaskError(e) && e.taskCode === 'CONFLICT';

/**
 * Create a TaskError with the given code and message.
 * Maps TaskErrorCode to a compatible AppError code so it works in Result<T, AppError> chains.
 */
export const createTaskError = (
  taskCode: TaskErrorCode,
  message: string,
  context?: { taskId?: string; listId?: string },
): TaskError => {
  const appErrorCode: AppErrorCode =
    taskCode === 'NOT_FOUND'
      ? 'not_found'
      : taskCode === 'PERMISSION_DENIED'
        ? 'forbidden'
        : taskCode === 'VALIDATION_ERROR'
          ? 'validation_error'
          : 'internal';

  const status =
    appErrorCode === 'not_found' ? 404
    : appErrorCode === 'forbidden' ? 403
    : appErrorCode === 'validation_error' ? 422
    : 500;

  return {
    code: appErrorCode,
    message,
    status,
    taskCode,
    ...context,
  };
};
