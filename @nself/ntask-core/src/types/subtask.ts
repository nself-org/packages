/**
 * NpSubtask — structured subtask (checklist item) linked to an np_todos row.
 * Note: The column is `is_done` (not `is_complete`) per migration 009.
 * SPORT: Part of @nself/ntask-core.
 */

export interface NpSubtask {
  readonly id: string;
  readonly todo_id: string;
  readonly title: string;
  readonly is_done: boolean;
  readonly position: number;
  readonly source_account_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CreateSubtaskInput {
  readonly todo_id: string;
  readonly title: string;
  readonly position?: number;
}

export type UpdateSubtaskInput = Partial<
  Pick<NpSubtask, 'title' | 'is_done' | 'position'>
>;
