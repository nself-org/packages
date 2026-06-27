/**
 * Task mappers — convert raw Hasura GraphQL fragments to domain types.
 * Purpose: Centralise field translation so surfaces never access raw GQL shapes.
 * Inputs: Partial raw GQL objects (may omit optional fields).
 * Outputs: Fully typed NpTask / NpTaskSummary.
 * SPORT: Part of @nself/ntask-core.
 */

import type { NpTask, NpTaskSummary } from '../types/task.js';
import type { Priority } from '../types/enums.js';
import { PRIORITY_ORDER } from '../constants/priority.js';

/** Validate and narrow a raw priority string to Priority. */
const normalizePriority = (raw: string | null | undefined): Priority => {
  if (raw && raw in PRIORITY_ORDER) return raw as Priority;
  return 'none';
};

/**
 * Map a raw Hasura GraphQL np_todos object to NpTask.
 * Unknown/missing fields fall back to safe defaults.
 */
export const mapGqlTaskToNpTask = (raw: Record<string, unknown>): NpTask => ({
  id: String(raw['id'] ?? ''),
  user_id: String(raw['user_id'] ?? ''),
  list_id: raw['list_id'] != null ? String(raw['list_id']) : null,
  title: String(raw['title'] ?? ''),
  description: String(raw['description'] ?? ''),
  completed: Boolean(raw['completed']),
  is_public: Boolean(raw['is_public']),
  priority: normalizePriority(raw['priority'] as string | null | undefined),
  notes: String(raw['notes'] ?? ''),
  due_date: raw['due_date'] != null ? String(raw['due_date']) : null,
  position: Number(raw['position'] ?? 0),
  source_account_id: String(raw['source_account_id'] ?? 'primary'),
  created_at: String(raw['created_at'] ?? ''),
  updated_at: String(raw['updated_at'] ?? ''),
  requires_approval: Boolean(raw['requires_approval']),
  requires_photo: Boolean(raw['requires_photo']),
  approved_by: raw['approved_by'] != null ? String(raw['approved_by']) : null,
  approved_at: raw['approved_at'] != null ? String(raw['approved_at']) : null,
  rejected_by: raw['rejected_by'] != null ? String(raw['rejected_by']) : null,
  rejected_at: raw['rejected_at'] != null ? String(raw['rejected_at']) : null,
  rejection_reason: raw['rejection_reason'] != null ? String(raw['rejection_reason']) : null,
});

/**
 * Map a raw GQL object to NpTaskSummary (lightweight list-view shape).
 */
export const mapGqlTaskToSummary = (raw: Record<string, unknown>): NpTaskSummary => ({
  id: String(raw['id'] ?? ''),
  list_id: raw['list_id'] != null ? String(raw['list_id']) : null,
  title: String(raw['title'] ?? ''),
  completed: Boolean(raw['completed']),
  priority: normalizePriority(raw['priority'] as string | null | undefined),
  due_date: raw['due_date'] != null ? String(raw['due_date']) : null,
  position: Number(raw['position'] ?? 0),
  source_account_id: String(raw['source_account_id'] ?? 'primary'),
  created_at: String(raw['created_at'] ?? ''),
  updated_at: String(raw['updated_at'] ?? ''),
});
