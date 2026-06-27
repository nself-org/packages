import { describe, it, expect } from 'vitest';
import {
  GET_LIST_TODOS,
  CREATE_TODO,
  TOGGLE_TODO,
  DELETE_TODO,
  SUBSCRIBE_LIST_TODOS,
} from '../operations/tasks.js';
import { GET_LISTS, CREATE_LIST, UPDATE_LIST, DELETE_LIST } from '../operations/lists.js';
import { GET_SUBTASKS, CREATE_SUBTASK } from '../operations/subtasks.js';
import { GET_COMMENTS, CREATE_COMMENT } from '../operations/comments.js';
import { GET_TAGS, CREATE_TAG } from '../operations/tags.js';
import { GET_REMINDERS, CREATE_REMINDER } from '../operations/reminders.js';
import { GET_NOTIFICATIONS, REGISTER_DEVICE_TOKEN } from '../operations/collab.js';

const ops = [
  GET_LIST_TODOS, CREATE_TODO, TOGGLE_TODO, DELETE_TODO, SUBSCRIBE_LIST_TODOS,
  GET_LISTS, CREATE_LIST, UPDATE_LIST, DELETE_LIST,
  GET_SUBTASKS, CREATE_SUBTASK,
  GET_COMMENTS, CREATE_COMMENT,
  GET_TAGS, CREATE_TAG,
  GET_REMINDERS, CREATE_REMINDER,
  GET_NOTIFICATIONS, REGISTER_DEVICE_TOKEN,
];

describe('GraphQL operations', () => {
  it('are all defined non-empty strings', () => {
    for (const op of ops) {
      expect(typeof op).toBe('string');
      expect(op.trim().length).toBeGreaterThan(0);
    }
  });

  it('GET_LIST_TODOS contains np_todos and listId variable', () => {
    expect(GET_LIST_TODOS).toContain('np_todos');
    expect(GET_LIST_TODOS).toContain('listId');
  });

  it('CREATE_TODO is a mutation', () => {
    expect(CREATE_TODO).toContain('mutation');
  });

  it('SUBSCRIBE_LIST_TODOS is a subscription', () => {
    expect(SUBSCRIBE_LIST_TODOS).toContain('subscription');
  });

  it('GET_LISTS does not require variables', () => {
    expect(GET_LISTS).toContain('query GetLists');
  });
});
