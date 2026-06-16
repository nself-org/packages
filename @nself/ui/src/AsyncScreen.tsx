/**
 * AsyncScreen — 7-state data surface wrapper for all nSelf screens.
 *
 * Purpose: Provide a single component that handles all 7 states any data-fetching
 *          screen can be in, so individual screens never omit a state case.
 *          Consuming screens must wrap all urql data in AsyncScreen — this is a
 *          P3 DoD requirement (canonical-patterns.md §4).
 *
 * Inputs:
 *   - loading: boolean — urql fetching flag
 *   - empty: boolean — data.length === 0 (after successful fetch)
 *   - error: unknown — urql CombinedError or any caught error
 *   - offline: boolean — network connectivity lost
 *   - permissionDenied: boolean — auth role insufficient for this resource
 *   - rateLimited: boolean — HTTP 429 detected in error
 *   - children: ReactNode — the populated state content
 *   - slots: optional overrides for each state's default UI
 *
 * Outputs: The appropriate state UI or children.
 *
 * Constraints:
 *   - State priority: loading > offline > error > rateLimited > permissionDenied > empty > populated
 *   - All 7 states must be handled — never pass partial props
 *   - Default slot UIs are intentionally minimal; apps override via slots prop
 *   - No data fetching here — this is purely presentational
 *
 * Usage:
 *   import { AsyncScreen } from '@nself/ui';
 *   <AsyncScreen loading={fetching} empty={items.length === 0} error={error} ...>
 *     {items.map(item => <Row key={item.id} item={item} />)}
 *   </AsyncScreen>
 *
 * SOT: F-NSELF-UI-ASYNCSCREEN-01
 */

import React from 'react';

// ─── Slot types ──────────────────────────────────────────────────────────────

export interface AsyncScreenSlots {
  /** Custom loading skeleton. Default: spinning div. */
  loading?: React.ReactNode;
  /** Custom empty state. Default: "No items yet" message. */
  empty?: React.ReactNode;
  /** Custom error state. Receives error value. Default: error card + retry. */
  error?: (error: unknown, retry?: () => void) => React.ReactNode;
  /** Custom offline banner. Default: offline message. */
  offline?: React.ReactNode;
  /** Custom permission denied UI. Default: lock icon + upgrade CTA. */
  permissionDenied?: React.ReactNode;
  /** Custom rate limited UI. Default: cooldown message. */
  rateLimited?: React.ReactNode;
}

export interface AsyncScreenProps {
  /** Urql fetching flag — shows loading skeleton. */
  loading: boolean;
  /** Whether the data set is empty (after fetch). */
  empty: boolean;
  /** Urql CombinedError or any error. Null/undefined = no error. */
  error?: unknown;
  /** Whether the device has no network connectivity. */
  offline?: boolean;
  /** Whether the current user's role is insufficient for this resource. */
  permissionDenied?: boolean;
  /** Whether a 429 rate-limit response was received. */
  rateLimited?: boolean;
  /** Optional retry callback passed to the error slot. */
  onRetry?: () => void;
  /** Custom slot overrides for each state's default UI. */
  slots?: AsyncScreenSlots;
  /** The populated-state content. */
  children: React.ReactNode;
}

// ─── Default slot UIs ────────────────────────────────────────────────────────

function DefaultLoading(): React.ReactElement {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        width: '100%',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: '2rem',
          height: '2rem',
          border: '3px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}

function DefaultEmpty(): React.ReactElement {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        gap: '0.5rem',
        color: '#64748b',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '2.5rem' }}>○</span>
      <p style={{ margin: 0, fontWeight: 500 }}>Nothing here yet</p>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>Items will appear once added.</p>
    </div>
  );
}

function DefaultError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}): React.ReactElement {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Something went wrong. Please try again.';

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '1rem',
        color: '#dc2626',
        textAlign: 'center',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '2rem' }}>⚠</span>
      <p style={{ margin: 0, fontWeight: 500 }}>{message}</p>
      {onRetry !== undefined && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '0.5rem 1.25rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

function DefaultOffline(): React.ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '0.5rem',
        color: '#64748b',
        textAlign: 'center',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '2rem' }}>⊘</span>
      <p style={{ margin: 0, fontWeight: 500 }}>You are offline</p>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>Check your connection and try again.</p>
    </div>
  );
}

function DefaultPermissionDenied(): React.ReactElement {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        gap: '0.75rem',
        textAlign: 'center',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '2.5rem' }}>🔒</span>
      <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>Access restricted</p>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
        Your plan does not include access to this feature.
      </p>
    </div>
  );
}

function DefaultRateLimited(): React.ReactElement {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '0.5rem',
        color: '#92400e',
        textAlign: 'center',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '2rem' }}>⏱</span>
      <p style={{ margin: 0, fontWeight: 500 }}>Rate limit reached</p>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>Please wait a moment before trying again.</p>
    </div>
  );
}

// ─── AsyncScreen ─────────────────────────────────────────────────────────────

/**
 * AsyncScreen — renders the appropriate state UI for a data-fetching surface.
 *
 * State priority (first truthy wins):
 *   1. loading
 *   2. offline
 *   3. error (non-null/undefined)
 *   4. rateLimited
 *   5. permissionDenied
 *   6. empty
 *   7. populated (children)
 */
export function AsyncScreen({
  loading,
  empty,
  error,
  offline = false,
  permissionDenied = false,
  rateLimited = false,
  onRetry,
  slots = {},
  children,
}: AsyncScreenProps): React.ReactElement {
  // 1. Loading
  if (loading) {
    return <>{slots.loading ?? <DefaultLoading />}</>;
  }

  // 2. Offline
  if (offline) {
    return <>{slots.offline ?? <DefaultOffline />}</>;
  }

  // 3. Error
  if (error !== undefined && error !== null) {
    if (slots.error !== undefined) {
      return <>{slots.error(error, onRetry)}</>;
    }
    const errorProps = onRetry !== undefined ? { error, onRetry } : { error };
    return <DefaultError {...errorProps} />;
  }

  // 4. Rate limited
  if (rateLimited) {
    return <>{slots.rateLimited ?? <DefaultRateLimited />}</>;
  }

  // 5. Permission denied
  if (permissionDenied) {
    return <>{slots.permissionDenied ?? <DefaultPermissionDenied />}</>;
  }

  // 6. Empty
  if (empty) {
    return <>{slots.empty ?? <DefaultEmpty />}</>;
  }

  // 7. Populated
  return <>{children}</>;
}
