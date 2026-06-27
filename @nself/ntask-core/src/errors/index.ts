export type { TaskError, TaskErrorCode } from './task-error.js';
export { isTaskError, isTaskNotFound, isTaskConflict, createTaskError } from './task-error.js';
// Re-export AppError utilities for consumer convenience
export type { AppError, Result, Ok, Err } from '@nself/errors';
export { ok, err, isOk, isErr, mapResult } from '@nself/errors';
