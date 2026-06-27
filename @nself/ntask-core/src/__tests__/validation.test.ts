import { describe, it, expect } from 'vitest';
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  createListSchema,
  updateListSchema,
  createSubtaskSchema,
  createCommentSchema,
  createReminderSchema,
  createTagSchema,
} from '../validation/index.js';
import { validate } from '../validation/helpers.js';
import { isOk, isErr } from '@nself/errors';

describe('createTaskSchema', () => {
  it('accepts valid input', () => {
    const r = createTaskSchema.safeParse({
      list_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'My task',
      priority: 'high',
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty title', () => {
    const r = createTaskSchema.safeParse({
      list_id: '550e8400-e29b-41d4-a716-446655440000',
      title: '',
    });
    expect(r.success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const r = createTaskSchema.safeParse({
      list_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      priority: 'critical',
    });
    expect(r.success).toBe(false);
  });

  it('rejects invalid list_id', () => {
    const r = createTaskSchema.safeParse({ list_id: 'not-a-uuid', title: 'Test' });
    expect(r.success).toBe(false);
  });
});

describe('createListSchema', () => {
  it('accepts valid input', () => {
    const r = createListSchema.safeParse({ title: 'My List', color: '#ff6600' });
    expect(r.success).toBe(true);
  });

  it('rejects invalid hex color', () => {
    const r = createListSchema.safeParse({ title: 'My List', color: 'red' });
    expect(r.success).toBe(false);
  });

  it('accepts missing color (optional)', () => {
    const r = createListSchema.safeParse({ title: 'No Color' });
    expect(r.success).toBe(true);
  });
});

describe('taskIdSchema', () => {
  it('accepts valid UUID', () => {
    expect(taskIdSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
  });

  it('rejects non-UUID', () => {
    expect(taskIdSchema.safeParse('not-a-uuid').success).toBe(false);
  });
});

describe('createSubtaskSchema', () => {
  it('accepts valid subtask', () => {
    const r = createSubtaskSchema.safeParse({
      todo_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Subtask',
    });
    expect(r.success).toBe(true);
  });
});

describe('createCommentSchema', () => {
  it('accepts valid comment', () => {
    const r = createCommentSchema.safeParse({
      todo_id: '550e8400-e29b-41d4-a716-446655440000',
      body: 'Hello!',
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty body', () => {
    const r = createCommentSchema.safeParse({
      todo_id: '550e8400-e29b-41d4-a716-446655440000',
      body: '',
    });
    expect(r.success).toBe(false);
  });
});

describe('createReminderSchema', () => {
  it('accepts valid reminder', () => {
    const r = createReminderSchema.safeParse({
      todo_id: '550e8400-e29b-41d4-a716-446655440000',
      remind_at: '2026-07-01T10:00:00Z',
      channel: 'push',
    });
    expect(r.success).toBe(true);
  });

  it('rejects invalid datetime', () => {
    const r = createReminderSchema.safeParse({
      todo_id: '550e8400-e29b-41d4-a716-446655440000',
      remind_at: 'not-a-date',
    });
    expect(r.success).toBe(false);
  });
});

describe('createTagSchema', () => {
  it('accepts valid tag', () => {
    const r = createTagSchema.safeParse({ name: 'work', color: '#3b82f6' });
    expect(r.success).toBe(true);
  });

  it('rejects invalid color', () => {
    const r = createTagSchema.safeParse({ name: 'work', color: 'blue' });
    expect(r.success).toBe(false);
  });
});

describe('validate helper', () => {
  it('returns Ok on valid data', () => {
    const result = validate(createListSchema, { title: 'Test List' });
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.title).toBe('Test List');
    }
  });

  it('returns Err with ValidationError on invalid data', () => {
    const result = validate(createTaskSchema, { list_id: 'bad', title: '' });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('validation_error');
      expect(result.error.status).toBe(422);
    }
  });
});
