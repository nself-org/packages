# @nself/graphql-client

urql-based GraphQL client for nSelf — factory, exchange composition, and Hasura schema codegen pipeline.

## Overview

Every nSelf web, desktop, and mobile surface uses this package for typed GraphQL access to the Hasura backend at `api.nself.org/v1/graphql`. Built on `@urql/core` for minimal bundle size and exchange composability.

## Usage

```ts
import { NselfGraphqlClient } from '@nself/graphql-client';

// Unauthenticated (anonymous role):
const client = NselfGraphqlClient();

// With a custom endpoint (local dev):
const client = NselfGraphqlClient({ url: 'http://localhost:8080/v1/graphql' });

// With auth (wired by @nself/auth-core in W3):
import { makeAuthExchange } from '@nself/auth-core';
const client = NselfGraphqlClient({ authExchangeFn: makeAuthExchange(getTokenFn) });
```

## Admin client (server only)

`@nself/graphql-client/admin` gives app backends (CS_N services, functions) admin GraphQL access to Hasura. It is a separate sub-path: the package root `.` never imports it.

```ts
import { createAdminClient } from '@nself/graphql-client/admin';

// Server side only. Read the secret from the server environment or the vault.
const client = createAdminClient({
  url: process.env.HASURA_GRAPHQL_URL!,
  adminSecret: process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
  role: 'user',               // optional, sent as x-hasura-role
  sourceAccountId: 'app_a',   // optional, sent as x-hasura-source-account-id
});
```

Multi-app header (ADR 0004): apps that share one backend each pass their own `sourceAccountId`. It is the `source_account_id` column value that scopes rows to one app. It is not a tenant id (`tenant_id` identifies paying customers and is never sent by this client).

| Config | Header | When sent |
|--------|--------|-----------|
| `adminSecret` (required) | `x-hasura-admin-secret` | always |
| `role` | `x-hasura-role` | only when given |
| `sourceAccountId` | `x-hasura-source-account-id` | only when given |
| `headers` | as named | extra headers; the three above are reserved and rejected |

There is no default `url` and no default secret. `onError` is optional and receives a redacted `AppError`.

Safety rules:

- **Browser guard.** `createAdminClient` throws `AdminClientInBrowserError` when `globalThis.window`, `globalThis.document` or a Web/Service Worker scope (`importScripts`) exists. The check runs at call time, so importing the module in SSR code is safe. The `"browser"` export condition of `./admin` also maps to a stub that always throws, so a browser bundle never includes the real client. Edge runtimes that resolve the `browser` condition (Cloudflare Workers, Next edge) get the stub too: the client always throws there. That fails closed on purpose.
- **The secret never enters urql.** urql gets a private `fetch` closure, not `fetchOptions`. The closure adds `x-hasura-admin-secret`, `x-hasura-role` and `x-hasura-source-account-id` at the last step, only when the request URL has the configured endpoint's origin and path. Any other URL (or a call with no URL) throws `AdminClientRequestRefusedError` before any network I/O. The three headers are forced last, so a per-operation `fetchOptions` cannot change or drop them. Redirects are refused. As a result, urql debug events (`subscribeToDebugTarget`), `result.operation.context` and `fetchOptions` hold no secret.
- **No secret in errors or responses.** Config errors use fixed messages. Errors that reach `result.error` or `onError`, and JSON/text response bodies and headers, have every occurrence of the secret (raw, URL-encoded, JSON-escaped) replaced with `[REDACTED]`. `JSON.stringify(client)`, `String(client)` and `util.inspect(client)` never show headers.
- **Limits.** Other encodings of the secret (base64, hashes) are not redacted. Streaming responses (event stream, multipart) are passed through unscrubbed, so do not use this client for subscriptions or `@defer` against a server that could echo request headers.

## Exchange Stack

| Position | Exchange | Purpose |
|----------|----------|---------|
| 1 | `cacheExchange` | urql document cache |
| 2 | `errorExchange` | maps `CombinedError` → `AppError` |
| 3 | `authExchange` (optional) | JWT injection — wired by `@nself/auth-core` |
| 4 | `fetchExchange` | HTTP transport |

## Error Mapping

`CombinedError` from urql is mapped to `AppError` from `@nself/errors`:

| urql error | AppError.code |
|-----------|---------------|
| `networkError` | `'network'` (sentinel, status 503) |
| GraphQL `access-denied` / `permission-denied` | `'forbidden'` |
| GraphQL `not-found` | `'not_found'` |
| GraphQL `jwt-invalid` / `jwt-expired` | `'auth_failed'` |
| GraphQL `validation-failed` | `'validation_error'` |
| GraphQL `rate-limited` | `'rate_limited'` |
| unknown / fallback | `'internal'` |

## Codegen

The package ships a `codegen.yml` that generates fully-typed TypeScript operations from the nSelf Hasura schema snapshot.

```bash
# Regenerate typed operations from the committed schema snapshot (offline, no credentials):
pnpm --filter @nself/graphql-client codegen

# Output: src/codegen/generated/ (fragment-masking.ts, gql.ts, graphql.ts, index.ts)
```

### Refreshing the schema snapshot (codegen:live)

`src/codegen/schema.graphql` is a committed SDL snapshot generated from the staging Hasura endpoint. Refresh it when tables are added or columns change:

```bash
# Requires Hasura admin access (HASURA_GRAPHQL_ENDPOINT, e.g. http://localhost:8080):
HASURA_GRAPHQL_ENDPOINT=http://localhost:8080 \
HASURA_ADMIN_SECRET=$HASURA_STAGING_ADMIN_SECRET \
pnpm --filter @nself/graphql-client codegen:live

# Confirm no placeholder content remains:
pnpm --filter @nself/graphql-client schema:check

# Commit the updated SDL:
git add packages/@nself/graphql-client/src/codegen/schema.graphql
git commit -m "feat(packages/graphql-client): refresh SDL from Hasura introspection"
```

### Schema check (CI gate)

`scripts/check-schema.mjs` fails the build if `schema.graphql` is still the hand-written placeholder skeleton (scalars + `_health` + `_placeholder` only). A real SDL must expose `np_` table types. This gate runs automatically in `p3-workspace-ci.yml` and blocks any release where the placeholder was not replaced.

```bash
# Run locally:
pnpm --filter @nself/graphql-client schema:check
# exits 0 on a real SDL, exits 1 on the placeholder
```

The SDL currently tracks all tables from the T07 migration: `np_aicc_sessions`, `np_aicc_session_events`, `np_aigateway_keys`, `np_aigateway_routes`, `np_aigateway_quota_usage`, `np_aigateway_quota_limits`, `np_aigateway_request_log`, and the core auth/subscription/webhook tables.

## API

### `NselfGraphqlClient(config?)`

Returns a `@urql/core` `Client` instance.

```ts
interface NselfGraphqlClientConfig {
  url?: string;            // default: 'https://api.nself.org/v1/graphql'
  authExchangeFn?: AuthExchangeFn;  // optional — wired by auth-core
  onError?: (error: AppError, operation: Operation) => void;
}
```

### `combinedErrorToAppError(error)`

Convert a urql `CombinedError` to `AppError`. Used by the error exchange internally.

### `makeErrorExchange(onError?)`

Create a urql exchange that maps CombinedError → AppError and calls the optional callback.

### `buildExchanges(authExchangeFn?, onError?)`

Build the full ordered exchange array for a urql Client.

## SPORT

`F13-CROSS-REPO-DEPS.md` — `@nself/graphql-client` row: urql-based; codegen from `api.nself.org` schema.
