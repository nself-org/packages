/**
 * GraphQL operations for np_lists and np_list_groups.
 * SPORT: Part of @nself/ntask-core.
 */

export const GET_LISTS = /* GraphQL */`
  query GetLists {
    np_lists(order_by: { position: asc, created_at: asc }) {
      id
      user_id
      title
      description
      color
      icon
      is_default
      position
      group_id
      source_account_id
      created_at
      updated_at
    }
  }
`;

export const CREATE_LIST = /* GraphQL */`
  mutation CreateList(
    $title: String!
    $color: String
    $icon: String
    $description: String
    $groupId: uuid
    $position: Int
  ) {
    insert_np_lists_one(object: {
      title: $title
      color: $color
      icon: $icon
      description: $description
      group_id: $groupId
      position: $position
    }) {
      id
      user_id
      title
      description
      color
      icon
      is_default
      position
      group_id
      created_at
      updated_at
    }
  }
`;

export const UPDATE_LIST = /* GraphQL */`
  mutation UpdateList(
    $id: uuid!
    $title: String
    $color: String
    $icon: String
    $description: String
    $position: Int
    $groupId: uuid
  ) {
    update_np_lists_by_pk(
      pk_columns: { id: $id }
      _set: {
        title: $title
        color: $color
        icon: $icon
        description: $description
        position: $position
        group_id: $groupId
      }
    ) {
      id
      title
      description
      color
      icon
      position
      group_id
      updated_at
    }
  }
`;

export const DELETE_LIST = /* GraphQL */`
  mutation DeleteList($id: uuid!) {
    delete_np_lists_by_pk(id: $id) {
      id
    }
  }
`;

export const GET_LIST_GROUPS = /* GraphQL */`
  query GetListGroups {
    np_list_groups(order_by: { position: asc }) {
      id
      title
      color
      icon
      position
      created_at
      updated_at
    }
  }
`;

export const CREATE_LIST_GROUP = /* GraphQL */`
  mutation CreateListGroup($title: String!, $color: String, $icon: String, $position: Int) {
    insert_np_list_groups_one(object: {
      title: $title
      color: $color
      icon: $icon
      position: $position
    }) {
      id
      title
      color
      icon
      position
      created_at
    }
  }
`;

export const UPDATE_LIST_GROUP = /* GraphQL */`
  mutation UpdateListGroup($id: uuid!, $title: String, $color: String, $icon: String, $position: Int) {
    update_np_list_groups_by_pk(
      pk_columns: { id: $id }
      _set: { title: $title, color: $color, icon: $icon, position: $position }
    ) {
      id
      title
      color
      icon
      position
      updated_at
    }
  }
`;

export const DELETE_LIST_GROUP = /* GraphQL */`
  mutation DeleteListGroup($id: uuid!) {
    delete_np_list_groups_by_pk(id: $id) {
      id
    }
  }
`;

export const SUBSCRIBE_LIST_MEMBERS = /* GraphQL */`
  subscription SubscribeListMembers($listId: uuid!) {
    np_list_members(where: { list_id: { _eq: $listId } }) {
      id
      user_id
      role
    }
  }
`;
