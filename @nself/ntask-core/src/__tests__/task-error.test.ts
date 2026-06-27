import { describe, it, expect } from 'vitest';
import {
  isTaskError,
  isTaskNotFound,
  isTaskConflict,
  createTaskError,
} from '../errors/task-error.js';

describe('TaskError', () => {
  it('createTaskError creates a valid TaskError', () => {
    const e = createTaskError('NOT_FOUND', 'Task not found', { taskId: 'abc' });
    expect(e.taskCode).toBe('NOT_FOUND');
    expect(e.code).toBe('not_found');
    expect(e.status).toBe(404);
    expect(e.taskId).toBe('abc');
    expect(e.message).toBe('Task not found');
  });

  it('isTaskError returns true for TaskError', () => {
    const e = createTaskError('CONFLICT', 'Conflict');
    expect(isTaskError(e)).toBe(true);
  });

  it('isTaskError returns false for non-TaskError', () => {
    expect(isTaskError(null)).toBe(false);
    expect(isTaskError({ code: 'not_found' })).toBe(false);
    expect(isTaskError(new Error('x'))).toBe(false);
  });

  it('isTaskNotFound narrows correctly', () => {
    const e = createTaskError('NOT_FOUND', 'Not found');
    expect(isTaskNotFound(e)).toBe(true);
    const e2 = createTaskError('CONFLICT', 'Conflict');
    expect(isTaskNotFound(e2)).toBe(false);
  });

  it('isTaskConflict narrows correctly', () => {
    const e = createTaskError('CONFLICT', 'Conflict');
    expect(isTaskConflict(e)).toBe(true);
    const e2 = createTaskError('NOT_FOUND', 'Not found');
    expect(isTaskConflict(e2)).toBe(false);
  });

  it('PERMISSION_DENIED maps to forbidden', () => {
    const e = createTaskError('PERMISSION_DENIED', 'Denied');
    expect(e.code).toBe('forbidden');
    expect(e.status).toBe(403);
  });

  it('VALIDATION_ERROR maps to validation_error', () => {
    const e = createTaskError('VALIDATION_ERROR', 'Invalid');
    expect(e.code).toBe('validation_error');
    expect(e.status).toBe(422);
  });
});
