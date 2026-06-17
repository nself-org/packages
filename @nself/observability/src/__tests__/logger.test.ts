/**
 * Unit tests for @nself/observability structured logger.
 *
 * Coverage:
 *   - emits one JSON record per call with ts/level/name/msg/fields
 *   - level gating drops calls below the configured minimum
 *   - base fields are merged into every record
 *   - child() adds context (correlationId) to all subsequent records
 *   - PII in fields is scrubbed (email/uuid redacted)
 */

import { describe, it, expect } from 'vitest';
import { createLogger, type LogRecord } from '../logger.js';

function capture() {
  const records: LogRecord[] = [];
  return { records, sink: (r: LogRecord) => records.push(r) };
}

describe('@nself/observability — createLogger', () => {
  it('emits a structured record with all fields', () => {
    const { records, sink } = capture();
    const log = createLogger({ name: 'svc', level: 'debug', sink });
    log.info('hello', { route: '/x' });
    expect(records).toHaveLength(1);
    const r = records[0]!;
    expect(r.name).toBe('svc');
    expect(r.level).toBe('info');
    expect(r.msg).toBe('hello');
    expect(r.fields.route).toBe('/x');
    expect(typeof r.ts).toBe('string');
  });

  it('drops calls below the configured minimum level', () => {
    const { records, sink } = capture();
    const log = createLogger({ name: 'svc', level: 'warn', sink });
    log.debug('d');
    log.info('i');
    log.warn('w');
    log.error('e');
    expect(records.map((r) => r.level)).toEqual(['warn', 'error']);
  });

  it('merges base fields into every record', () => {
    const { records, sink } = capture();
    const log = createLogger({ name: 'svc', sink, base: { release: '1.1.1' } });
    log.info('x');
    expect(records[0]!.fields.release).toBe('1.1.1');
  });

  it('child() carries a correlationId into all records', () => {
    const { records, sink } = capture();
    const log = createLogger({ name: 'svc', sink }).child({ correlationId: 'abc-123' });
    log.info('a');
    log.error('b');
    expect(records[0]!.fields.correlationId).toBe('abc-123');
    expect(records[1]!.fields.correlationId).toBe('abc-123');
  });

  it('scrubs PII from log fields', () => {
    const { records, sink } = capture();
    const log = createLogger({ name: 'svc', sink });
    log.info('login', { email: 'user@example.com' });
    expect(JSON.stringify(records[0]!.fields)).not.toContain('user@example.com');
  });
});
