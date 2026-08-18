/**
 * GraphQL operations for np_todo_assignees (multi-assignee todos).
 * Perms: role user may assign/view/unassign as todo owner, as the assignee
 * themselves, or as a list-share member (editor/owner permission required for
 * assign/unassign; any accepted share member may view) — see tables.yaml.
 * SPORT: Part of @nself/ntask-core.
 */

export const ASSIGN_TODO = /* GraphQL */`
  mutation AssignTodo($todoId: uuid!, $assigneeId: uuid!) {
    insert_np_todo_assignees_one(object: {
      todo_id: $todoId
      assignee_id: $assigneeId
    }) {
      id
      todo_id
      assignee_id
      assigned_by
      assigned_at
    }
  }
`;

export const UNASSIGN_TODO = /* GraphQL */`
  mutation UnassignTodo($todoId: uuid!, $assigneeId: uuid!) {
    delete_np_todo_assignees(
      where: { todo_id: { _eq: $todoId }, assignee_id: { _eq: $assigneeId } }
    ) {
      affected_rows
    }
  }
`;

export const GET_TODO_ASSIGNEES = /* GraphQL */`
  query GetTodoAssignees($todoId: uuid!) {
    np_todo_assignees(where: { todo_id: { _eq: $todoId } }) {
      id
      todo_id
      assignee_id
      assigned_by
      assigned_at
    }
  }
`;
