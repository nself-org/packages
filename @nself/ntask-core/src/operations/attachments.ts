/**
 * GraphQL operations for np_attachments.
 * SPORT: Part of @nself/ntask-core.
 */

export const GET_ATTACHMENTS = /* GraphQL */`
  query GetAttachments($todoId: uuid!) {
    np_attachments(
      where: { todo_id: { _eq: $todoId } }
      order_by: { created_at: asc }
    ) {
      id
      todo_id
      comment_id
      uploader_id
      storage_key
      bucket
      file_name
      mime_type
      file_size_bytes
      acl
      source_account_id
      created_at
    }
  }
`;

/**
 * `bucket` is intentionally absent, and must stay absent.
 *
 * It is not client-insertable: getDownloadUrl honours `attachment.bucket` and
 * then signs the key with the storage root credentials, so letting a caller
 * choose the bucket permitted cross-bucket traversal. The Hasura insert
 * permission drops the column and the database default ('ntask') applies.
 * Sending it now fails with:
 *   field 'bucket' not found in type: 'np_attachments_insert_input'
 *
 * `uploader_id` is likewise absent because Hasura presets it to the caller.
 */
export const CREATE_ATTACHMENT = /* GraphQL */`
  mutation CreateAttachment(
    $todoId: uuid!
    $storageKey: String!
    $fileName: String!
    $mimeType: String!
    $fileSizeBytes: bigint!
    $acl: String
    $commentId: uuid
  ) {
    insert_np_attachments_one(object: {
      todo_id: $todoId
      storage_key: $storageKey
      file_name: $fileName
      mime_type: $mimeType
      file_size_bytes: $fileSizeBytes
      acl: $acl
      comment_id: $commentId
    }) {
      id
      todo_id
      storage_key
      bucket
      file_name
      mime_type
      file_size_bytes
      created_at
    }
  }
`;

export const DELETE_ATTACHMENT = /* GraphQL */`
  mutation DeleteAttachment($id: uuid!) {
    delete_np_attachments_by_pk(id: $id) {
      id
    }
  }
`;
