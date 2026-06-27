/**
 * NpReminder — personal task reminder with channel selection.
 * RLS: owner-only (user_id = auth.uid()).
 * Note: `sent` column (not `is_sent`) per migration 013.
 * SPORT: Part of @nself/ntask-core.
 */

import type { ReminderChannel } from './enums.js';

export interface NpReminder {
  readonly id: string;
  readonly todo_id: string;
  readonly user_id: string;
  readonly channel: ReminderChannel;
  readonly remind_at: string;
  readonly sent: boolean;
  readonly sent_at: string | null;
  readonly source_account_id: string;
  readonly created_at: string;
}

export interface CreateReminderInput {
  readonly todo_id: string;
  readonly remind_at: string;
  readonly channel?: ReminderChannel;
}

export type UpdateReminderInput = Partial<Pick<NpReminder, 'remind_at' | 'channel'>>;
