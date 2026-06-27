/**
 * GraphQL operations for np_comments.
 * SPORT: Part of @nself/ntask-core.
 */

export const GET_COMMENTS = /* GraphQL */`
  query GetComments($todoId: uuid!) {
    np_comments(
      where: {
        todo_id: { _eq: $todoId }
        deleted_at: { _is_null: true }
      }
      order_by: { created_at: asc }
    ) {
      id
      todo_id
      author_id
      parent_comment_id
      body
      edited_at
      deleted_at
      source_account_id
      created_at
      updated_at
    }
  }
`;

export const CREATE_COMMENT = /* GraphQL */`
  mutation CreateComment(
    $todoId: uuid!
    $body: String!
    $parentCommentId: uuid
    $idempotencyKey: String
  ) {
    insert_np_comments_one(object: {
      todo_id: $todoId
      body: $body
      parent_comment_id: $parentCommentId
      idempotency_key: $idempotencyKey
    }) {
      id
      todo_id
      body
      author_id
      parent_comment_id
      created_at
    }
  }
`;

export const UPDATE_COMMENT = /* GraphQL */`
  mutation UpdateComment($id: uuid!, $body: String!) {
    update_np_comments_by_pk(
      pk_columns: { id: $id }
      _set: { body: $body, edited_at: "now()" }
    ) {
      id
      body
      edited_at
      updated_at
    }
  }
`;

export const DELETE_COMMENT = /* GraphQL */`
  mutation DeleteComment($id: uuid!) {
    update_np_comments_by_pk(
      pk_columns: { id: $id }
      _set: { deleted_at: "now()" }
    ) {
      id
      deleted_at
    }
  }
`;

export const SUBSCRIBE_LIST_COMMENTS = /* GraphQL */`
  subscription SubscribeListComments($todoId: uuid!) {
    np_comments(
      where: {
        todo_id: { _eq: $todoId }
        deleted_at: { _is_null: true }
      }
      order_by: { created_at: asc }
    ) {
      id
      body
      author_id
      parent_comment_id
      edited_at
      created_at
    }
  }
`;
