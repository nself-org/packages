/**
 * AsyncScreen state sub-components — one component per UI state.
 *
 * Purpose: Encapsulate the default UI for each of the 7 async states.
 *          Each sub-component is independently replaceable via AsyncScreen slots.
 * Inputs:  Minimal props per state; all copy strings via t() from @nself/i18n.
 * Outputs: Accessible React elements (WCAG 2.1 AA — aria-live, role=alert,
 *          role=status, aria-label, focus management).
 * Constraints:
 *   - Zero hardcoded copy strings — all text via t() parameter.
 *   - All states meet WCAG 2.1 AA colour-contrast and ARIA requirements.
 *   - No external CSS dependencies — uses inline styles + className overrides only.
 * SPORT: F-NSELF-UI-ASYNCSCREEN-STATES-01
 */

import React from 'react';

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Minimal inline-style container shared by all state sub-components. */
function StateContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string | undefined;
}): React.ReactElement {
  return (
    <div
      className={className ?? undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        gap: '0.5rem',
        textAlign: 'center',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

// ─── 1. Loading ───────────────────────────────────────────────────────────────

export interface LoadingStateProps {
  /** Translated "Loading" label from t('asyncScreen.loadingLabel'). */
  label: string;
  className?: string | undefined;
}

/**
 * LoadingState — animated spinner with accessible status announcement.
 * Uses role="status" + aria-label for screen readers (WCAG 4.1.3).
 */
export function LoadingState({ label, className }: LoadingStateProps): React.ReactElement {
  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      className={className}
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
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'nsui-spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}

// ─── 2. Empty ─────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  heading: string;
  body: string;
  className?: string | undefined;
}

/**
 * EmptyState — shown when data loaded successfully but the list is empty.
 * Uses role="status" for polite announcement.
 */
export function EmptyState({ heading, body, className }: EmptyStateProps): React.ReactElement {
  return (
    <StateContainer className={className}>
      <div role="status" aria-live="polite" style={{ display: 'contents' }}>
        <span aria-hidden="true" style={{ fontSize: '2.5rem' }}>○</span>
        <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{heading}</p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{body}</p>
      </div>
    </StateContainer>
  );
}

// ─── 3. Error ─────────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  heading: string;
  body: string;
  retryLabel: string;
  onRetry?: (() => void) | undefined;
  className?: string | undefined;
}

/**
 * ErrorState — shown on unexpected/unclassified errors.
 * Uses role="alert" for immediate screen-reader announcement (WCAG SC 4.1.3).
 */
export function ErrorState({
  heading,
  body,
  retryLabel,
  onRetry,
  className,
}: ErrorStateProps): React.ReactElement {
  return (
    <StateContainer className={className}>
      <div role="alert" aria-live="assertive" style={{ display: 'contents' }}>
        <span aria-hidden="true" style={{ fontSize: '2rem' }}>⚠</span>
        <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{heading}</p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{body}</p>
        {onRetry !== undefined && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {retryLabel}
          </button>
        )}
      </div>
    </StateContainer>
  );
}

// ─── 4. Offline ───────────────────────────────────────────────────────────────

export interface OfflineStateProps {
  heading: string;
  body: string;
  className?: string | undefined;
}

/**
 * OfflineState — shown when the device has no network connectivity.
 * Uses role="alert" for immediate announcement.
 */
export function OfflineState({ heading, body, className }: OfflineStateProps): React.ReactElement {
  return (
    <StateContainer className={className}>
      <div role="alert" aria-live="assertive" style={{ display: 'contents' }}>
        <span aria-hidden="true" style={{ fontSize: '2rem' }}>⊘</span>
        <p style={{ margin: 0, fontWeight: 500, color: '#0f172a' }}>{heading}</p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{body}</p>
      </div>
    </StateContainer>
  );
}

// ─── 5. PermissionDenied ──────────────────────────────────────────────────────

export interface PermissionDeniedStateProps {
  heading: string;
  body: string;
  className?: string | undefined;
}

/**
 * PermissionDeniedState — shown when user lacks access to this resource.
 * Free feature per Security-Always-Free doctrine.
 * Uses role="status" (polite — not a system error, just access restriction).
 */
export function PermissionDeniedState({
  heading,
  body,
  className,
}: PermissionDeniedStateProps): React.ReactElement {
  return (
    <StateContainer className={className}>
      <div role="status" aria-live="polite" style={{ display: 'contents' }}>
        <span aria-hidden="true" style={{ fontSize: '2.5rem' }}>🔒</span>
        <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{heading}</p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{body}</p>
      </div>
    </StateContainer>
  );
}

// ─── 6. RateLimited ───────────────────────────────────────────────────────────

export interface RateLimitedStateProps {
  heading: string;
  body: string;
  className?: string | undefined;
}

/**
 * RateLimitedState — shown on HTTP 429 / rate limit detection.
 * Free feature per Security-Always-Free doctrine.
 * Uses role="alert" (assertive — user action triggered rate limit).
 */
export function RateLimitedState({
  heading,
  body,
  className,
}: RateLimitedStateProps): React.ReactElement {
  return (
    <StateContainer className={className}>
      <div role="alert" aria-live="assertive" style={{ display: 'contents' }}>
        <span aria-hidden="true" style={{ fontSize: '2rem' }}>⏱</span>
        <p style={{ margin: 0, fontWeight: 500, color: '#78350f' }}>{heading}</p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>{body}</p>
      </div>
    </StateContainer>
  );
}
