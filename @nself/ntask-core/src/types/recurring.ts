/**
 * NpRecurringRule — typed RRULE definition for a task.
 * Constraint: until_date and count_limit are mutually exclusive (DB CHECK).
 * Note: interval column is named `interval_count` (not `interval`) to avoid reserved word.
 * SPORT: Part of @nself/ntask-core.
 */

import type { RruleFrequency } from './enums.js';

export interface NpRecurringRule {
  readonly id: string;
  readonly todo_id: string;
  readonly frequency: RruleFrequency;
  readonly interval_count: number;
  readonly by_day: readonly string[] | null;
  readonly by_month_day: readonly number[] | null;
  readonly by_month: readonly number[] | null;
  readonly until_date: string | null;
  readonly count_limit: number | null;
  readonly rrule: string | null;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly source_account_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface NpRecurringInstance {
  readonly id: string;
  readonly parent_todo_id: string;
  readonly instance_date: string;
  readonly completed: boolean;
  readonly skipped: boolean;
  readonly completed_at: string | null;
  readonly source_account_id: string;
  readonly created_at: string;
}

export interface CreateRecurringRuleInput {
  readonly todo_id: string;
  readonly frequency: RruleFrequency;
  readonly interval_count?: number;
  readonly by_day?: string[];
  readonly by_month_day?: number[];
  readonly by_month?: number[];
  readonly until_date?: string;
  readonly count_limit?: number;
  readonly start_date?: string;
  readonly end_date?: string;
}

export type UpdateRecurringRuleInput = Partial<
  Pick<NpRecurringRule, 'frequency' | 'interval_count' | 'by_day' | 'by_month_day' | 'by_month' | 'until_date' | 'count_limit' | 'end_date'>
>;
