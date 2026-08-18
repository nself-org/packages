/**
 * GraphQL operations for np_saved_views (saved filter/sort presets).
 * SPORT: Part of @nself/ntask-core. Moved from web/ntask/src/lib/graphql-saved-views.ts.
 */

export const GET_SAVED_VIEWS = /* GraphQL */`
  query GetSavedViews {
    np_saved_views(order_by: { created_at: asc }) {
      id
      user_id
      name
      filters
      sort
      created_at
    }
  }
`;

export const CREATE_SAVED_VIEW = /* GraphQL */`
  mutation CreateSavedView(
    $name: String!
    $filters: jsonb!
    $sort: jsonb!
  ) {
    insert_np_saved_views_one(object: {
      name: $name
      filters: $filters
      sort: $sort
    }) {
      id
      user_id
      name
      filters
      sort
      created_at
    }
  }
`;

export const DELETE_SAVED_VIEW = /* GraphQL */`
  mutation DeleteSavedView($id: uuid!) {
    delete_np_saved_views_by_pk(id: $id) {
      id
    }
  }
`;

export const UPDATE_SAVED_VIEW = /* GraphQL */`
  mutation UpdateSavedView($id: uuid!, $name: String!) {
    update_np_saved_views_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name }
    ) {
      id
      user_id
      name
      filters
      sort
      created_at
    }
  }
`;
