/**
 * @nself/observability — Unified observability entry point.
 *
 * Purpose: Single call at app startup to initialise error reporting (Sentry)
 *          and distributed tracing (OTel). Each surface passes only the config
 *          it needs; missing configs are silently no-oped.
 * Inputs:  ObservabilityConfig — optional sentry and/or otel sub-configs.
 * Outputs: void (registers Sentry + OTel providers as side effects when configured).
 * Constraints:
 *   - No throws — all missing config branches are graceful no-ops.
 *   - Apps must NOT call Sentry.init or OTel directly; always call initObservability().
 *   - PII scrubbing runs unconditionally via Sentry's beforeSend hook.
 *   - Sentry platform SDK is injected by the caller — this package has no direct
 *     Sentry import, keeping it platform-agnostic.
 * SPORT: F08-SERVICE-INVENTORY.md (@nself/observability)
 */

import { initSentry } from './sentry.js';
import type { SentryConfig, SentrySdk, AppKind } from './sentry.js';
import { initOtel } from './otel.js';
import type { OtelConfig } from './otel.js';

export type { SentryConfig, SentrySdk, AppKind };
export type { OtelConfig };
export { scrubEvent, scrubPatterns } from './pii.js';

/** Combined observability configuration. Both fields are optional. */
export interface ObservabilityConfig {
  /**
   * Sentry configuration. Omit entirely to skip Sentry initialisation.
   * Must include the platform-specific Sentry SDK (sdk field on SentryConfig).
   * Provide a config with an empty dsn to also skip (graceful no-op).
   */
  readonly sentry?: SentryConfig;
  /**
   * OpenTelemetry configuration. Omit entirely to skip OTel initialisation.
   * Provide a config with an empty serviceName to also skip (graceful no-op).
   */
  readonly otel?: OtelConfig;
}

/**
 * Initialise all observability subsystems at application startup.
 *
 * Call once, as early as possible, before any user interactions. Safe to call
 * with an empty config — all subsystems are optional and gracefully no-op.
 *
 * @example
 * // Web app — Sentry only (inject the browser SDK)
 * import * as Sentry from '@sentry/browser';
 * initObservability({
 *   sentry: { sdk: Sentry, dsn: process.env.SENTRY_DSN, environment: 'production', release: '1.1.1', appKind: 'web' },
 * });
 *
 * @example
 * // Server — both Sentry and OTel
 * import * as Sentry from '@sentry/node';
 * initObservability({
 *   sentry: { sdk: Sentry, dsn: process.env.SENTRY_DSN, environment: 'production', release: '1.1.1', appKind: 'server' },
 *   otel:   { serviceName: 'ntask-api', endpoint: process.env.NSELF_OTEL_ENDPOINT },
 * });
 *
 * @example
 * // Minimal — no-op (no config provided)
 * initObservability({});
 *
 * @param config - Optional Sentry and/or OTel configuration.
 */
export function initObservability(config: ObservabilityConfig): void {
  if (config.sentry) {
    initSentry(config.sentry);
  }
  if (config.otel) {
    initOtel(config.otel);
  }
}
