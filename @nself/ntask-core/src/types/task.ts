/**
 * NpTask — canonical ɳTask todo domain type.
 * Purpose: Replaces three independent type definitions across mobile, web, and future surfaces.
 * Inputs: Hasura GraphQL np_todos rows (via mapGqlTaskToNpTask).
 * Outputs: Typed domain object consumed by all 4 surfaces.
 * Constraints: Field names match np_todos columns exactly; no camelCase translation here
 *              (graphql codegen handles the GQL layer; mappers translate).
 * SPORT: Part of @nself/ntask-core.
 */

import type { Priority } from './enums.js';

/** Full np_todos row representation (all fields). */
export interface NpTask {
  readonly id: string;
  readonly user_id: string;
  readonly list_id: string | null;
  readonly title: string;
  readonly description: string;
  readonly completed: boolean;
  readonly is_public: boolean;
  readonly priority: Priority;
  readonly notes: string;
  readonly due_date: string | null;
  readonly position: number;
  readonly source_account_id: string;
  readonly created_at: string;
  readonly updated_at: string;
  // Approval fields (from migration 002)
  readonly requires_approval: boolean;
  readonly requires_photo: boolean;
  readonly approved_by: string | null;
  readonly approved_at: string | null;
  readonly rejected_by: string | null;
  readonly rejected_at: string | null;
  readonly rejection_reason: string | null;
}

/** Minimal task — for list views (omits heavy/nullable fields). */
export type NpTaskSummary = Pick<
  NpTask,
  | 'id'
  | 'list_id'
  | 'title'
  | 'completed'
  | 'priority'
  | 'due_date'
  | 'position'
  | 'source_account_id'
  | 'created_at'
  | 'updated_at'
>;

/** Input for creating a new task. */
export interface CreateTaskInput {
  readonly list_id: string;
  readonly title: string;
  readonly priority?: Priority;
  readonly description?: string;
  readonly notes?: string;
  readonly due_date?: string;
  readonly position?: number;
  readonly requires_approval?: boolean;
  readonly requires_photo?: boolean;
}

/** Input for updating an existing task. All fields optional. */
export type UpdateTaskInput = Partial<
  Pick<
    NpTask,
    | 'title'
    | 'description'
    | 'completed'
    | 'priority'
    | 'notes'
    | 'due_date'
    | 'position'
    | 'list_id'
    | 'requires_approval'
    | 'requires_photo'
  >
>;
