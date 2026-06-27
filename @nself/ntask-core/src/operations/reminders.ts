/**
 * GraphQL operations for np_reminders.
 * SPORT: Part of @nself/ntask-core.
 */

export const GET_REMINDERS = /* GraphQL */`
  query GetReminders($todoId: uuid!) {
    np_reminders(
      where: { todo_id: { _eq: $todoId } }
      order_by: { remind_at: asc }
    ) {
      id
      todo_id
      user_id
      channel
      remind_at
      sent
      sent_at
      source_account_id
      created_at
    }
  }
`;

export const CREATE_REMINDER = /* GraphQL */`
  mutation CreateReminder($todoId: uuid!, $remindAt: timestamptz!, $channel: String) {
    insert_np_reminders_one(object: {
      todo_id: $todoId
      remind_at: $remindAt
      channel: $channel
    }) {
      id
      todo_id
      channel
      remind_at
      sent
      created_at
    }
  }
`;

export const UPDATE_REMINDER = /* GraphQL */`
  mutation UpdateReminder($id: uuid!, $remindAt: timestamptz, $channel: String) {
    update_np_reminders_by_pk(
      pk_columns: { id: $id }
      _set: { remind_at: $remindAt, channel: $channel }
    ) {
      id
      remind_at
      channel
    }
  }
`;

export const DELETE_REMINDER = /* GraphQL */`
  mutation DeleteReminder($id: uuid!) {
    delete_np_reminders_by_pk(id: $id) {
      id
    }
  }
`;
