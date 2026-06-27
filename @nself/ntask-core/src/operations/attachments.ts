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

export const CREATE_ATTACHMENT = /* GraphQL */`
  mutation CreateAttachment(
    $todoId: uuid!
    $storageKey: String!
    $bucket: String!
    $fileName: String!
    $mimeType: String!
    $fileSizeBytes: bigint!
    $acl: String
    $commentId: uuid
  ) {
    insert_np_attachments_one(object: {
      todo_id: $todoId
      storage_key: $storageKey
      bucket: $bucket
      file_name: $fileName
      mime_type: $mimeType
      file_size_bytes: $fileSizeBytes
      acl: $acl
      comment_id: $commentId
    }) {
      id
      todo_id
      storage_key
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
