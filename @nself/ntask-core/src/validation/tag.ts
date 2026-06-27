/**
 * Tag Zod validation schemas.
 * SPORT: Part of @nself/ntask-core.
 */

import { z } from 'zod';

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a 6-digit hex color');

export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50),
  color: hexColorSchema,
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: hexColorSchema.optional(),
});

export type CreateTagData = z.infer<typeof createTagSchema>;
export type UpdateTagData = z.infer<typeof updateTagSchema>;
