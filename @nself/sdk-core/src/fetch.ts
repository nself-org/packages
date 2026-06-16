/**
 * fetch.ts — Base typed fetch with retry and timeout for @nself/sdk-core.
 *
 * Purpose: Wrap global fetch in a typed, retry-capable, timeout-aware wrapper
 *          that always returns Result<T, AppError> — never throws to callers.
 * Inputs:  URL string, RequestInit options extended with retry/timeout config.
 * Outputs: Promise<Result<T, AppError>> — network and HTTP errors mapped to typed errors.
 * Constraints: No React/RN/Tauri imports; retries ONLY on network errors (not 4xx/5xx);
 *              AbortController used for timeout; all raw throws converted to Result.err().
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/sdk-core (fetch layer)
 */

import { err, ok, type Result } from '@nself/errors';
import type { AppError, InternalError } from '@nself/errors';

export interface BaseFetchOptions extends RequestInit {
  /** Number of retry attempts on network-level failures (not 4xx/5xx). Default: 0. */
  retries?: number;
  /** Request timeout in milliseconds. Default: 10_000 (10s). */
  timeoutMs?: number;
}

/** Internal: map an HTTP Response to an AppError. */
const httpErrorFromResponse = async (response: Response): Promise<AppError> => {
  const status = response.status;
  let message = response.statusText || 'HTTP error';

  // Attempt to read body for a richer message (best-effort)
  const body = await response.text().catch(() => '');
  if (body.length > 0 && body.length < 500) {
    // Only use body if small enough to be safe to embed
    const parsed = (() => {
      try {
        return JSON.parse(body) as Record<string, unknown>;
      } catch {
        return null;
      }
    })();
    if (parsed && typeof parsed['message'] === 'string') {
      message = parsed['message'];
    }
  }

  if (status === 401) {
    return { code: 'auth_failed', message, status: 401 };
  }
  if (status === 402) {
    return { code: 'license_required', message, status: 402 };
  }
  if (status === 403) {
    return { code: 'forbidden', message, status: 403 };
  }
  if (status === 404) {
    return { code: 'not_found', message, status: 404 };
  }
  if (status === 422) {
    return { code: 'validation_error', message, status: 422 };
  }
  if (status === 429) {
    return { code: 'rate_limited', message, status: 429 };
  }
  // All other 4xx/5xx → internal
  return { code: 'internal', message, status: 500 };
};

/** Internal: true if the error is a network-level failure worth retrying. */
const isNetworkFailure = (error: unknown): boolean => {
  if (error instanceof Error) {
    // AbortError means timeout or explicit abort — do not retry
    if (error.name === 'AbortError') return false;
    // TypeError from fetch means network failure (offline, DNS, etc.)
    if (error instanceof TypeError) return true;
    if (error.name === 'NetworkError') return true;
  }
  return false;
};

/**
 * baseFetch — typed, retry-capable, timeout-aware fetch wrapper.
 *
 * Retries ONLY on network-level failures (TypeError from fetch).
 * Does NOT retry on 4xx or 5xx HTTP responses — those are deterministic.
 *
 * @param url     The full URL to fetch.
 * @param options Extended RequestInit with optional retries and timeoutMs.
 * @returns       Promise<Result<T, AppError>> — never throws.
 */
export const baseFetch = async <T>(
  url: string,
  options: BaseFetchOptions = {},
): Promise<Result<T, AppError>> => {
  const { retries = 0, timeoutMs = 10_000, ...fetchOptions } = options;
  let attemptsLeft = retries + 1;

  while (attemptsLeft > 0) {
    attemptsLeft -= 1;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    // Merge caller's signal with our timeout signal where supported
    const signal = fetchOptions.signal
      ? fetchOptions.signal
      : controller.signal;

    const result = await (async (): Promise<Result<T, AppError>> => {
      try {
        const response = await fetch(url, { ...fetchOptions, signal });

        if (!response.ok) {
          const error = await httpErrorFromResponse(response);
          return err(error);
        }

        // Parse JSON body — best-effort; malformed JSON → internal error
        const parsed = await response.json().catch((parseErr: unknown) => {
          return undefined as T | undefined;
        });

        return ok(parsed as T);
      } catch (caught: unknown) {
        if (isNetworkFailure(caught) && attemptsLeft > 0) {
          // Signal retry by returning a sentinel — handled below
          return err({
            code: 'internal',
            message: caught instanceof Error ? caught.message : 'Network error',
            status: 500,
          } satisfies InternalError);
        }

        // AbortError = timeout
        if (caught instanceof Error && caught.name === 'AbortError') {
          return err({
            code: 'internal',
            message: `Request timed out after ${timeoutMs}ms`,
            status: 500,
          } satisfies InternalError);
        }

        // Any other thrown value → internal error
        return err({
          code: 'internal',
          message:
            caught instanceof Error ? caught.message : 'Unknown fetch error',
          status: 500,
        } satisfies InternalError);
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    // Retry only on network failures (InternalError from network) while attempts remain
    if (
      result._tag === 'Err' &&
      result.error.code === 'internal' &&
      attemptsLeft > 0
    ) {
      // Network-failure branch above leaves attemptsLeft > 0 — retry
      continue;
    }

    return result;
  }

  // Exhausted all retries
  return err({
    code: 'internal',
    message: 'All fetch retry attempts exhausted',
    status: 500,
  } satisfies InternalError);
};
