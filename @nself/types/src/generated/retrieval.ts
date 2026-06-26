/**
 * @nself/types — generated GraphQL types for plugin-retrieval (E7)
 *
 * Auto-generated from Hasura schema: np_embeddings, np_retrieval_index.
 * Source: plugins-pro/paid/plugin-retrieval/hasura/metadata/databases/default/tables/
 *
 * NOTE: The `embedding` column (vector(1024)) is NOT exposed via GraphQL.
 * pgvector is not yet supported in Hasura GraphQL. See .claude/docs/p4/known-gaps.md.
 */

// ─── np_embeddings ───────────────────────────────────────────────────────────

/** Row in np_embeddings — BGE-M3 vector embeddings. */
export interface NpEmbedding {
  id: string; // UUID primary key
  source_account_id: string; // Multi-App Isolation key (default: 'primary')
  content_id: string; // External content reference
  content_type: string; // Type of indexed content (e.g. 'document', 'message')
  created_at: string; // ISO-8601 timestamp
  // NOTE: embedding vector(1024) not available via GraphQL (pgvector gap)
}

/** Insert payload for np_embeddings (operator role only). */
export interface NpEmbeddingInsertInput {
  source_account_id?: string;
  content_id: string;
  content_type: string;
}

/** Where clause for np_embeddings queries. */
export interface NpEmbeddingBoolExp {
  id?: StringComparison;
  source_account_id?: StringComparison;
  content_id?: StringComparison;
  content_type?: StringComparison;
  created_at?: TimestamptzComparison;
  _and?: NpEmbeddingBoolExp[];
  _or?: NpEmbeddingBoolExp[];
  _not?: NpEmbeddingBoolExp;
}

// ─── np_retrieval_index ───────────────────────────────────────────────────────

/** Row in np_retrieval_index — RRF metadata + tsvector for hybrid search. */
export interface NpRetrievalIndex {
  id: string; // UUID primary key
  source_account_id: string; // Multi-App Isolation key
  embedding_id: string | null; // FK → np_embeddings.id
  rrf_score: number | null; // Reciprocal Rank Fusion score
  query_hash: string | null; // Hash of the query that produced this index entry
  created_at: string; // ISO-8601 timestamp
  // NOTE: tsvector_content not exposed via GraphQL (tsvector type not mappable)
}

/** Insert payload for np_retrieval_index (operator role only). */
export interface NpRetrievalIndexInsertInput {
  source_account_id?: string;
  embedding_id?: string;
  rrf_score?: number;
  query_hash?: string;
}

/** Where clause for np_retrieval_index queries. */
export interface NpRetrievalIndexBoolExp {
  id?: StringComparison;
  source_account_id?: StringComparison;
  embedding_id?: StringComparison;
  rrf_score?: FloatComparison;
  query_hash?: StringComparison;
  created_at?: TimestamptzComparison;
  _and?: NpRetrievalIndexBoolExp[];
  _or?: NpRetrievalIndexBoolExp[];
  _not?: NpRetrievalIndexBoolExp;
}

/** Object relationship: np_retrieval_index.embedding → np_embeddings */
export interface NpRetrievalIndexWithEmbedding extends NpRetrievalIndex {
  embedding?: NpEmbedding;
}

// ─── Shared comparison scalars ────────────────────────────────────────────────

export interface StringComparison {
  _eq?: string;
  _neq?: string;
  _in?: string[];
  _nin?: string[];
  _is_null?: boolean;
  _like?: string;
  _ilike?: string;
}

export interface FloatComparison {
  _eq?: number;
  _neq?: number;
  _gt?: number;
  _gte?: number;
  _lt?: number;
  _lte?: number;
  _is_null?: boolean;
}

export interface TimestamptzComparison {
  _eq?: string;
  _gt?: string;
  _gte?: string;
  _lt?: string;
  _lte?: string;
  _is_null?: boolean;
}

// ─── Hasura permission context ────────────────────────────────────────────────

/**
 * Hasura session variable required for user-role RLS on np_embeddings and np_retrieval_index.
 * The 'source_account_id' filter uses X-Hasura-Source-Account-Id.
 */
export const HASURA_SOURCE_ACCOUNT_HEADER = 'X-Hasura-Source-Account-Id';
