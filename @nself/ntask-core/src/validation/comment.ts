/**
 * Comment Zod validation schemas.
 * SPORT: Part of @nself/ntask-core.
 */

import { z } from 'zod';

export const createCommentSchema = z.object({
  todo_id: z.string().uuid(),
  body: z.string().min(1, 'Comment body is required').max(10000),
  parent_comment_id: z.string().uuid().optional(),
  idempotency_key: z.string().max(100).optional(),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(10000),
});

export type CreateCommentData = z.infer<typeof createCommentSchema>;
export type UpdateCommentData = z.infer<typeof updateCommentSchema>;
