/**
 * GraphQL operations for np_profiles and np_user_preferences.
 * SPORT: Part of @nself/ntask-core.
 */

export const GET_PROFILE = /* GraphQL */`
  query GetProfile($userId: uuid!) {
    np_profiles_by_pk(id: $userId) {
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
  mutation UpdateProfile($userId: uuid!, $displayName: String, $bio: String, $avatarUrl: String) {
    update_np_profiles_by_pk(
      pk_columns: { id: $userId }
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

export const GET_USER_PREFERENCES = /* GraphQL */`
  query GetUserPreferences($userId: uuid!) {
    np_user_preferences(where: { user_id: { _eq: $userId } }) {
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
