# @nself/observability

Shared observability layer for all nSelf apps. Provides:

- **Sentry DSN factory** — `initSentry()` with platform-agnostic SDK injection
- **OTel trace provider** — `initOtel()` pointing at the nSelf OTel collector
- **PII scrubber** — `scrubEvent()` strips emails, UUID v4, and device tokens before any event leaves the client

## Usage

Call `initObservability()` once at app startup:

```ts
import * as Sentry from '@sentry/browser'; // or @sentry/node, @sentry/react-native
import { initObservability } from '@nself/observability';

initObservability({
  sentry: {
    sdk: Sentry,
    dsn: process.env.SENTRY_DSN ?? '',
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.APP_VERSION ?? '0.0.0',
    appKind: 'web', // 'web' | 'native' | 'desktop' | 'server'
  },
  otel: {
    serviceName: 'ntask-web',
    // endpoint defaults to NSELF_OTEL_ENDPOINT env var or http://api.nself.org/v1/otlp
  },
});
```

Both `sentry` and `otel` are optional — omit either to skip that subsystem.

## PII Policy

`scrubEvent` runs unconditionally as Sentry's `beforeSend` hook. It redacts:

| Pattern | Replacement |
|---|---|
| Email addresses | `[email]` |
| UUID v4 values | `[uuid]` |
| 10–16 digit sequences (device tokens, phone numbers) | `[token]` |

Session replay is **never** included in any Sentry integration list (privacy policy).

## Sentry SDK injection

This package does **not** import any Sentry platform package. You pass the platform SDK via `SentryConfig.sdk`. This keeps the package agnostic and avoids bundling the wrong Sentry adapter:

```ts
// Web
import * as Sentry from '@sentry/browser';
// React Native
import * as Sentry from '@sentry/react-native';
// Node/server
import * as Sentry from '@sentry/node';

initObservability({ sentry: { sdk: Sentry, ... } });
```

## Exports

```ts
export function initObservability(config: ObservabilityConfig): void;
export function initSentry(config: SentryConfig): void;
export function initOtel(config: OtelConfig): void;
export function scrubEvent(event: Record<string, unknown>): Record<string, unknown>;
export const scrubPatterns: ReadonlyArray<{ pattern: RegExp; replacement: string }>;

export type { ObservabilityConfig, SentryConfig, SentrySdk, AppKind, OtelConfig };
```
