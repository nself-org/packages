/**
 * Reminder Zod validation schemas.
 * SPORT: Part of @nself/ntask-core.
 */

import { z } from 'zod';

export const createReminderSchema = z.object({
  todo_id: z.uuid(),
  remind_at: z.iso.datetime({ offset: true }),
  channel: z.enum(['push', 'email', 'both']).optional(),
});

export const updateReminderSchema = z.object({
  remind_at: z.iso.datetime({ offset: true }).optional(),
  channel: z.enum(['push', 'email', 'both']).optional(),
});

export type CreateReminderData = z.infer<typeof createReminderSchema>;
export type UpdateReminderData = z.infer<typeof updateReminderSchema>;
