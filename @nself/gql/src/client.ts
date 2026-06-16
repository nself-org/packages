/**
 * @nself/gql — createNSelfClient factory.
 *
 * Purpose: Single entry point for all nSelf app GraphQL access. Wraps
 *          graphql-request, injects x-hasura-* session headers automatically,
 *          and returns typed query/mutate helpers that never throw.
 * Inputs:  NSelfClientConfig — endpoint URL + getSession callback + optional tenant flag.
 * Outputs: NSelfClient object with query() and mutate() methods.
 * Constraints:
 *   - getSession() is awaited before EVERY request — no stale session risk.
 *   - Null session always throws AppError code='auth_failed' before any network call.
 *   - x-hasura-admin-secret MUST NOT appear here or anywhere in this file.
 *   - Returns Result<T, AppError> — never throws; all errors are wrapped.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/gql (client-implemented)
 */

import { GraphQLClient } from 'graphql-request';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { ok, err } from '@nself/types';
import type { Result, AppError } from '@nself/types';
import type { NSelfClientConfig, SessionHeaders } from './types.js';

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * buildSessionHeaders — map a live Session to the x-hasura-* header set.
 *
 * Always injects role, user-id, and source-account-id.
 * Injects tenant-id only when useTenantIsolation=true AND session.tenant_id is set.
 */
function buildSessionHeaders(
  session: { user: { role: string }; user_id: string; source_account_id: string; tenant_id?: string },
  useTenantIsolation: boolean,
): SessionHeaders {
  const headers: {
    'x-hasura-role': string;
    'x-hasura-user-id': string;
    'x-hasura-source-account-id': string;
    'x-hasura-tenant-id'?: string;
  } = {
    'x-hasura-role': session.user.role,
    'x-hasura-user-id': session.user_id,
    'x-hasura-source-account-id': session.source_account_id,
  };

  if (useTenantIsolation && session.tenant_id !== undefined) {
    headers['x-hasura-tenant-id'] = session.tenant_id;
  }

  return headers;
}

/**
 * wrapGraphQLError — convert any error thrown by graphql-request into an AppError.
 *
 * graphql-request throws ClientError for both HTTP/network failures and GraphQL
 * error arrays. We map both to typed AppError variants so callers stay in the
 * Result pattern.
 */
function wrapGraphQLError(error: unknown): AppError {
  // graphql-request ClientError has a .response.errors array for GraphQL errors
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as { response?: { errors?: Array<{ message?: string }> } }).response;
    if (response?.errors && response.errors.length > 0) {
      const firstMessage = response.errors[0]?.message ?? 'GraphQL error';
      return {
        code: 'internal',
        message: firstMessage,
        status: 500,
      };
    }
  }

  // Network / fetch errors
  const message =
    error instanceof Error ? error.message : 'Unknown network error';
  return {
    code: 'internal',
    message,
    status: 500,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * NSelfClient — the object returned by createNSelfClient.
 *
 * Both query() and mutate() accept a TypedDocumentNode (produced by codegen)
 * and optional variables, then return Result<T, AppError>. They never throw.
 */
export interface NSelfClient {
  /**
   * Execute a GraphQL query.
   * Automatically injects x-hasura-* session headers.
   * Returns Err(AppError{code:'auth_failed'}) if the session is null.
   */
  query<TData, TVariables extends Record<string, unknown> = Record<string, never>>(
    document: TypedDocumentNode<TData, TVariables>,
    variables?: TVariables,
  ): Promise<Result<TData, AppError>>;

  /**
   * Execute a GraphQL mutation.
   * Automatically injects x-hasura-* session headers.
   * Returns Err(AppError{code:'auth_failed'}) if the session is null.
   */
  mutate<TData, TVariables extends Record<string, unknown> = Record<string, never>>(
    document: TypedDocumentNode<TData, TVariables>,
    variables?: TVariables,
  ): Promise<Result<TData, AppError>>;
}

/**
 * createNSelfClient — factory for the nSelf thin GraphQL client.
 *
 * Usage:
 * ```ts
 * const client = createNSelfClient({
 *   endpoint: process.env.HASURA_GRAPHQL_URL!,
 *   getSession: () => fetchSession(),       // web: reads /api/session
 *   useTenantIsolation: false,              // only true for Cloud SaaS surfaces
 * });
 * const result = await client.query(GetUserDocument, { id: userId });
 * ```
 *
 * @param config  NSelfClientConfig — endpoint, getSession, and optional tenant flag.
 * @returns       NSelfClient with typed query() and mutate() helpers.
 */
export function createNSelfClient(config: NSelfClientConfig): NSelfClient {
  const { endpoint, getSession, useTenantIsolation = false } = config;

  /**
   * execute — shared inner implementation for query and mutate.
   * Awaits getSession, builds headers, delegates to graphql-request.
   */
  async function execute<TData, TVariables extends Record<string, unknown>>(
    document: TypedDocumentNode<TData, TVariables>,
    variables?: TVariables,
  ): Promise<Result<TData, AppError>> {
    // 1. Await session — MUST be async-first (never cached synchronously)
    let session: Awaited<ReturnType<typeof getSession>>;
    try {
      session = await getSession();
    } catch (sessionError) {
      return err<AppError>({
        code: 'internal',
        message: sessionError instanceof Error
          ? sessionError.message
          : 'Session retrieval failed',
        status: 500,
      });
    }

    // 2. Null session → auth_failed immediately, no network call
    if (session === null) {
      return err<AppError>({
        code: 'auth_failed',
        message: 'No active session — user must authenticate before making GraphQL requests.',
        status: 401,
      });
    }

    // 3. Build x-hasura-* headers from live session
    const sessionHeaders = buildSessionHeaders(session, useTenantIsolation);

    // 4. Create a per-request GraphQLClient with injected headers.
    //    Headers are cast to HeadersInit (Record<string, string> is compatible).
    //    Per-request client avoids shared mutable state across concurrent calls.
    const gqlClient = new GraphQLClient(endpoint, {
      headers: sessionHeaders as unknown as HeadersInit,
    });

    // 5. Execute the request — wrap all errors; never throw.
    //    graphql-request v7's request() uses rest-arg variablesAndRequestHeaders.
    //    We use the positional form: (document, variables) where variables is
    //    cast to `object` (the Variables constraint from graphql-request).
    //    When no variables are provided we omit the second arg entirely.
    try {
      const data = variables !== undefined
        ? await gqlClient.request<TData>(document, variables as object)
        : await gqlClient.request<TData>(document);
      return ok(data);
    } catch (requestError) {
      return err(wrapGraphQLError(requestError));
    }
  }

  return {
    query: execute,
    mutate: execute,
  };
}
