/**
 * NpComment — task comment with nested reply support.
 * Soft-deleted via deleted_at; consumers must filter WHERE deleted_at IS NULL.
 * SPORT: Part of @nself/ntask-core.
 */

export interface NpComment {
  readonly id: string;
  readonly todo_id: string;
  readonly author_id: string;
  readonly parent_comment_id: string | null;
  readonly body: string;
  readonly idempotency_key: string | null;
  readonly edited_at: string | null;
  readonly deleted_at: string | null;
  readonly source_account_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CreateCommentInput {
  readonly todo_id: string;
  readonly body: string;
  readonly parent_comment_id?: string;
  /** Caller-supplied idempotency key for offline replay deduplication. */
  readonly idempotency_key?: string;
}

export type UpdateCommentInput = Pick<NpComment, 'body'>;
