/**
 * GraphQL operations for collaboration: list members, shares, presence, notifications.
 * SPORT: Part of @nself/ntask-core.
 */

export const GET_LIST_MEMBERS = /* GraphQL */`
  query GetListMembers($listId: uuid!) {
    np_list_members(where: { list_id: { _eq: $listId } }) {
      id
      list_id
      user_id
      role
      added_by
      added_at
      source_account_id
      created_at
    }
  }
`;

export const GET_LIST_SHARES = /* GraphQL */`
  query GetListShares($listId: uuid!) {
    np_list_shares(where: { list_id: { _eq: $listId } }) {
      id
      list_id
      shared_with_user_id
      shared_with_email
      permission
      invited_by
      accepted_at
      token
      source_account_id
      created_at
      updated_at
    }
  }
`;

export const CREATE_LIST_SHARE = /* GraphQL */`
  mutation CreateListShare(
    $listId: uuid!
    $sharedWithEmail: String!
    $permission: String!
  ) {
    insert_np_list_shares_one(object: {
      list_id: $listId
      shared_with_email: $sharedWithEmail
      permission: $permission
    }) {
      id
      list_id
      shared_with_email
      permission
      created_at
    }
  }
`;

export const UPDATE_MEMBER_ROLE = /* GraphQL */`
  mutation UpdateMemberRole($listId: uuid!, $userId: uuid!, $role: String!) {
    update_np_list_members(
      where: { list_id: { _eq: $listId }, user_id: { _eq: $userId } }
      _set: { role: $role }
    ) {
      affected_rows
      returning { id role }
    }
  }
`;

export const REMOVE_MEMBER = /* GraphQL */`
  mutation RemoveMember($listId: uuid!, $userId: uuid!) {
    delete_np_list_members(
      where: { list_id: { _eq: $listId }, user_id: { _eq: $userId } }
    ) {
      affected_rows
    }
  }
`;

export const UPSERT_PRESENCE = /* GraphQL */`
  mutation UpsertPresence($listId: uuid!, $status: String!, $editingTodoId: uuid) {
    insert_np_list_presence_one(
      object: {
        list_id: $listId
        status: $status
        editing_todo_id: $editingTodoId
        last_seen_at: "now()"
      }
      on_conflict: {
        constraint: np_list_presence_list_id_user_id_key
        update_columns: [status, editing_todo_id, last_seen_at]
      }
    ) {
      id
      list_id
      user_id
      status
      editing_todo_id
      last_seen_at
    }
  }
`;

export const REMOVE_PRESENCE = /* GraphQL */`
  mutation RemovePresence($listId: uuid!) {
    delete_np_list_presence(
      where: { list_id: { _eq: $listId } }
    ) {
      affected_rows
    }
  }
`;

export const GET_NOTIFICATIONS = /* GraphQL */`
  query GetNotifications($userId: uuid!, $limit: Int) {
    np_notifications(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      type
      title
      body
      read
      action_url
      data
      created_at
    }
  }
`;

export const MARK_NOTIFICATION_READ = /* GraphQL */`
  mutation MarkNotificationRead($id: uuid!) {
    update_np_notifications_by_pk(
      pk_columns: { id: $id }
      _set: { read: true }
    ) {
      id
      read
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = /* GraphQL */`
  mutation MarkAllNotificationsRead($userId: uuid!) {
    update_np_notifications(
      where: { user_id: { _eq: $userId }, read: { _eq: false } }
      _set: { read: true }
    ) {
      affected_rows
    }
  }
`;

export const GET_DEVICE_TOKENS = /* GraphQL */`
  query GetDeviceTokens($userId: uuid!) {
    np_device_tokens(where: { user_id: { _eq: $userId } }) {
      id
      platform
      token
      created_at
    }
  }
`;

export const REGISTER_DEVICE_TOKEN = /* GraphQL */`
  mutation RegisterDeviceToken($platform: String!, $token: String!) {
    insert_np_device_tokens_one(
      object: { platform: $platform, token: $token }
      on_conflict: { constraint: np_device_tokens_token_key, update_columns: [platform] }
    ) {
      id
      platform
      token
      created_at
    }
  }
`;

export const UNREGISTER_DEVICE_TOKEN = /* GraphQL */`
  mutation UnregisterDeviceToken($token: String!) {
    delete_np_device_tokens(where: { token: { _eq: $token } }) {
      affected_rows
    }
  }
`;

export const SUBSCRIBE_LIST_PRESENCE = /* GraphQL */`
  subscription SubscribeListPresence($listId: uuid!) {
    np_list_presence(where: { list_id: { _eq: $listId } }) {
      id
      user_id
      status
      editing_todo_id
      last_seen_at
    }
  }
`;

export const SUBSCRIBE_UNREAD_NOTIFICATION_COUNT = /* GraphQL */`
  subscription SubscribeUnreadNotificationCount($userId: uuid!) {
    np_notifications_aggregate(
      where: { user_id: { _eq: $userId }, read: { _eq: false } }
    ) {
      aggregate { count }
    }
  }
`;

export const SUBSCRIBE_NOTIFICATIONS = /* GraphQL */`
  subscription SubscribeNotifications($userId: uuid!, $limit: Int) {
    np_notifications(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      type
      title
      body
      read
      created_at
    }
  }
`;
