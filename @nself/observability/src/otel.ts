/**
 * @nself/observability — OpenTelemetry trace provider setup.
 *
 * Purpose: Bootstrap an OTel BatchSpanProcessor that exports traces to the
 *          nSelf backend OTel collector (OTLP/HTTP over Zipkin-compatible
 *          endpoint) with a single initOtel() call at app startup.
 * Inputs:  OtelConfig — serviceName, optional endpoint override, optional appKind.
 * Outputs: void (registers the OTel NodeTracerProvider globally as a side effect).
 * Constraints:
 *   - Uses NSELF_OTEL_ENDPOINT env var if endpoint is not provided.
 *   - Falls back to 'http://api.nself.org/v1/otlp' if neither is set.
 *   - No-ops gracefully when serviceName is absent or empty.
 *   - NODE/SERVER ONLY: the NodeTracerProvider + Zipkin exporter depend on Node
 *     core modules (async_hooks/events) and MUST NOT run in a browser bundle.
 *     initOtel() detects a browser runtime (and a non-'server' appKind) and
 *     no-ops there, so web SPAs (ntask/cloud/nsentry) do not throw at runtime or
 *     ship the Node OTel SDK into the client bundle. A browser-safe
 *     WebTracerProvider/OTLP-HTTP path is a separate follow-up.
 *   - Only imports OTel SDK — no Sentry coupling.
 * SPORT: F08-SERVICE-INVENTORY.md (@nself/observability — OTel trace provider)
 */

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/** Default OTel collector endpoint used when no override is provided. */
const DEFAULT_OTEL_ENDPOINT = 'http://api.nself.org/v1/otlp';

/** Runtime surface this OTel setup is running on. Only 'server'/'node' trace. */
export type OtelAppKind = 'web' | 'native' | 'desktop' | 'server' | 'node';

/** Configuration for OTel trace provider initialisation. */
export interface OtelConfig {
  /** Logical service name (e.g. 'ntask-web', 'nchat-api'). */
  readonly serviceName: string;
  /**
   * OTel collector endpoint URL. Defaults to NSELF_OTEL_ENDPOINT env var,
   * then 'http://api.nself.org/v1/otlp'.
   */
  readonly endpoint?: string;
  /**
   * Runtime surface. The Node OTel SDK only runs on 'server'/'node'; any other
   * value (or a detected browser runtime) makes initOtel a no-op. Defaults to
   * 'server' for backward compatibility with existing server callers.
   */
  readonly appKind?: OtelAppKind;
}

/**
 * isNodeRuntime — true only in a real Node process (not a browser/JSDOM bundle).
 * Guards the Node-only tracer provider from running in web SPAs.
 */
function isNodeRuntime(): boolean {
  const hasWindow = typeof globalThis !== 'undefined' && 'window' in globalThis;
  const hasNodeProcess =
    typeof process !== 'undefined' &&
    !!(process as { versions?: { node?: string } }).versions?.node;
  return hasNodeProcess && !hasWindow;
}

/**
 * Initialise the OpenTelemetry trace provider with a BatchSpanProcessor and
 * ZipkinExporter pointing at the nSelf OTel collector.
 *
 * Safe to call multiple times — subsequent calls with the same serviceName are
 * no-ops (the provider will already be registered). Pass an empty or missing
 * serviceName to skip initialisation entirely.
 *
 * @param config - OTel initialisation options.
 */
export function initOtel(config: OtelConfig): void {
  const { serviceName, appKind = 'server' } = config;

  if (!serviceName) return;

  // NODE/SERVER ONLY: never run the Node tracer provider in a browser surface —
  // it pulls Node core modules (async_hooks/events) that break web bundles.
  const serverKind = appKind === 'server' || appKind === 'node';
  if (!serverKind || !isNodeRuntime()) return;

  // Resolve endpoint: explicit arg → env var → built-in default
  const endpoint =
    config.endpoint ??
    (typeof process !== 'undefined' ? process.env['NSELF_OTEL_ENDPOINT'] : undefined) ??
    DEFAULT_OTEL_ENDPOINT;

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  });

  const exporter = new ZipkinExporter({ url: endpoint });

  const provider = new NodeTracerProvider({ resource });
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  provider.register();
}
