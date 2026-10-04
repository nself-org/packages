/**
 * admin/redact.ts — secret redaction for the server-only admin GraphQL client.
 *
 * Purpose: Remove every occurrence of the admin secret from errors before they
 *          reach callers, the onError callback or logs.
 * Inputs:  The secret (captured in a closure), and strings, errors or JSON-like
 *          values to scrub.
 * Outputs: makeRedactor(secret) returning { text, value, combinedError }.
 * Constraints:
 *   - The secret is never stored on an object property, only in the closure.
 *   - Raw, URL-encoded and JSON-escaped spellings of the secret are all removed.
 *   - Redacted errors are rebuilt: original message, stack and `cause` are not
 *     carried over; `cause` is redacted recursively instead.
 *   - Only strings, arrays and plain objects are traversed (depth capped).
 * SPORT: cap:packages.admin-graphql-client (P7-ADOPT-09, EPIC ADOPT D14)
 */

import { CombinedError } from '@urql/core';

/** Replacement text for every removed secret. */
export const REDACTED = '[REDACTED]';

const MAX_DEPTH = 8;

/** Redactor — scrub functions bound to one secret. */
export interface Redactor {
  /** Replace every spelling of the secret in a string. */
  text(input: string): string;
  /** Deep-scrub a JSON-like value (strings, arrays, plain objects, errors). */
  value<T>(input: T): T;
  /** Rebuild a CombinedError with every string scrubbed. */
  combinedError(error: CombinedError): CombinedError;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null) return false;
  const proto = Object.getPrototypeOf(v) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * makeRedactor — build the scrub functions for one secret. The secret must be
 * non-empty (callers validate); an empty needle would corrupt every string.
 */
export function makeRedactor(secret: string): Redactor {
  const needles = Array.from(
    new Set([secret, encodeURIComponent(secret), JSON.stringify(secret).slice(1, -1)]),
  ).filter((n) => n.length > 0);

  const text = (input: string): string => {
    let out = input;
    for (const needle of needles) out = out.split(needle).join(REDACTED);
    return out;
  };

  const errorCopy = (e: Error, depth: number): Error => {
    const copy = new Error(text(e.message));
    copy.name = text(e.name);
    if (typeof e.stack === 'string') copy.stack = text(e.stack);
    const cause = (e as { cause?: unknown }).cause;
    if (cause !== undefined) {
      (copy as { cause?: unknown }).cause = value(cause, depth + 1);
    }
    return copy;
  };

  function value<T>(input: T, depth = 0): T {
    if (typeof input === 'string') return text(input) as unknown as T;
    if (depth > MAX_DEPTH) return '[Truncated]' as unknown as T;
    if (input instanceof Error) return errorCopy(input, depth) as unknown as T;
    if (Array.isArray(input)) {
      return input.map((item) => value(item, depth + 1)) as unknown as T;
    }
    if (isPlainObject(input)) {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(input)) {
        out[text(key)] = value(input[key], depth + 1);
      }
      return out as T;
    }
    return input;
  }

  const combinedError = (error: CombinedError): CombinedError => {
    const init: ConstructorParameters<typeof CombinedError>[0] = {};
    if (error.networkError instanceof Error) init.networkError = errorCopy(error.networkError, 0);
    init.graphQLErrors = error.graphQLErrors.map((g) =>
      value({
        message: g.message,
        extensions: g.extensions,
        path: g.path,
        locations: g.locations,
      }),
    );
    init.response = error.response;
    return new CombinedError(init);
  };

  return { text, value: (input) => value(input), combinedError };
}
