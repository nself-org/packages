/**
 * @nself/types — generated GraphQL types for plugin-clawde PTY sessions (E7)
 *
 * Auto-generated from Hasura schema: np_pty_sessions.
 * Source: plugins-pro/paid/plugin-clawde/hasura/metadata/databases/default/tables/
 */

// ─── np_pty_sessions ─────────────────────────────────────────────────────────

/** PTY session status values. */
export type NpPtySessionStatus = 'active' | 'closed' | 'error';

/** Row in np_pty_sessions — PTY relay session tracking for nself-ai-cc :3760. */
export interface NpPtySession {
  id: string; // UUID primary key
  source_account_id: string; // Multi-App Isolation key (default: 'primary')
  session_id: string; // Unique session identifier (TEXT UNIQUE)
  status: NpPtySessionStatus;
  started_at: string; // ISO-8601 timestamp
  ended_at: string | null; // ISO-8601 timestamp or null if still active
}

/**
 * Extended row visible to operator role (includes binary_path and args).
 * User role sees only id, source_account_id, session_id, status, started_at, ended_at.
 */
export interface NpPtySessionOperator extends NpPtySession {
  binary_path: string | null; // Path to the spawned binary (e.g. /usr/bin/claude)
  args: Record<string, unknown> | null; // JSONB args passed to the binary
}

/** Insert payload for np_pty_sessions (operator role only). */
export interface NpPtySessionInsertInput {
  source_account_id?: string;
  session_id: string;
  binary_path?: string;
  args?: Record<string, unknown>;
  status?: NpPtySessionStatus;
}

/** Update payload for np_pty_sessions (operator role only). */
export interface NpPtySessionUpdateInput {
  status?: NpPtySessionStatus;
  ended_at?: string;
}

/** Where clause for np_pty_sessions queries. */
export interface NpPtySessionBoolExp {
  id?: StringComparison;
  source_account_id?: StringComparison;
  session_id?: StringComparison;
  status?: StringComparison;
  started_at?: TimestamptzComparison;
  ended_at?: TimestamptzComparison;
  _and?: NpPtySessionBoolExp[];
  _or?: NpPtySessionBoolExp[];
  _not?: NpPtySessionBoolExp;
}

// ─── Shared comparison scalars (local to this file) ──────────────────────────

interface StringComparison {
  _eq?: string;
  _neq?: string;
  _in?: string[];
  _nin?: string[];
  _is_null?: boolean;
}

interface TimestamptzComparison {
  _eq?: string;
  _gt?: string;
  _gte?: string;
  _lt?: string;
  _lte?: string;
  _is_null?: boolean;
}

// ─── Hasura permission context ────────────────────────────────────────────────

/**
 * Hasura session variable required for user-role RLS on np_pty_sessions.
 * The 'source_account_id' filter uses X-Hasura-Source-Account-Id.
 */
export const HASURA_SOURCE_ACCOUNT_HEADER = 'X-Hasura-Source-Account-Id';
