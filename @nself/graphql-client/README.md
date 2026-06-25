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
# Requires staging Hasura access:
HASURA_GRAPHQL_ENDPOINT=http://167.235.233.65:8080 \
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
