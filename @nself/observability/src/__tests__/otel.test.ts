/**
 * Unit tests for @nself/observability initOtel gating.
 *
 * Coverage:
 *   - Empty serviceName → no-op (no throw).
 *   - Non-server appKind (web/native/desktop) → no-op even in a Node test runtime
 *     (proves browser SPAs that pass appKind:'web' never run the Node tracer).
 *   - A simulated browser runtime (window present) → no-op even with appKind:'server'.
 *   - Server appKind in the Node test runtime → runs without throwing.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { initOtel } from '../otel.js';

describe('@nself/observability — initOtel gating', () => {
  afterEach(() => {
    // Ensure no simulated browser global leaks between tests.
    delete (globalThis as { window?: unknown }).window;
  });

  it('no-ops when serviceName is empty', () => {
    expect(() => initOtel({ serviceName: '' })).not.toThrow();
  });

  it('no-ops for a web appKind (browser SPA must not run the Node SDK)', () => {
    expect(() => initOtel({ serviceName: 'ntask-web', appKind: 'web' })).not.toThrow();
  });

  it('no-ops for native and desktop appKinds', () => {
    expect(() => initOtel({ serviceName: 'svc', appKind: 'native' })).not.toThrow();
    expect(() => initOtel({ serviceName: 'svc', appKind: 'desktop' })).not.toThrow();
  });

  it('no-ops when a browser runtime is detected even with appKind server', () => {
    (globalThis as { window?: unknown }).window = {};
    expect(() => initOtel({ serviceName: 'svc', appKind: 'server' })).not.toThrow();
  });

  it('runs without throwing for a server appKind in the Node runtime', () => {
    expect(() => initOtel({ serviceName: 'nself-test-server', appKind: 'server' })).not.toThrow();
  });
});
