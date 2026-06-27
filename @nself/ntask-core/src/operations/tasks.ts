/**
 * GraphQL operation strings for np_todos.
 * SPORT: Part of @nself/ntask-core.
 */

export const GET_LIST_TODOS = /* GraphQL */`
  query GetListTodos($listId: uuid!) {
    np_todos(
      where: { list_id: { _eq: $listId } }
      order_by: { position: asc, created_at: asc }
    ) {
      id
      user_id
      list_id
      title
      description
      completed
      priority
      notes
      due_date
      position
      source_account_id
      created_at
      updated_at
      requires_approval
      requires_photo
    }
  }
`;

export const GET_TODO = /* GraphQL */`
  query GetTodo($id: uuid!) {
    np_todos_by_pk(id: $id) {
      id
      user_id
      list_id
      title
      description
      completed
      priority
      notes
      due_date
      position
      source_account_id
      created_at
      updated_at
      requires_approval
      requires_photo
      approved_by
      approved_at
      rejected_by
      rejected_at
      rejection_reason
    }
  }
`;

export const SEARCH_TODOS = /* GraphQL */`
  query SearchTodos($userId: uuid!, $q: String!, $limit: Int) {
    np_todos(
      where: {
        user_id: { _eq: $userId }
        title: { _ilike: $q }
      }
      limit: $limit
      order_by: { updated_at: desc }
    ) {
      id
      title
      completed
      priority
      due_date
      list_id
      source_account_id
    }
  }
`;

export const CREATE_TODO = /* GraphQL */`
  mutation CreateTodo(
    $listId: uuid!
    $title: String!
    $priority: String
    $description: String
    $notes: String
    $dueDate: timestamptz
    $position: Int
  ) {
    insert_np_todos_one(object: {
      list_id: $listId
      title: $title
      priority: $priority
      description: $description
      notes: $notes
      due_date: $dueDate
      position: $position
    }) {
      id
      list_id
      title
      completed
      priority
      due_date
      position
      created_at
      updated_at
    }
  }
`;

export const UPDATE_TODO = /* GraphQL */`
  mutation UpdateTodo(
    $id: uuid!
    $title: String
    $description: String
    $completed: Boolean
    $priority: String
    $notes: String
    $dueDate: timestamptz
    $position: Int
  ) {
    update_np_todos_by_pk(
      pk_columns: { id: $id }
      _set: {
        title: $title
        description: $description
        completed: $completed
        priority: $priority
        notes: $notes
        due_date: $dueDate
        position: $position
      }
    ) {
      id
      title
      description
      completed
      priority
      notes
      due_date
      position
      updated_at
    }
  }
`;

export const TOGGLE_TODO = /* GraphQL */`
  mutation ToggleTodo($id: uuid!, $completed: Boolean!) {
    update_np_todos_by_pk(
      pk_columns: { id: $id }
      _set: { completed: $completed }
    ) {
      id
      completed
      updated_at
    }
  }
`;

export const DELETE_TODO = /* GraphQL */`
  mutation DeleteTodo($id: uuid!) {
    delete_np_todos_by_pk(id: $id) {
      id
    }
  }
`;

export const APPROVE_TODO = /* GraphQL */`
  mutation ApproveTodo($todoId: uuid!, $approverId: uuid!) {
    update_np_todos_by_pk(
      pk_columns: { id: $todoId }
      _set: { approved_by: $approverId, approved_at: "now()" }
    ) {
      id
      approved_by
      approved_at
    }
  }
`;

export const REJECT_TODO = /* GraphQL */`
  mutation RejectTodo($todoId: uuid!, $rejectorId: uuid!, $reason: String) {
    update_np_todos_by_pk(
      pk_columns: { id: $todoId }
      _set: { rejected_by: $rejectorId, rejected_at: "now()", rejection_reason: $reason }
    ) {
      id
      rejected_by
      rejected_at
      rejection_reason
    }
  }
`;

export const SUBSCRIBE_LIST_TODOS = /* GraphQL */`
  subscription SubscribeListTodos($listId: uuid!) {
    np_todos(
      where: { list_id: { _eq: $listId } }
      order_by: { position: asc, created_at: asc }
    ) {
      id
      title
      completed
      priority
      due_date
      position
      updated_at
    }
  }
`;
