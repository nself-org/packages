/**
 * NpProfile and NpUserPreferences — user identity and preferences.
 * SPORT: Part of @nself/ntask-core.
 */

export interface NpProfile {
  readonly id: string;
  readonly email: string | null;
  readonly display_name: string;
  readonly bio: string;
  readonly avatar_url: string;
  readonly source_account_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface NotificationSettings {
  readonly push: boolean;
  readonly email: boolean;
  readonly inApp: boolean;
}

export interface NpUserPreferences {
  readonly id: string;
  readonly user_id: string;
  readonly time_format: '12h' | '24h';
  readonly auto_hide_completed: boolean;
  readonly theme_preference: 'light' | 'dark' | 'system';
  readonly default_list_id: string | null;
  readonly notification_settings: NotificationSettings;
  readonly source_account_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface UpdateProfileInput {
  readonly display_name?: string;
  readonly bio?: string;
  readonly avatar_url?: string;
}

export type UpdatePreferencesInput = Partial<
  Pick<
    NpUserPreferences,
    'time_format' | 'auto_hide_completed' | 'theme_preference' | 'default_list_id' | 'notification_settings'
  >
>;
