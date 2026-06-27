/**
 * List mappers — convert raw Hasura GQL np_lists fragments to NpList.
 * SPORT: Part of @nself/ntask-core.
 */

import type { NpList } from '../types/list.js';

export const mapGqlListToNpList = (raw: Record<string, unknown>): NpList => ({
  id: String(raw['id'] ?? ''),
  user_id: String(raw['user_id'] ?? ''),
  title: String(raw['title'] ?? ''),
  description: String(raw['description'] ?? ''),
  color: String(raw['color'] ?? '#6366f1'),
  icon: String(raw['icon'] ?? 'list'),
  is_default: Boolean(raw['is_default']),
  position: Number(raw['position'] ?? 0),
  group_id: raw['group_id'] != null ? String(raw['group_id']) : null,
  source_account_id: String(raw['source_account_id'] ?? 'primary'),
  created_at: String(raw['created_at'] ?? ''),
  updated_at: String(raw['updated_at'] ?? ''),
});
