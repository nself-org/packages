/**
 * @nself/observability — PII scrubber for Sentry events.
 *
 * Purpose: Strip personally identifiable information from Sentry events before
 *          any data leaves the client. Operates as a pure beforeSend transform.
 * Inputs:  A Sentry event object (any shape compatible with Sentry's Event type).
 * Outputs: A deep-cloned event with PII patterns replaced by safe placeholders.
 * Constraints:
 *   - Pure function — no side effects, no I/O.
 *   - Never mutates the input event.
 *   - Non-PII strings pass through unchanged.
 *   - Handles nested objects and arrays recursively (bounded depth).
 * SPORT: F08-SERVICE-INVENTORY.md (@nself/observability — PII scrubber)
 */

/** Patterns matched and redacted in every string value. */
export const scrubPatterns: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  // Email addresses (RFC-5321 local + @ + domain)
  {
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    replacement: '[email]',
  },
  // UUID v4 in user-data positions (full UUID string)
  {
    pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    replacement: '[uuid]',
  },
  // 10–16 consecutive digit sequences (device tokens, phone numbers)
  {
    pattern: /\b\d{10,16}\b/g,
    replacement: '[token]',
  },
];

/** Maximum depth to recurse into nested objects before stopping. */
const MAX_DEPTH = 10;

/**
 * Scrub all PII patterns from a single string value.
 *
 * @param value - The string to scrub.
 * @returns A new string with all PII patterns replaced.
 */
function scrubString(value: string): string {
  let result = value;
  for (const { pattern, replacement } of scrubPatterns) {
    // Reset lastIndex before each apply (global regexes are stateful)
    pattern.lastIndex = 0;
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Recursively scrub PII from an arbitrary value (string, object, array, or primitive).
 *
 * @param value - Any value that may appear in a Sentry event.
 * @param depth - Current recursion depth (stops at MAX_DEPTH).
 * @returns A deep copy with PII scrubbed from all string leaves.
 */
function scrubValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return value;

  if (typeof value === 'string') {
    return scrubString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = scrubValue(val, depth + 1);
    }
    return result;
  }

  return value;
}

/**
 * Deep-clone and scrub PII from a Sentry event.
 *
 * Redacts email addresses, UUID v4 values, and 10–16 digit device tokens
 * from all string values in event.user, event.contexts, event.extra,
 * event.request, event.tags, and event.message.
 *
 * @param event - The Sentry event to scrub (not mutated).
 * @returns A new event object with PII removed.
 */
export function scrubEvent(event: Record<string, unknown>): Record<string, unknown> {
  return scrubValue(event, 0) as Record<string, unknown>;
}
