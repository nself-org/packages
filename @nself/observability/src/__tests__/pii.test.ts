/**
 * Unit tests for @nself/observability PII scrubber and initObservability.
 *
 * Coverage:
 * - Email address redaction (simple + nested)
 * - UUID v4 redaction (user context, extras)
 * - 10–16 digit device token redaction
 * - Non-PII strings pass through unchanged
 * - Nested objects and arrays traversed recursively
 * - Adversarial: deeply nested PII in extra.user.profile.email
 * - initObservability no-op when both configs omitted
 * - Input immutability (no mutation of source event)
 */

import { describe, it, expect, vi } from 'vitest';
import { scrubEvent, scrubPatterns } from '../pii.js';
import { initObservability } from '../index.js';
import type { SentrySdk } from '../index.js';

// ---------------------------------------------------------------------------
// scrubPatterns sanity check
// ---------------------------------------------------------------------------
describe('scrubPatterns', () => {
  it('contains email, UUID, and token patterns', () => {
    expect(scrubPatterns).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// scrubEvent — email redaction
// ---------------------------------------------------------------------------
describe('scrubEvent — email redaction', () => {
  it('strips a simple email in user.email', () => {
    const event = { user: { email: 'user@example.com', id: 'abc123' } };
    const result = scrubEvent(event);
    expect((result['user'] as Record<string, unknown>)['email']).toBe('[email]');
    // Non-PII value untouched
    expect((result['user'] as Record<string, unknown>)['id']).toBe('abc123');
  });

  it('strips multiple emails in a single string', () => {
    const event = { extra: { note: 'Contact a@b.com or c@d.org for details' } };
    const result = scrubEvent(event);
    expect((result['extra'] as Record<string, unknown>)['note']).toBe(
      'Contact [email] or [email] for details',
    );
  });

  it('strips email in a nested extra field', () => {
    const event = {
      extra: { report: { sender: 'test@nself.org', subject: 'Hello' } },
    };
    const result = scrubEvent(event);
    const extra = result['extra'] as Record<string, unknown>;
    const report = extra['report'] as Record<string, unknown>;
    expect(report['sender']).toBe('[email]');
    expect(report['subject']).toBe('Hello');
  });

  it('strips email in message string', () => {
    const event = { message: 'Error for user@evil.com occurred' };
    const result = scrubEvent(event);
    expect(result['message']).toBe('Error for [email] occurred');
  });
});

// ---------------------------------------------------------------------------
// scrubEvent — UUID v4 redaction
// ---------------------------------------------------------------------------
describe('scrubEvent — UUID v4 redaction', () => {
  it('strips a UUID v4 in user context', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const event = { contexts: { user: { id: uuid } } };
    const result = scrubEvent(event);
    const contexts = result['contexts'] as Record<string, unknown>;
    const user = contexts['user'] as Record<string, unknown>;
    expect(user['id']).toBe('[uuid]');
  });

  it('leaves a non-v4 UUID untouched', () => {
    // Version 1 UUID (time-based) — should NOT be scrubbed (only v4 matches)
    const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    const event = { extra: { traceId: uuidV1 } };
    const result = scrubEvent(event);
    expect((result['extra'] as Record<string, unknown>)['traceId']).toBe(uuidV1);
  });

  it('strips UUID v4 embedded in a longer string', () => {
    const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const event = { message: `Session ${uuid} terminated` };
    const result = scrubEvent(event);
    expect(result['message']).toBe('Session [uuid] terminated');
  });
});

// ---------------------------------------------------------------------------
// scrubEvent — device token / digit sequence redaction
// ---------------------------------------------------------------------------
describe('scrubEvent — device token redaction', () => {
  it('strips a 16-digit token', () => {
    const event = { extra: { deviceToken: '1234567890123456' } };
    const result = scrubEvent(event);
    expect((result['extra'] as Record<string, unknown>)['deviceToken']).toBe('[token]');
  });

  it('strips a 10-digit sequence', () => {
    const event = { extra: { phone: '0501234567' } };
    const result = scrubEvent(event);
    expect((result['extra'] as Record<string, unknown>)['phone']).toBe('[token]');
  });

  it('does not strip a 9-digit sequence (below threshold)', () => {
    const event = { extra: { short: '123456789' } };
    const result = scrubEvent(event);
    expect((result['extra'] as Record<string, unknown>)['short']).toBe('123456789');
  });

  it('does not strip a 17-digit sequence (above threshold)', () => {
    const event = { extra: { long: '12345678901234567' } };
    const result = scrubEvent(event);
    expect((result['extra'] as Record<string, unknown>)['long']).toBe('12345678901234567');
  });
});

// ---------------------------------------------------------------------------
// scrubEvent — non-PII strings pass through
// ---------------------------------------------------------------------------
describe('scrubEvent — non-PII pass-through', () => {
  it('does not modify non-PII strings', () => {
    const event = {
      message: 'GraphQL mutation failed',
      tags: { component: 'ntask-web', version: '1.1.1' },
    };
    const result = scrubEvent(event);
    expect(result['message']).toBe('GraphQL mutation failed');
    const tags = result['tags'] as Record<string, unknown>;
    expect(tags['component']).toBe('ntask-web');
    expect(tags['version']).toBe('1.1.1');
  });

  it('handles null and undefined values without throwing', () => {
    const event = { user: null, extra: { value: undefined } };
    expect(() => scrubEvent(event as Record<string, unknown>)).not.toThrow();
  });

  it('handles arrays of strings', () => {
    const event = { extra: { tags: ['error', 'timeout', 'retry'] } };
    const result = scrubEvent(event);
    expect((result['extra'] as Record<string, unknown>)['tags']).toEqual([
      'error',
      'timeout',
      'retry',
    ]);
  });
});

// ---------------------------------------------------------------------------
// scrubEvent — adversarial: deeply nested PII (QA-A)
// ---------------------------------------------------------------------------
describe('scrubEvent — adversarial deeply nested PII', () => {
  it('scrubs email at extra.user.profile.email (4 levels deep)', () => {
    const event = {
      extra: {
        user: {
          profile: {
            email: 'deep@nested.org',
            bio: 'Developer',
          },
        },
      },
    };
    const result = scrubEvent(event);
    const extra = result['extra'] as Record<string, unknown>;
    const user = extra['user'] as Record<string, unknown>;
    const profile = user['profile'] as Record<string, unknown>;
    expect(profile['email']).toBe('[email]');
    expect(profile['bio']).toBe('Developer');
  });

  it('scrubs PII mixed in arrays at depth', () => {
    const uuid = 'a1a2a3a4-b1b2-4c3c-8d4d-e1e2e3e4e5e6';
    const event = {
      extra: {
        sessions: [
          { id: uuid, label: 'normal' },
          { id: 'no-pii', email: 'alert@x.com' },
        ],
      },
    };
    const result = scrubEvent(event);
    const sessions = (
      (result['extra'] as Record<string, unknown>)['sessions']
    ) as Array<Record<string, unknown>>;
    expect(sessions[0]?.['id']).toBe('[uuid]');
    expect(sessions[0]?.['label']).toBe('normal');
    expect(sessions[1]?.['email']).toBe('[email]');
  });
});

// ---------------------------------------------------------------------------
// scrubEvent — input immutability
// ---------------------------------------------------------------------------
describe('scrubEvent — input immutability', () => {
  it('does not mutate the input event', () => {
    const event = { user: { email: 'user@example.com' } };
    const copy = JSON.stringify(event);
    scrubEvent(event);
    expect(JSON.stringify(event)).toBe(copy);
  });
});

// ---------------------------------------------------------------------------
// initObservability — no-op when configs omitted (acceptance criterion)
// ---------------------------------------------------------------------------
describe('initObservability — graceful no-op', () => {
  it('does not throw when sentry and otel configs are both omitted', () => {
    expect(() => initObservability({})).not.toThrow();
  });

  it('does not throw when called with no sentry dsn (empty dsn = no-op)', () => {
    const mockSdk: SentrySdk = { init: vi.fn() };
    expect(() =>
      initObservability({
        sentry: { sdk: mockSdk, dsn: '', environment: 'test', release: '1.0.0', appKind: 'web' },
      }),
    ).not.toThrow();
    // sdk.init must NOT be called when dsn is empty
    expect(mockSdk.init).not.toHaveBeenCalled();
  });

  it('does not throw when called with no otel serviceName', () => {
    expect(() =>
      initObservability({
        otel: { serviceName: '' },
      }),
    ).not.toThrow();
  });

  it('calls sdk.init exactly once when a valid dsn is provided', () => {
    const mockSdk: SentrySdk = { init: vi.fn() };
    initObservability({
      sentry: {
        sdk: mockSdk,
        dsn: 'https://public@sentry.example.com/1',
        environment: 'test',
        release: '1.0.0',
        appKind: 'web',
      },
    });
    expect(mockSdk.init).toHaveBeenCalledOnce();
  });

  it('beforeSend hook in sentry config applies scrubEvent (PII always scrubbed)', () => {
    let capturedBeforeSend:
      | ((event: Record<string, unknown>) => Record<string, unknown> | null)
      | undefined;

    const mockSdk: SentrySdk = {
      init: vi.fn((opts) => {
        capturedBeforeSend = opts.beforeSend as
          | ((event: Record<string, unknown>) => Record<string, unknown> | null)
          | undefined;
      }),
    };

    initObservability({
      sentry: {
        sdk: mockSdk,
        dsn: 'https://public@sentry.example.com/1',
        environment: 'production',
        release: '1.0.0',
        appKind: 'server',
      },
    });

    expect(capturedBeforeSend).toBeDefined();

    // Simulate a Sentry event with PII
    const rawEvent = { user: { email: 'leakme@test.com' }, message: 'Auth error' };
    const scrubbed = capturedBeforeSend!(rawEvent as Record<string, unknown>);
    expect((scrubbed!['user'] as Record<string, unknown>)['email']).toBe('[email]');
    expect(scrubbed!['message']).toBe('Auth error');
  });
});
