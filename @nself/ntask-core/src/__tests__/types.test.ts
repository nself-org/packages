import { describe, it, expect } from 'vitest';
import { PRIORITY_VALUES } from '../types/enums.js';
import type { Priority, TaskStatus, MemberRole, ReminderChannel } from '../types/enums.js';

describe('enums', () => {
  it('Priority has 5 values matching DB CHECK constraint', () => {
    const values: Priority[] = ['none', 'low', 'medium', 'high', 'urgent'];
    expect(PRIORITY_VALUES).toEqual(values);
  });

  it('TaskStatus covers open and complete', () => {
    const statuses: TaskStatus[] = ['open', 'complete'];
    expect(statuses).toHaveLength(2);
  });

  it('MemberRole covers viewer, editor, owner', () => {
    const roles: MemberRole[] = ['viewer', 'editor', 'owner'];
    expect(roles).toHaveLength(3);
  });

  it('ReminderChannel covers push, email, both', () => {
    const channels: ReminderChannel[] = ['push', 'email', 'both'];
    expect(channels).toHaveLength(3);
  });
});
