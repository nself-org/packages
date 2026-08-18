/**
 * GraphQL operations for np_profiles and np_user_preferences.
 * SPORT: Part of @nself/ntask-core.
 */

// $userId is intentionally omitted: np_profiles select permission (role: user)
// filters by X-Hasura-User-Id via Hasura session var, so the client never
// passes it. Uses the plural list root field (not _by_pk) to match the
// session-filtered-list pattern used elsewhere (GET_LISTS, GET_TAGS) — the
// row filter already limits this to (at most) the caller's own profile.
export const GET_PROFILE = /* GraphQL */`
  query GetProfile {
    np_profiles {
      id
      email
      display_name
      bio
      avatar_url
      source_account_id
      created_at
      updated_at
    }
  }
`;

export const UPDATE_PROFILE = /* GraphQL */`
  mutation UpdateProfile($id: uuid!, $displayName: String, $bio: String, $avatarUrl: String) {
    update_np_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { display_name: $displayName, bio: $bio, avatar_url: $avatarUrl }
    ) {
      id
      display_name
      bio
      avatar_url
      updated_at
    }
  }
`;

// $userId omitted for the same reason as GET_PROFILE above.
export const GET_USER_PREFERENCES = /* GraphQL */`
  query GetUserPreferences {
    np_user_preferences {
      id
      user_id
      time_format
      auto_hide_completed
      theme_preference
      default_list_id
      notification_settings
      source_account_id
      created_at
      updated_at
    }
  }
`;

// Bulk where-user_id update (not _by_pk): callers pass the user id (which they
// already hold from auth.getUser()/profile.id — np_profiles.id === user id),
// not the np_user_preferences row's own id. RLS (filter: user_id _eq
// X-Hasura-User-Id) still enforces ownership.
export const UPDATE_PREFERENCES = /* GraphQL */`
  mutation UpdatePreferences(
    $userId: uuid!
    $timeFormat: String
    $autoHideCompleted: Boolean
    $themePreference: String
    $defaultListId: uuid
    $notificationSettings: jsonb
  ) {
    update_np_user_preferences(
      where: { user_id: { _eq: $userId } }
      _set: {
        time_format: $timeFormat
        auto_hide_completed: $autoHideCompleted
        theme_preference: $themePreference
        default_list_id: $defaultListId
        notification_settings: $notificationSettings
      }
    ) {
      affected_rows
      returning {
        id
        time_format
        auto_hide_completed
        theme_preference
        default_list_id
        notification_settings
        updated_at
      }
    }
  }
`;
