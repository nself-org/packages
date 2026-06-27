/**
 * Shared enums for ɳTask domain.
 * Purpose: Single source of truth for all discriminated string unions consumed by
 *          all 4 surfaces (mobile, web, desktop, TV) and Zod validation schemas.
 * Constraints: Priority values must match the np_todos CHECK constraint in migration 003.
 *              MemberRole values must match np_list_members role CHECK.
 * SPORT: Part of @nself/ntask-core.
 */

/** Task priority — 5 canonical values matching np_todos.priority CHECK constraint. */
export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

/** Task completion status for display logic. */
export type TaskStatus = 'open' | 'complete';

/** List member role — maps to np_list_members.role. */
export type MemberRole = 'viewer' | 'editor' | 'owner';

/** Reminder delivery channel — maps to np_reminders.channel. */
export type ReminderChannel = 'push' | 'email' | 'both';

/** Recurring rule frequency — maps to np_recurring_rules.frequency ENUM. */
export type RruleFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** All Priority values in sort order (none=0 … urgent=4). */
export const PRIORITY_VALUES: readonly Priority[] = ['none', 'low', 'medium', 'high', 'urgent'] as const;
