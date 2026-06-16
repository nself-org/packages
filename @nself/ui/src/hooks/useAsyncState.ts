/**
 * useAsyncState<T> — state machine hook for async data fetching with Result<T,AppError>.
 *
 * Purpose: Wrap any async function that returns Result<T,AppError> in a React
 *          state machine. Handles concurrent request cancellation (AbortController),
 *          loading state, and exposes a reload() trigger.
 * Inputs:
 *   - fn: (signal: AbortSignal) => Promise<Result<T,AppError>> — the async fetcher.
 *   - deps?: readonly unknown[] — re-run when deps change (default []).
 * Outputs: { result: Result<T,AppError> | 'loading'; reload: () => void }
 * Constraints:
 *   - Cancels in-flight request on deps change or unmount via AbortController.
 *   - Concurrent reload() calls cancel the previous in-flight request.
 *   - Never throws — errors are captured in Err(AppError).
 * SPORT: F-NSELF-UI-USE-ASYNC-STATE-01
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Result, AppError } from '@nself/errors';
import { err } from '@nself/errors';

export interface UseAsyncStateResult<T> {
  /** The current async state: 'loading' while in-flight, a Result once settled. */
  result: Result<T, AppError> | 'loading';
  /** Imperatively re-run the fetch function (cancels any in-flight request first). */
  reload: () => void;
}

/**
 * useAsyncState — fetch, cancel, and expose a Result<T,AppError>.
 *
 * @param fn     Async fetcher that receives an AbortSignal. Must return Result<T,AppError>.
 * @param deps   Dependency array — reload triggers when deps change (default []).
 * @returns      { result, reload }
 *
 * @example
 * const { result, reload } = useAsyncState(
 *   async (signal) => fetchTasks({ signal }),
 *   [projectId],
 * );
 */
export function useAsyncState<T>(
  fn: (signal: AbortSignal) => Promise<Result<T, AppError>>,
  deps: readonly unknown[] = [],
): UseAsyncStateResult<T> {
  const [result, setResult] = useState<Result<T, AppError> | 'loading'>('loading');

  // Increment this counter to trigger a reload without changing deps
  const [reloadCounter, setReloadCounter] = useState(0);

  // Keep fn stable via ref to avoid stale-closure issues without including it in deps
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setResult('loading');

    let cancelled = false;

    fnRef.current(signal).then((res) => {
      if (!cancelled && !signal.aborted) {
        setResult(res);
      }
    }).catch((rawErr: unknown) => {
      if (!cancelled && !signal.aborted) {
        // Wrap unexpected throws as an internal AppError
        const appError: AppError = {
          code: 'internal',
          message: rawErr instanceof Error ? rawErr.message : 'Unknown error',
          status: 500,
        };
        setResult(err(appError));
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadCounter]);

  const reload = useCallback(() => {
    setReloadCounter((c) => c + 1);
  }, []);

  return { result, reload };
}
