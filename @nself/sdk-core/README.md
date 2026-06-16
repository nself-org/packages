# @nself/sdk-core

Base SDK thin-client for nSelf. Provides `NselfClient` (transport config, base fetch with retry/timeout), environment detection, and API URL resolution. All higher-level `@nself/*` packages accept an `NselfClient` instance.

## Install

```bash
pnpm add @nself/sdk-core
```

## Usage

```ts
import { NselfClient } from '@nself/sdk-core';
import type { Result } from '@nself/sdk-core';

const client = new NselfClient({
  apiUrl: 'https://api.nself.org',  // optional — reads VITE_NSELF_API_URL or NSELF_API_URL env var
  retries: 2,
  timeout: 10_000,
});

const result: Result<User> = await client.fetch<User>('/v1/me', {
  headers: { Authorization: `Bearer ${token}` },
});

if (result._tag === 'Ok') {
  console.log(result.value);
} else {
  console.error(result.error.code, result.error.message);
}
```

## Config Options

| Option | Type | Default | Description |
|---|---|---|---|
| `apiUrl` | `string` | `resolveApiUrl()` | Base API URL. Reads `VITE_NSELF_API_URL` → `NSELF_API_URL` → `https://api.nself.org` |
| `environment` | `NselfEnvironment` | `detectEnvironment()` | Force environment: `web \| native \| desktop \| server` |
| `timeout` | `number` | `10_000` | Request timeout in milliseconds |
| `retries` | `number` | `1` | Retry count for network-level failures (not 4xx/5xx) |

## API

### `NselfClient`

Main class. Instantiate per-request or per-session — **no global singleton**.

- `client.config` — Resolved `ResolvedNselfClientConfig`
- `client.fetch<T>(path, options?)` → `Promise<Result<T, AppError>>`

### `baseFetch<T>(url, options?)`

Low-level fetch wrapper. Used by `NselfClient.fetch` internally.

- Retries only on network failures (e.g., offline, DNS failure)
- Maps HTTP 401/402/403/404/422/429/5xx to typed `AppError` codes
- Wraps timeout via `AbortController`
- Never throws — always returns `Result<T, AppError>`

### Environment utilities

```ts
import { isBrowser, isNative, isDesktop, isServer, detectEnvironment } from '@nself/sdk-core';
```

### URL utilities

```ts
import { resolveApiUrl, resolveStagingUrl, PROD_API_URL, STAGING_API_URL } from '@nself/sdk-core';
```

## Re-exports

All of `@nself/errors` is re-exported for convenience:
```ts
import { ok, err, isOk, isErr, mapResult, chainResult, type Result, type AppError } from '@nself/sdk-core';
```

## License

MIT
