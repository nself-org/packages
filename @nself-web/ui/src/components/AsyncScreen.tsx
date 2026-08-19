'use client'
/**
 * Purpose: AsyncScreen<T> — enforces the 7-state UI contract across every data-loading surface.
 *   Eliminates ad-hoc loading spinners. Every app data view must use AsyncScreen.
 * Inputs: result ('loading' | Result<T, AppError>), renderData, optional emptyCheck + onRetry
 * Outputs: One of 7 state views: loading / empty / error / populated / offline / permission-denied / rate-limited
 * Constraints: All 7 states must be handled — no default catch-all. Copy uses i18n t() (via props for portability).
 *   WCAG 2.1 AA: aria-live / role=alert on error and status states.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself-web/ui AsyncScreen 7-state added
 */
import * as React from 'react'
import { cn } from '../lib/cn'

// ---------------------------------------------------------------------------
// Result type — minimal version for standalone use.
// When @nself/errors is available, this should be replaced by its Result<T,E>.
// ---------------------------------------------------------------------------
export type AppErrorCode =
  | 'NETWORK'
  | 'AUTH'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'UNKNOWN'

export interface AppError {
  code: AppErrorCode
  message: string
  retryable?: boolean
}

export type Result<T, E = AppError> =
  | { ok: true; data: T }
  | { ok: false; error: E }

// ---------------------------------------------------------------------------
// 7-state type
// ---------------------------------------------------------------------------
export type AsyncState<T> = 'loading' | Result<T, AppError>

// ---------------------------------------------------------------------------
// State sub-components — each WCAG 2.1 AA compliant
// ---------------------------------------------------------------------------

interface BaseStateProps {
  className?: string | undefined
  children?: React.ReactNode
}

/** State 1: Loading — skeleton/spinner, aria-live="polite" */
export function LoadingState({ className }: BaseStateProps): React.ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className={cn('flex flex-col gap-3 p-6 animate-pulse', className)}
    >
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
    </div>
  )
}

/** State 2: Empty — no data, prompt to create or try again */
export function EmptyState({
  message = 'No items yet.',
  actionLabel,
  onAction,
  className,
}: {
  message?: string | undefined
  actionLabel?: string | undefined
  onAction?: (() => void) | undefined
  className?: string | undefined
}): React.ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center gap-4 p-10 text-center text-slate-500', className)}
    >
      <svg
        aria-hidden="true"
        className="w-12 h-12 text-slate-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p className="text-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-sm font-medium text-sky-600 hover:text-sky-700 underline-offset-2 hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

/** State 3: Error — generic server/unknown error */
export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: AppError
  onRetry?: (() => void) | undefined
  className?: string | undefined
}): React.ReactElement {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn('flex flex-col items-center gap-4 p-8 text-center', className)}
    >
      <svg
        aria-hidden="true"
        className="w-10 h-10 text-rose-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-100">Something went wrong</p>
        <p className="text-sm text-slate-500 mt-1">{error.message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}

/** State 4: Offline — network error (NETWORK error code) */
export function OfflineState({
  onRetry,
  className,
}: {
  onRetry?: (() => void) | undefined
  className?: string | undefined
}): React.ReactElement {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn('flex flex-col items-center gap-4 p-8 text-center', className)}
    >
      <svg
        aria-hidden="true"
        className="w-10 h-10 text-amber-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M6.343 6.343a8 8 0 000 11.314"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 3l18 18"
        />
      </svg>
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-100">No connection</p>
        <p className="text-sm text-slate-500 mt-1">
          Check your internet connection and try again.
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}

/** State 5: PermissionDenied — AUTH or PERMISSION_DENIED errors. Free per Security-Always-Free doctrine. */
export function PermissionDeniedState({
  className,
}: {
  className?: string | undefined
}): React.ReactElement {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn('flex flex-col items-center gap-4 p-8 text-center', className)}
    >
      <svg
        aria-hidden="true"
        className="w-10 h-10 text-rose-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
        />
      </svg>
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-100">Access denied</p>
        <p className="text-sm text-slate-500 mt-1">
          You don&apos;t have permission to view this content.
        </p>
      </div>
    </div>
  )
}

/** State 6: RateLimited — RATE_LIMITED error code. Free per Security-Always-Free doctrine. */
export function RateLimitedState({
  onRetry,
  className,
}: {
  onRetry?: (() => void) | undefined
  className?: string | undefined
}): React.ReactElement {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn('flex flex-col items-center gap-4 p-8 text-center', className)}
    >
      <svg
        aria-hidden="true"
        className="w-10 h-10 text-amber-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-100">Too many requests</p>
        <p className="text-sm text-slate-500 mt-1">
          You&apos;ve hit the rate limit. Please wait a moment and try again.
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AsyncScreen<T> — main component
// ---------------------------------------------------------------------------

export interface AsyncScreenProps<T> {
  /**
   * The async result or 'loading' sentinel.
   * - 'loading': show LoadingState
   * - Result.ok(data) where emptyCheck(data)===true: show EmptyState
   * - Result.ok(data): call renderData(data)
   * - Result.err(NETWORK): show OfflineState
   * - Result.err(AUTH|PERMISSION_DENIED): show PermissionDeniedState
   * - Result.err(RATE_LIMITED): show RateLimitedState
   * - Result.err(*): show ErrorState
   */
  result: AsyncState<T>
  /** Renders the populated state when result is ok and not empty */
  renderData: (data: T) => React.ReactNode
  /** Returns true if the ok data should be treated as empty. Default: false */
  emptyCheck?: (data: T) => boolean
  /** Called when retry buttons are tapped */
  onRetry?: (() => void) | undefined
  /** Empty state message override */
  emptyMessage?: string
  /** Empty state action label */
  emptyActionLabel?: string
  className?: string | undefined
}

export function AsyncScreen<T>({
  result,
  renderData,
  emptyCheck,
  onRetry,
  emptyMessage,
  emptyActionLabel,
  className,
}: AsyncScreenProps<T>): React.ReactElement {
  // State 1: Loading
  if (result === 'loading') {
    return <LoadingState className={className} />
  }

  // Error branch — determine which error state
  if (!result.ok) {
    const { error } = result

    // State 4: Offline (network failure)
    if (error.code === 'NETWORK') {
      return <OfflineState onRetry={onRetry} className={className} />
    }

    // State 5: Permission denied (auth or explicit permission error)
    if (error.code === 'AUTH' || error.code === 'PERMISSION_DENIED') {
      return <PermissionDeniedState className={className} />
    }

    // State 6: Rate limited
    if (error.code === 'RATE_LIMITED') {
      return <RateLimitedState onRetry={onRetry} className={className} />
    }

    // State 3: Generic error (SERVER_ERROR, NOT_FOUND, UNKNOWN)
    return <ErrorState error={error} onRetry={onRetry} className={className} />
  }

  // Result is ok — check for empty
  const { data } = result

  // State 2: Empty
  if (emptyCheck && emptyCheck(data)) {
    return (
      <EmptyState
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onRetry}
        className={className}
      />
    )
  }

  // State 7: Populated
  return <>{renderData(data)}</>
}
