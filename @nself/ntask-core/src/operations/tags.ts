/**
 * GraphQL operations for np_tags and np_todo_tags.
 * SPORT: Part of @nself/ntask-core.
 */

export const GET_TAGS = /* GraphQL */`
  query GetTags($userId: uuid!) {
    np_tags(
      where: { user_id: { _eq: $userId } }
      order_by: { name: asc }
    ) {
      id
      user_id
      name
      color
      source_account_id
      created_at
      updated_at
    }
  }
`;

export const CREATE_TAG = /* GraphQL */`
  mutation CreateTag($name: String!, $color: String!) {
    insert_np_tags_one(object: { name: $name, color: $color }) {
      id
      user_id
      name
      color
      created_at
    }
  }
`;

export const UPDATE_TAG = /* GraphQL */`
  mutation UpdateTag($id: uuid!, $name: String, $color: String) {
    update_np_tags_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name, color: $color }
    ) {
      id
      name
      color
      updated_at
    }
  }
`;

export const DELETE_TAG = /* GraphQL */`
  mutation DeleteTag($id: uuid!) {
    delete_np_tags_by_pk(id: $id) {
      id
    }
  }
`;

export const ADD_TODO_TAG = /* GraphQL */`
  mutation AddTodoTag($todoId: uuid!, $tagId: uuid!) {
    insert_np_todo_tags_one(object: { todo_id: $todoId, tag_id: $tagId }) {
      todo_id
      tag_id
    }
  }
`;

export const REMOVE_TODO_TAG = /* GraphQL */`
  mutation RemoveTodoTag($todoId: uuid!, $tagId: uuid!) {
    delete_np_todo_tags(
      where: { todo_id: { _eq: $todoId }, tag_id: { _eq: $tagId } }
    ) {
      affected_rows
    }
  }
`;
