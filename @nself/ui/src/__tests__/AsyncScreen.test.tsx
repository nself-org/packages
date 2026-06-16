/**
 * AsyncScreen — 7-state unit tests.
 *
 * Purpose: Verify that AsyncScreen renders the correct sub-component for each of
 *          the 7 async states, and that all sub-components meet WCAG 2.1 AA
 *          accessibility requirements (aria-live, role=alert/status).
 * Constraints:
 *   - 3 assertions per state = 21 minimum.
 *   - Tests run in jsdom environment.
 *   - Uses @testing-library/react + @testing-library/jest-dom.
 * SPORT: F-NSELF-UI-ASYNCSCREEN-TESTS-01
 *
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { AsyncScreen } from '../async-screen/AsyncScreen.js';
import {
  LoadingState,
  EmptyState,
  ErrorState,
  OfflineState,
  PermissionDeniedState,
  RateLimitedState,
} from '../async-screen/states.js';
import { ok, err } from '@nself/errors';
import type { AppError } from '@nself/errors';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAuthError(): AppError {
  return { code: 'auth_failed', message: 'Token expired', status: 401 };
}

function makeForbiddenError(): AppError {
  return { code: 'forbidden', message: 'Forbidden', status: 403 };
}

function makeRateLimitError(): AppError {
  return { code: 'rate_limited', message: 'Too many requests', status: 429 };
}

function makeInternalError(): AppError {
  return { code: 'internal', message: 'Server exploded', status: 500 };
}

// ─── State 1: Loading ─────────────────────────────────────────────────────────

describe('AsyncScreen — State 1: loading', () => {
  it('renders LoadingState when result is "loading"', () => {
    render(
      <AsyncScreen
        result="loading"
        renderData={(d: string[]) => <ul>{d.map((s) => <li key={s}>{s}</li>)}</ul>}
      />,
    );
    // ARIA: role=status is present
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('LoadingState has aria-live="polite" for non-disruptive announcement', () => {
    render(<LoadingState label="Loading" />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('LoadingState has accessible aria-label', () => {
    render(<LoadingState label="Loading data" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading data');
  });
});

// ─── State 2: Empty ───────────────────────────────────────────────────────────

describe('AsyncScreen — State 2: empty', () => {
  it('renders EmptyState when emptyCheck returns true for Ok result', () => {
    render(
      <AsyncScreen
        result={ok([])}
        renderData={(d: string[]) => <ul>{d.map((s) => <li key={s}>{s}</li>)}</ul>}
        emptyCheck={(d) => d.length === 0}
      />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('EmptyState has aria-live="polite"', () => {
    render(<EmptyState heading="Nothing here" body="Add your first item." />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('EmptyState renders the heading text', () => {
    render(<EmptyState heading="Nothing here yet" body="Empty" />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });
});

// ─── State 3: Error ───────────────────────────────────────────────────────────

describe('AsyncScreen — State 3: error (generic)', () => {
  it('renders ErrorState for an internal error', () => {
    // Mock navigator.onLine = true so classifyError doesn't go offline
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });

    render(
      <AsyncScreen
        result={err(makeInternalError())}
        renderData={(d: string[]) => <div>{d.join(',')}</div>}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('ErrorState has aria-live="assertive" for immediate announcement', () => {
    render(
      <ErrorState
        heading="Something went wrong"
        body="Try again"
        retryLabel="Retry"
      />,
    );
    const el = screen.getByRole('alert');
    expect(el).toHaveAttribute('aria-live', 'assertive');
  });

  it('ErrorState renders retry button when onRetry is provided', () => {
    const retry = vi.fn();
    render(
      <ErrorState
        heading="Error"
        body="Error body"
        retryLabel="Try again"
        onRetry={retry}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Try again' });
    expect(btn).toBeInTheDocument();
  });
});

// ─── State 4: Offline ─────────────────────────────────────────────────────────

describe('AsyncScreen — State 4: offline', () => {
  beforeEach(() => {
    // Simulate offline
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
  });

  it('renders OfflineState when navigator.onLine is false on a generic error', () => {
    render(
      <AsyncScreen
        result={err(makeInternalError())}
        renderData={(d: string[]) => <div>{d.join(',')}</div>}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('OfflineState has aria-live="assertive"', () => {
    render(<OfflineState heading="You are offline" body="Check connection" />);
    const el = screen.getByRole('alert');
    expect(el).toHaveAttribute('aria-live', 'assertive');
  });

  it('OfflineState renders heading text', () => {
    render(<OfflineState heading="No connection" body="Check your network." />);
    expect(screen.getByText('No connection')).toBeInTheDocument();
  });
});

// ─── State 5: PermissionDenied ────────────────────────────────────────────────

describe('AsyncScreen — State 5: permissionDenied', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
  });

  it('renders PermissionDeniedState for auth_failed error', () => {
    render(
      <AsyncScreen
        result={err(makeAuthError())}
        renderData={(d: string[]) => <div>{d.join(',')}</div>}
      />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders PermissionDeniedState for forbidden error', () => {
    render(
      <AsyncScreen
        result={err(makeForbiddenError())}
        renderData={(d: string[]) => <div>{d.join(',')}</div>}
      />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('PermissionDeniedState has aria-live="polite"', () => {
    render(<PermissionDeniedState heading="Access restricted" body="Upgrade to access." />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });
});

// ─── State 6: RateLimited ─────────────────────────────────────────────────────

describe('AsyncScreen — State 6: rateLimited', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
  });

  it('renders RateLimitedState for rate_limited error', () => {
    render(
      <AsyncScreen
        result={err(makeRateLimitError())}
        renderData={(d: string[]) => <div>{d.join(',')}</div>}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('RateLimitedState has aria-live="assertive"', () => {
    render(<RateLimitedState heading="Rate limit reached" body="Wait a moment." />);
    const el = screen.getByRole('alert');
    expect(el).toHaveAttribute('aria-live', 'assertive');
  });

  it('RateLimitedState renders heading text', () => {
    render(<RateLimitedState heading="Slow down" body="Try again later." />);
    expect(screen.getByText('Slow down')).toBeInTheDocument();
  });
});

// ─── State 7: Populated ───────────────────────────────────────────────────────

describe('AsyncScreen — State 7: populated', () => {
  it('renders children via renderData when result is Ok and not empty', () => {
    render(
      <AsyncScreen
        result={ok(['task-1', 'task-2'])}
        renderData={(d: string[]) => (
          <ul>
            {d.map((s) => <li key={s}>{s}</li>)}
          </ul>
        )}
        emptyCheck={(d) => d.length === 0}
      />,
    );
    expect(screen.getByText('task-1')).toBeInTheDocument();
  });

  it('does NOT render any state component when result is Ok and not empty', () => {
    render(
      <AsyncScreen
        result={ok(['item'])}
        renderData={(d: string[]) => <span data-testid="populated">{d[0]}</span>}
      />,
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('populated')).toBeInTheDocument();
  });

  it('passes all data items to renderData', () => {
    const items = ['a', 'b', 'c'];
    render(
      <AsyncScreen
        result={ok(items)}
        renderData={(d: string[]) => <div data-testid="count">{d.length}</div>}
      />,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('3');
  });
});
