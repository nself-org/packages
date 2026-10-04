/**
 * @nself/graphql-client/admin — server-only admin GraphQL client.
 *
 * Purpose: Give app backends (CS_N services, functions) admin GraphQL access to
 *          Hasura with the multi-app header (ADR 0004), in one place that owns
 *          the browser guard and secret hygiene.
 * Inputs:  AdminClientConfig — url, adminSecret, optional role, sourceAccountId,
 *          headers and onError.
 * Outputs: createAdminClient (returns a urql Client), AdminClientInBrowserError,
 *          AdminClientConfigError, AdminClientConfig.
 * Constraints:
 *   - Not re-exported from the package root: only this sub-path reaches it, and
 *     the "browser" export condition maps it to browser.ts (always throws).
 *   - The guard runs at call time, not import time, so server bundles that
 *     tree-shake stay importable in SSR.
 *   - The secret lives only in closures. Errors, onError payloads, toString,
 *     JSON and util.inspect of the client never contain it.
 *   - No default secret and no default endpoint.
 *   - `sourceAccountId` (app wall) is never interchanged with `tenant_id`.
 * SPORT: cap:packages.admin-graphql-client (P7-ADOPT-09, EPIC ADOPT D14)
 */

import { Client, fetchExchange, mapExchange, type Operation } from '@urql/core';
import type { AppError } from '@nself/errors';
import { buildExchanges, type OnError } from '../exchanges.js';
import { AdminClientConfigError, AdminClientInBrowserError } from './errors.js';
import { makeRedactor } from './redact.js';
import type { AdminClientConfig } from './types.js';

export { AdminClientConfigError, AdminClientInBrowserError } from './errors.js';
export type { AdminClientConfig } from './types.js';

/** Header names owned by this client; `config.headers` may not set them. */
const SECRET_HEADER = 'x-hasura-admin-secret';
const ROLE_HEADER = 'x-hasura-role';
const SOURCE_ACCOUNT_HEADER = 'x-hasura-source-account-id';
const RESERVED = new Set([SECRET_HEADER, ROLE_HEADER, SOURCE_ACCOUNT_HEADER]);

/** Latin-1 printable plus tab: what a fetch header value may hold. */
const HEADER_VALUE_OK = /^[\t\x20-\x7e\x80-\xff]*$/;

/**
 * AdminOnError — onError callback accepted by createAdminClient. Receives an
 * already-redacted AppError and an Operation with `context.fetchOptions` removed.
 */
export type AdminOnError = OnError;

/** Config plus the optional error callback (kept off the shared config type). */
export type AdminClientOptions = AdminClientConfig & { readonly onError?: AdminOnError };

function requireString(field: string, v: unknown, optional: boolean): string | undefined {
  if (v === undefined && optional) return undefined;
  if (typeof v !== 'string' || v.trim().length === 0) {
    throw new AdminClientConfigError(field, 'must be a non-empty string');
  }
  if (!HEADER_VALUE_OK.test(v)) {
    throw new AdminClientConfigError(field, 'contains characters not allowed in a header');
  }
  return v;
}

function validateUrl(v: unknown): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new AdminClientConfigError('url', 'must be a non-empty string');
  }
  let parsed: URL;
  try {
    parsed = new URL(v);
  } catch {
    throw new AdminClientConfigError('url', 'must be an absolute URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new AdminClientConfigError('url', 'must use http or https');
  }
  return v;
}

function validateHeaders(v: unknown): Record<string, string> {
  if (v === undefined) return {};
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new AdminClientConfigError('headers', 'must be an object of strings');
  }
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(v)) {
    if (RESERVED.has(name.toLowerCase())) {
      throw new AdminClientConfigError('headers', 'must not set an admin header');
    }
    if (typeof value !== 'string' || !HEADER_VALUE_OK.test(value)) {
      throw new AdminClientConfigError('headers', 'must hold header-safe string values');
    }
    out[name] = value;
  }
  return out;
}

/**
 * createAdminClient — build a urql Client that calls Hasura as admin.
 *
 * Sends `x-hasura-admin-secret`, plus `x-hasura-role` and
 * `x-hasura-source-account-id` when given (an omitted value sends no header).
 * Uses the package exchange stack (cache, error mapping, fetch) with a redaction
 * exchange next to the transport, so a CombinedError that reaches the caller has
 * the secret scrubbed from its messages.
 *
 * Usage:
 * ```ts
 * const client = createAdminClient({
 *   url: process.env.HASURA_GRAPHQL_URL!,
 *   adminSecret: process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
 *   sourceAccountId: 'app_a',
 * });
 * ```
 *
 * @throws AdminClientInBrowserError when `window` or `document` is defined.
 * @throws AdminClientConfigError    when the config is invalid (value never shown).
 */
export function createAdminClient(config: AdminClientOptions): Client {
  if (typeof globalThis.window !== 'undefined' || typeof globalThis.document !== 'undefined') {
    throw new AdminClientInBrowserError();
  }
  if (typeof config !== 'object' || config === null) {
    throw new AdminClientConfigError('config', 'must be an object');
  }

  const url = validateUrl(config.url);
  const secret = requireString('adminSecret', config.adminSecret, false) as string;
  const role = requireString('role', config.role, true);
  const sourceAccountId = requireString('sourceAccountId', config.sourceAccountId, true);
  const extra = validateHeaders(config.headers);
  const userOnError = config.onError;
  const redact = makeRedactor(secret);

  // Headers are built per request inside the closure; no object holding the
  // secret is stored on the client or on any operation context.
  const fetchOptions = (): RequestInit => {
    const headers: Record<string, string> = { ...extra, [SECRET_HEADER]: secret };
    if (role !== undefined) headers[ROLE_HEADER] = role;
    if (sourceAccountId !== undefined) headers[SOURCE_ACCOUNT_HEADER] = sourceAccountId;
    return { headers };
  };

  const redactedOnError: OnError = (error: AppError, operation: Operation) => {
    if (userOnError === undefined) return;
    // The operation context carries the fetchOptions closure; hand out a copy without it.
    const safeOp = {
      ...operation,
      context: { ...operation.context, fetchOptions: undefined },
    } as unknown as Operation;
    userOnError(redact.value(error), safeOp);
  };

  const redactExchange = mapExchange({
    onResult(result) {
      if (!result.error) return result;
      return { ...result, error: redact.combinedError(result.error) };
    },
  });

  // Stack: cache -> error mapping -> redaction -> fetch. Results travel the other
  // way, so the secret is scrubbed before the error exchange sees a result.
  const exchanges = buildExchanges(undefined, redactedOnError);
  const last = exchanges.length - 1;
  if (exchanges[last] !== fetchExchange) {
    throw new AdminClientConfigError('exchanges', 'stack must end with fetchExchange');
  }
  exchanges.splice(last, 0, redactExchange);

  const client = new Client({ url, exchanges, fetchOptions });

  // Safe serialisation: non-enumerable so they never show up as keys.
  const label = '[nSelf AdminClient]';
  const origin = new URL(url).origin;
  const inspectSymbol = Symbol.for('nodejs.util.inspect.custom');
  Object.defineProperties(client, {
    toJSON: { value: () => ({ kind: 'nself.AdminClient', origin }) },
    toString: { value: () => label },
    [inspectSymbol]: { value: () => label },
  });
  return client;
}
