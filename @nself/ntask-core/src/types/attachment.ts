/**
 * NpAttachment — typed file attachment linked to a todo (and optionally a comment).
 * Storage key references MinIO/Hasura Storage object ID.
 * SPORT: Part of @nself/ntask-core.
 */

export interface NpAttachment {
  readonly id: string;
  readonly todo_id: string;
  readonly comment_id: string | null;
  readonly uploader_id: string;
  readonly storage_key: string;
  readonly bucket: string;
  readonly file_name: string;
  readonly mime_type: string;
  readonly file_size_bytes: number;
  readonly acl: 'private' | 'public';
  readonly source_account_id: string;
  readonly created_at: string;
}

/**
 * `bucket` and `uploader_id` are deliberately not accepted.
 *
 * Hasura presets uploader_id to the caller, and `bucket` was removed from the
 * role's insertable columns: getDownloadUrl honours it and then signs the key
 * with the storage root credentials, so a caller-chosen bucket allowed
 * cross-bucket traversal. The column default ('ntask') applies instead.
 */
export interface CreateAttachmentInput {
  readonly todo_id: string;
  readonly storage_key: string;
  readonly file_name: string;
  readonly mime_type: string;
  readonly file_size_bytes: number;
  readonly acl?: 'private' | 'public';
  readonly comment_id?: string;
}
