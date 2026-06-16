/**
 * @nself/observability — Sentry DSN factory and initialisation helper.
 *
 * Purpose: Provide a single initSentry() call that configures Sentry correctly
 *          for each runtime surface (web browser, React Native, Tauri desktop,
 *          server-side Node). The caller passes a DSN from environment variables
 *          — no DSN values are hardcoded here.
 *
 *          Because Sentry SDK is platform-specific (browser vs node vs native),
 *          the caller passes the platform's Sentry module as `sdk`. This avoids
 *          bundling the wrong platform SDK — each app imports its own
 *          (@sentry/browser, @sentry/react-native, etc.) and hands it in.
 *
 * Inputs:  SentryConfig — dsn, environment, release, appKind, sdk.
 * Outputs: void (delegates to sdk.init as a side effect when dsn is present).
 * Constraints:
 *   - Session replay is NEVER added to any integration list (privacy policy).
 *   - scrubEvent is always applied as beforeSend (PII scrubber runs unconditionally).
 *   - No-ops gracefully when dsn is absent or empty.
 *   - No runtime import of any Sentry platform package from this file.
 * SPORT: F08-SERVICE-INVENTORY.md (@nself/observability — Sentry init)
 */

import { scrubEvent } from './pii.js';

/** Which runtime surface this process is running on. */
export type AppKind = 'web' | 'native' | 'desktop' | 'server';

/**
 * Minimal Sentry SDK interface required by initSentry.
 * Matches the public API of @sentry/browser, @sentry/node, @sentry/react-native, etc.
 *
 * Note: We use minimal typing here to avoid type conflicts between platform-specific SDKs.
 * The `init` method accepts platform-specific options, so we accept `Record<string, any>`.
 */
export interface SentrySdk {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  init(options: Record<string, any>): void;
}

/** Configuration for Sentry initialisation. */
export interface SentryConfig {
  /**
   * Platform-specific Sentry SDK module. Pass the module you imported at app startup,
   * e.g. `import * as Sentry from '@sentry/browser'` or `@sentry/react-native`.
   * Never imported by this package directly.
   */
  readonly sdk: SentrySdk;
  /** Sentry project DSN. Injected via env var — never hardcode. */
  readonly dsn: string;
  /** Deployment environment label (e.g. 'production', 'staging', 'development'). */
  readonly environment: string;
  /** Release string (e.g. '1.1.1'). */
  readonly release: string;
  /** Runtime surface determines which integrations are enabled. */
  readonly appKind: AppKind;
  /**
   * Sample rate for performance traces (0–1). Defaults to 0.1 in production,
   * 1.0 in all other environments.
   */
  readonly tracesSampleRate?: number;
}

/**
 * Common noise errors to suppress across all surfaces.
 * These are browser/native platform quirks that generate false positives.
 */
const IGNORE_ERRORS: ReadonlyArray<string | RegExp> = [
  // Network-level noise
  'Network request failed',
  'Failed to fetch',
  'Load failed',
  // ResizeObserver loop warnings (benign browser artifact)
  /ResizeObserver loop/,
  // iOS WebView safe-area bridge chatter
  'Non-Error promise rejection captured',
  // Cancelled navigation (user tapped Back before load finished)
  'AbortError',
];

/**
 * Initialise Sentry for the given runtime surface.
 *
 * Safe to call when dsn is empty — init is skipped (no-op).
 * Session replay is intentionally excluded from all integration lists.
 *
 * @param config - Surface-specific Sentry configuration including the platform SDK.
 */
export function initSentry(config: SentryConfig): void {
  const { sdk, dsn, environment, release, appKind, tracesSampleRate } = config;

  if (!dsn) return;

  const defaultTracesSampleRate = environment === 'production' ? 0.1 : 1.0;

  sdk.init({
    dsn,
    environment,
    release,
    tracesSampleRate: tracesSampleRate ?? defaultTracesSampleRate,
    ignoreErrors: [...IGNORE_ERRORS],

    // PII scrubber always runs — strip emails, UUIDs, device tokens
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    beforeSend(event: any) {
      return scrubEvent(event);
    },
  });

  // Log at debug level so operators can confirm initialisation without PII
  if (environment !== 'production') {
    // eslint-disable-next-line no-console -- intentional debug tracing in non-prod
    console.debug(`[observability] Sentry initialised — ${appKind}@${environment} r${release}`);
  }
}
