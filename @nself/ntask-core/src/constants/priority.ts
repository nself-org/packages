/**
 * Priority display helpers.
 * Purpose: Consistent sort order and display labels across all surfaces.
 * Constraints: PRIORITY_ORDER values must match sort logic in Hasura order_by.
 * SPORT: Part of @nself/ntask-core.
 */

import type { Priority } from '../types/enums.js';

/** Numeric sort weight for each priority value (ascending = low-priority first). */
export const PRIORITY_ORDER: Readonly<Record<Priority, number>> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

/** English display labels for each priority. */
export const PRIORITY_LABELS_EN: Readonly<Record<Priority, string>> = {
  none: 'No Priority',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/** Tailwind color class pairs for priority badges (background / text). */
export const PRIORITY_COLORS: Readonly<Record<Priority, { bg: string; text: string }>> = {
  none: { bg: 'bg-gray-100', text: 'text-gray-500' },
  low: { bg: 'bg-blue-100', text: 'text-blue-700' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700' },
};

/** Sort tasks by priority descending (urgent first). */
export const comparePriority = (a: Priority, b: Priority): number =>
  PRIORITY_ORDER[b] - PRIORITY_ORDER[a];
