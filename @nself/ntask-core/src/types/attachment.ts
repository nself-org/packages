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

export interface CreateAttachmentInput {
  readonly todo_id: string;
  readonly storage_key: string;
  readonly bucket?: string;
  readonly file_name: string;
  readonly mime_type: string;
  readonly file_size_bytes: number;
  readonly acl?: 'private' | 'public';
  readonly comment_id?: string;
}
