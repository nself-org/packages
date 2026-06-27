/**
 * Task Zod validation schemas.
 * Purpose: Shared validation between mobile (extracted from apps/mobile/src/lib/validation.ts)
 *          and web (no prior validation). Both surfaces import from here.
 * Constraints: title max 500, notes max 10000; priority must match Priority union.
 * SPORT: Part of @nself/ntask-core.
 */

import { z } from 'zod';

export const prioritySchema = z.enum(['none', 'low', 'medium', 'high', 'urgent']);

export const taskIdSchema = z.string().uuid();

export const createTaskSchema = z.object({
  list_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or fewer'),
  priority: prioritySchema.optional(),
  description: z.string().max(10000).optional(),
  notes: z.string().max(10000).optional(),
  due_date: z.string().datetime({ offset: true }).nullable().optional(),
  position: z.number().int().min(0).optional(),
  requires_approval: z.boolean().optional(),
  requires_photo: z.boolean().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional(),
  completed: z.boolean().optional(),
  priority: prioritySchema.optional(),
  notes: z.string().max(10000).optional(),
  due_date: z.string().datetime({ offset: true }).nullable().optional(),
  position: z.number().int().min(0).optional(),
  list_id: z.string().uuid().optional(),
  requires_approval: z.boolean().optional(),
  requires_photo: z.boolean().optional(),
});

export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
