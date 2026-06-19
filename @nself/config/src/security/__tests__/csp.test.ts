/**
 * Unit tests for buildCsp() — QA-A requirement from T-P3-E1-W3-S5-T09.
 * Run: pnpm --dir packages/@nself/config test (or pnpm typecheck for type-only check)
 */

import { describe, it, expect } from 'vitest';
import { buildCsp } from '../csp';

describe('buildCsp', () => {
  const baseOpts = { hasuraUrl: 'http://localhost:8080' };

  it('always includes frame-ancestors none', () => {
    const csp = buildCsp(baseOpts);
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('always includes default-src self', () => {
    const csp = buildCsp(baseOpts);
    expect(csp).toContain("default-src 'self'");
  });

  it('always includes object-src none', () => {
    const csp = buildCsp(baseOpts);
    expect(csp).toContain("object-src 'none'");
  });

  it('always includes base-uri self', () => {
    const csp = buildCsp(baseOpts);
    expect(csp).toContain("base-uri 'self'");
  });

  it('includes hasuraUrl in connect-src', () => {
    const csp = buildCsp({ hasuraUrl: 'https://api.nself.org/v1/graphql' });
    expect(csp).toContain('https://api.nself.org/v1/graphql');
    expect(csp).toContain('connect-src');
  });

  it('includes sentryDsn in connect-src when provided', () => {
    const csp = buildCsp({
      hasuraUrl: 'http://localhost:8080',
      sentryDsn: 'https://abc@sentry.io/123',
    });
    expect(csp).toContain('https://abc@sentry.io/123');
  });

  it('omits sentryDsn from connect-src when not provided', () => {
    const csp = buildCsp(baseOpts);
    expect(csp).not.toContain('sentry.io');
    // Should not have trailing space or empty entry in connect-src
    expect(csp).not.toContain("connect-src 'self' http://localhost:8080 ;");
  });

  it('adds cdnDomains to img-src', () => {
    const csp = buildCsp({
      hasuraUrl: 'http://localhost:8080',
      cdnDomains: ['https://cdn.nself.org', 'https://images.nself.org'],
    });
    expect(csp).toContain('https://cdn.nself.org');
    expect(csp).toContain('https://images.nself.org');
  });

  it('includes nonce in script-src when provided', () => {
    const csp = buildCsp({ hasuraUrl: 'http://localhost:8080', nonce: 'abc123' });
    expect(csp).toContain("'nonce-abc123'");
  });

  it('does not include nonce in script-src when not provided', () => {
    const csp = buildCsp(baseOpts);
    expect(csp).not.toContain('nonce-');
    expect(csp).toContain("script-src 'self'");
  });

  it('always includes img-src data: for inline images', () => {
    const csp = buildCsp(baseOpts);
    expect(csp).toContain('img-src');
    expect(csp).toContain('data:');
  });

  it('always includes style-src with unsafe-inline for Tailwind', () => {
    const csp = buildCsp(baseOpts);
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  it('returns a semicolon-separated string', () => {
    const csp = buildCsp(baseOpts);
    const directives = csp.split('; ');
    expect(directives.length).toBeGreaterThan(5);
  });
});
