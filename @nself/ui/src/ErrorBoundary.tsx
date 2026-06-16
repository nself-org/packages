/**
 * ErrorBoundary — React error boundary for route-level error isolation.
 *
 * Purpose: Catch rendering errors in a component subtree and render a fallback
 *          UI instead of crashing the entire app. Per canonical-patterns.md §5,
 *          every route-level component must be wrapped in ErrorBoundary.
 *
 * Inputs:
 *   - fallback: ReactNode — shown when an error is caught. Required.
 *   - onError: optional — called with (error, errorInfo) for logging/Sentry.
 *   - children: ReactNode — the component subtree to protect.
 *
 * Outputs: children during normal operation; fallback when an error is caught.
 *
 * Constraints:
 *   - Error boundaries must be class components (React restriction).
 *   - Does not catch: async errors, event handler errors, server errors.
 *     Use try/catch + Result<T,E> from @nself/errors for those cases.
 *   - In production, errors are passed to onError (wire to @nself/observability logger).
 *   - Reset by remounting (changing key prop on the ErrorBoundary).
 *
 * Usage:
 *   import { ErrorBoundary } from '@nself/ui';
 *   <ErrorBoundary fallback={<ErrorFallback />}>
 *     <RouteContent />
 *   </ErrorBoundary>
 *
 * SOT: F-NSELF-UI-ERRORBOUNDARY-01
 */

import React from 'react';

export interface ErrorBoundaryProps {
  /** Fallback UI shown when an error is caught. */
  fallback: React.ReactNode;
  /**
   * Optional error reporter. Wire to @nself/observability logger in production.
   * Signature matches React's componentDidCatch.
   */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
