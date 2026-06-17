/**
 * @nself/observability — canonical structured (JSON) logger.
 *
 * Purpose: Give every nSelf surface ONE leveled, structured logging facility so
 *          apps stop falling back to raw console.* with no fields/levels. Emits a
 *          single JSON object per line (ts, level, msg, + scrubbed fields), with
 *          optional correlation/trace ids carried via child loggers.
 * Inputs:  LoggerConfig (name, level, base fields, optional sink) + per-call
 *          message + fields.
 * Outputs: void (writes one JSON line per call to the configured sink, default
 *          console for the matching level).
 * Constraints:
 *   - Level gating: a call below the configured minimum level is dropped cheaply.
 *   - PII: all fields are run through scrubFields() before emit (emails/uuids/
 *     device tokens redacted) — never log raw tokens regardless.
 *   - Framework-agnostic: no Node-only or browser-only APIs; works everywhere.
 *   - No external deps (pino/winston) — keeps the shared package dependency-free.
 * SPORT: F08-SERVICE-INVENTORY.md (@nself/observability — structured logger)
 */

import { scrubFields } from './pii.js';

/** Log levels in ascending severity. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** A single emitted log record (JSON-serialised to one line). */
export interface LogRecord {
  /** ISO-8601 timestamp. */
  readonly ts: string;
  /** Severity level. */
  readonly level: LogLevel;
  /** Logger name (service / module). */
  readonly name: string;
  /** Human-readable message. */
  readonly msg: string;
  /** Scrubbed structured fields (correlation/trace ids, context, etc.). */
  readonly fields: Record<string, unknown>;
}

/** Sink that receives a finished record. Defaults to console-by-level. */
export type LogSink = (record: LogRecord) => void;

/** Configuration for a logger instance. */
export interface LoggerConfig {
  /** Logger name (e.g. 'ntask-web', 'auth-core'). */
  readonly name: string;
  /** Minimum level to emit. Defaults to 'info'. */
  readonly level?: LogLevel;
  /** Base fields merged into every record (e.g. release, env, traceId). */
  readonly base?: Record<string, unknown>;
  /** Output sink. Defaults to console.{debug,info,warn,error} as JSON. */
  readonly sink?: LogSink;
}

/** Structured logger. Create via createLogger(); branch context via child(). */
export interface Logger {
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
  /** Derive a child logger with additional base fields (e.g. a correlationId). */
  child(fields: Record<string, unknown>): Logger;
}

/** Default sink: one JSON line per record on the console method for its level. */
const defaultSink: LogSink = (record) => {
  const line = JSON.stringify(record);
  // eslint-disable-next-line no-console -- the logger IS the sanctioned console boundary
  (console[record.level] ?? console.log)(line);
};

/**
 * createLogger — build a structured logger.
 *
 * @param config - Logger configuration (name required; level/base/sink optional).
 * @returns A Logger with level methods + child().
 */
export function createLogger(config: LoggerConfig): Logger {
  const minLevel = LEVEL_ORDER[config.level ?? 'info'];
  const sink = config.sink ?? defaultSink;
  const base = config.base ?? {};

  function emit(level: LogLevel, msg: string, fields?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < minLevel) return;
    const merged = { ...base, ...(fields ?? {}) };
    sink({
      ts: new Date().toISOString(),
      level,
      name: config.name,
      msg,
      fields: scrubFields(merged),
    });
  }

  return {
    debug: (msg, fields) => emit('debug', msg, fields),
    info: (msg, fields) => emit('info', msg, fields),
    warn: (msg, fields) => emit('warn', msg, fields),
    error: (msg, fields) => emit('error', msg, fields),
    child: (fields) =>
      createLogger({ ...config, base: { ...base, ...fields } }),
  };
}
