/**
 * @nself/observability — OpenTelemetry trace provider setup.
 *
 * Purpose: Bootstrap an OTel BatchSpanProcessor that exports traces to the
 *          nSelf backend OTel collector (OTLP/HTTP over Zipkin-compatible
 *          endpoint) with a single initOtel() call at app startup.
 * Inputs:  OtelConfig — serviceName, optional endpoint override.
 * Outputs: void (registers the OTel NodeTracerProvider globally as a side effect).
 * Constraints:
 *   - Uses NSELF_OTEL_ENDPOINT env var if endpoint is not provided.
 *   - Falls back to 'http://api.nself.org/v1/otlp' if neither is set.
 *   - No-ops gracefully when serviceName is absent or empty.
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

/** Configuration for OTel trace provider initialisation. */
export interface OtelConfig {
  /** Logical service name (e.g. 'ntask-web', 'nchat-api'). */
  readonly serviceName: string;
  /**
   * OTel collector endpoint URL. Defaults to NSELF_OTEL_ENDPOINT env var,
   * then 'http://api.nself.org/v1/otlp'.
   */
  readonly endpoint?: string;
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
  const { serviceName } = config;

  if (!serviceName) return;

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
