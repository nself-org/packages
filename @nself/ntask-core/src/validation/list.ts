/**
 * List Zod validation schemas.
 * SPORT: Part of @nself/ntask-core.
 */

import { z } from 'zod';

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a 6-digit hex color (e.g. #6366f1)');

export const createListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  color: hexColorSchema.optional(),
  icon: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  group_id: z.string().uuid().optional(),
  position: z.number().int().min(0).optional(),
});

export const updateListSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  color: hexColorSchema.optional(),
  icon: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  position: z.number().int().min(0).optional(),
  group_id: z.string().uuid().nullable().optional(),
});

export type CreateListData = z.infer<typeof createListSchema>;
export type UpdateListData = z.infer<typeof updateListSchema>;
