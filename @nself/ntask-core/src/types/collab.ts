/**
 * Collaboration types — list members, shares, presence, notifications.
 * These map to np_list_members, np_list_shares, np_list_presence, np_notifications.
 * L-dep: invite types (np_list_invites) will be added in Epic L.
 * SPORT: Part of @nself/ntask-core.
 */

import type { MemberRole } from './enums.js';
import type { NpProfile } from './profile.js';

/** np_list_members row — explicit membership record. */
export interface NpListMember {
  readonly id: string;
  readonly list_id: string;
  readonly user_id: string;
  readonly role: MemberRole;
  readonly added_by: string;
  readonly added_at: string;
  readonly source_account_id: string;
  readonly created_at: string;
  /** Populated when profile relationship is joined. */
  readonly profile?: NpProfile;
}

/** np_list_shares row — invitation/share record. */
export interface NpListShare {
  readonly id: string;
  readonly list_id: string;
  readonly shared_with_user_id: string | null;
  readonly shared_with_email: string;
  readonly permission: MemberRole;
  readonly invited_by: string;
  readonly accepted_at: string | null;
  readonly source_account_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/** np_list_presence row — real-time cursor position. */
export interface NpListPresence {
  readonly id: string;
  readonly list_id: string;
  readonly user_id: string;
  readonly status: 'viewing' | 'editing';
  readonly editing_todo_id: string | null;
  readonly source_account_id: string;
  readonly last_seen_at: string;
  readonly created_at: string;
  /** Populated when profile relationship is joined. */
  readonly profile?: NpProfile;
}

/** np_notifications row. */
export interface NpNotification {
  readonly id: string;
  readonly user_id: string;
  readonly type: 'new_todo' | 'due_reminder' | 'shared_list' | 'evening_reminder' | 'location_reminder' | 'list_update';
  readonly title: string;
  readonly body: string;
  readonly read: boolean;
  readonly action_url: string | null;
  readonly data: Record<string, unknown> | null;
  readonly created_at: string;
}

/** np_device_tokens row. */
export interface NpDeviceToken {
  readonly id: string;
  readonly user_id: string;
  readonly platform: 'ios' | 'android' | 'web';
  readonly token: string;
  readonly created_at: string;
}

/** Aggregated list group (from np_list_groups migration 006). */
export interface NpListGroup {
  readonly id: string;
  readonly user_id: string;
  readonly title: string;
  readonly color: string | null;
  readonly icon: string | null;
  readonly position: number;
  readonly source_account_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}
