/**
 * NpSavedView — saved filter/sort preset for the task list view.
 * Maps to np_saved_views. Moved from web/ntask/src/lib/graphql-saved-views.ts.
 * SPORT: Part of @nself/ntask-core.
 */

export interface FilterParams {
  readonly status: 'all' | 'active' | 'completed';
  readonly priority: string;
  readonly tagIds: string[];
  readonly sortField: string;
  readonly sortDir: 'asc' | 'desc';
}

export interface NpSavedView {
  readonly id: string;
  readonly user_id: string;
  readonly name: string;
  readonly filters: FilterParams;
  readonly sort: Record<string, unknown>;
  readonly created_at: string;
}
