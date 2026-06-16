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

The package ships a `codegen.yml` that generates fully-typed TypeScript operations from the nSelf Hasura schema.

```bash
# Regenerate from schema snapshot (no credentials required):
pnpm --filter @nself/graphql-client codegen

# Output: src/codegen/generated/ (fragment-masking.ts, gql.ts, graphql.ts, index.ts)
```

Schema snapshot is at `src/codegen/schema.graphql`. Update it by running codegen against the live endpoint with `HASURA_GRAPHQL_ADMIN_SECRET` set (update `codegen.yml` schema source temporarily).

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
