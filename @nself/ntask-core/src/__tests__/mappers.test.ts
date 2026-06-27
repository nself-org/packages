import { describe, it, expect } from 'vitest';
import { mapGqlTaskToNpTask, mapGqlTaskToSummary } from '../mappers/task-mapper.js';
import { mapGqlListToNpList } from '../mappers/list-mapper.js';

describe('mapGqlTaskToNpTask', () => {
  it('maps all fields correctly', () => {
    const raw = {
      id: 'task-1',
      user_id: 'user-1',
      list_id: 'list-1',
      title: 'Test Task',
      description: 'A description',
      completed: false,
      is_public: false,
      priority: 'high',
      notes: 'some notes',
      due_date: '2026-07-01T10:00:00Z',
      position: 3,
      source_account_id: 'primary',
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-02T00:00:00Z',
      requires_approval: false,
      requires_photo: false,
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      rejection_reason: null,
    };

    const task = mapGqlTaskToNpTask(raw);
    expect(task.id).toBe('task-1');
    expect(task.priority).toBe('high');
    expect(task.due_date).toBe('2026-07-01T10:00:00Z');
    expect(task.list_id).toBe('list-1');
  });

  it('normalizes unknown priority to none', () => {
    const raw = { id: 'x', priority: 'critical' };
    const task = mapGqlTaskToNpTask(raw);
    expect(task.priority).toBe('none');
  });

  it('handles missing list_id as null', () => {
    const raw = { id: 'x', list_id: null };
    const task = mapGqlTaskToNpTask(raw);
    expect(task.list_id).toBeNull();
  });
});

describe('mapGqlTaskToSummary', () => {
  it('returns only summary fields', () => {
    const raw = {
      id: 'task-1',
      title: 'Summary Task',
      completed: true,
      priority: 'urgent',
      due_date: null,
      position: 1,
      source_account_id: 'primary',
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
    };

    const summary = mapGqlTaskToSummary(raw);
    expect(summary.id).toBe('task-1');
    expect(summary.completed).toBe(true);
    expect(summary.priority).toBe('urgent');
  });
});

describe('mapGqlListToNpList', () => {
  it('maps all list fields', () => {
    const raw = {
      id: 'list-1',
      user_id: 'user-1',
      title: 'My List',
      description: '',
      color: '#6366f1',
      icon: 'list',
      is_default: false,
      position: 0,
      group_id: null,
      source_account_id: 'primary',
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
    };

    const list = mapGqlListToNpList(raw);
    expect(list.id).toBe('list-1');
    expect(list.color).toBe('#6366f1');
    expect(list.group_id).toBeNull();
  });

  it('uses color default when missing', () => {
    const raw = { id: 'x', user_id: 'u' };
    const list = mapGqlListToNpList(raw);
    expect(list.color).toBe('#6366f1');
  });
});
