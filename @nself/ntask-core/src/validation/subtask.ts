/**
 * Subtask Zod validation schemas.
 * SPORT: Part of @nself/ntask-core.
 */

import { z } from 'zod';

export const createSubtaskSchema = z.object({
  todo_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(500),
  position: z.number().int().min(0).optional(),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  is_done: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export type CreateSubtaskData = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskData = z.infer<typeof updateSubtaskSchema>;
