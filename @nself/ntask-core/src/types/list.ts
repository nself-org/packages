/**
 * NpList — canonical ɳTask list domain type.
 * Purpose: Replaces bespoke TaskList definitions across mobile and web surfaces.
 * Constraints: user_id not owner_id — matches the actual np_lists column name.
 * SPORT: Part of @nself/ntask-core.
 */

/** Full np_lists row. */
export interface NpList {
  readonly id: string;
  readonly user_id: string;
  readonly title: string;
  readonly description: string;
  readonly color: string;
  readonly icon: string;
  readonly is_default: boolean;
  readonly position: number;
  readonly group_id: string | null;
  readonly source_account_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CreateListInput {
  readonly title: string;
  readonly color?: string;
  readonly icon?: string;
  readonly description?: string;
  readonly group_id?: string;
  readonly position?: number;
}

export type UpdateListInput = Partial<
  Pick<NpList, 'title' | 'color' | 'icon' | 'description' | 'position' | 'group_id'>
>;
