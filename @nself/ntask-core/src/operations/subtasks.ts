/**
 * GraphQL operations for np_subtasks.
 * SPORT: Part of @nself/ntask-core.
 */

export const GET_SUBTASKS = /* GraphQL */`
  query GetSubtasks($todoId: uuid!) {
    np_subtasks(
      where: { todo_id: { _eq: $todoId } }
      order_by: { position: asc }
    ) {
      id
      todo_id
      title
      is_done
      position
      source_account_id
      created_at
      updated_at
    }
  }
`;

export const CREATE_SUBTASK = /* GraphQL */`
  mutation CreateSubtask($todoId: uuid!, $title: String!, $position: Int) {
    insert_np_subtasks_one(object: {
      todo_id: $todoId
      title: $title
      position: $position
    }) {
      id
      todo_id
      title
      is_done
      position
      created_at
    }
  }
`;

export const UPDATE_SUBTASK = /* GraphQL */`
  mutation UpdateSubtask($id: uuid!, $title: String, $isDone: Boolean, $position: Int) {
    update_np_subtasks_by_pk(
      pk_columns: { id: $id }
      _set: { title: $title, is_done: $isDone, position: $position }
    ) {
      id
      title
      is_done
      position
      updated_at
    }
  }
`;

export const TOGGLE_SUBTASK = /* GraphQL */`
  mutation ToggleSubtask($id: uuid!, $isDone: Boolean!) {
    update_np_subtasks_by_pk(
      pk_columns: { id: $id }
      _set: { is_done: $isDone }
    ) {
      id
      is_done
      updated_at
    }
  }
`;

export const DELETE_SUBTASK = /* GraphQL */`
  mutation DeleteSubtask($id: uuid!) {
    delete_np_subtasks_by_pk(id: $id) {
      id
    }
  }
`;
