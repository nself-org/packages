/**
 * NpTag and NpTodoTag — structured tag taxonomy.
 * Replaces unstructured np_todos.tags TEXT[] (deprecated column).
 * SPORT: Part of @nself/ntask-core.
 */

export interface NpTag {
  readonly id: string;
  readonly user_id: string;
  readonly name: string;
  readonly color: string;
  readonly source_account_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/** Junction record linking a todo to a tag. */
export interface NpTodoTag {
  readonly id: string;
  readonly todo_id: string;
  readonly tag_id: string;
  readonly source_account_id: string;
  readonly created_at: string;
  /** Populated when the full tag object is joined (via Hasura relationship). */
  readonly tag?: NpTag;
}

export interface CreateTagInput {
  readonly name: string;
  readonly color: string;
}

export type UpdateTagInput = Partial<Pick<NpTag, 'name' | 'color'>>;
