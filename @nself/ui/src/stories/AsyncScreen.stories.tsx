/**
 * AsyncScreen stories — one story per state so designers and QA can verify
 * each state in isolation (light + dark mode via Storybook backgrounds).
 *
 * Purpose: Provide visual regression anchors and manual QA surface for all
 *          7 AsyncScreen states.
 * SPORT: F-NSELF-UI-ASYNCSCREEN-STORIES-01
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ok, err } from '@nself/errors';
import type { AppError } from '@nself/errors';

import {
  LoadingState,
  EmptyState,
  ErrorState,
  OfflineState,
  PermissionDeniedState,
  RateLimitedState,
} from '../async-screen/states.js';
import { AsyncScreen } from '../async-screen/AsyncScreen.js';

// ─── AsyncScreen meta ─────────────────────────────────────────────────────────

const meta = {
  title: 'AsyncScreen/States',
  component: AsyncScreen,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof AsyncScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Dummy data type ─────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
}

function sampleData(): Task[] {
  return [
    { id: '1', title: 'Review pull request' },
    { id: '2', title: 'Write release notes' },
    { id: '3', title: 'Deploy to staging' },
  ];
}

function makeError(code: AppError['code']): AppError {
  const statusMap: Record<AppError['code'], number> = {
    auth_failed: 401,
    not_found: 404,
    forbidden: 403,
    validation_error: 422,
    rate_limited: 429,
    internal: 500,
    license_required: 402,
    tenant_mismatch: 409,
  };
  return { code, message: `[${code}] error`, status: statusMap[code] };
}

// ─── State 1: Loading ─────────────────────────────────────────────────────────

export const Loading: Story = {
  name: '1. Loading',
  render: () => (
    <div style={{ width: 400 }}>
      <AsyncScreen<Task[]>
        result="loading"
        renderData={(tasks) => (
          <ul>
            {tasks.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
        )}
      />
    </div>
  ),
};

// ─── State 2: Empty ───────────────────────────────────────────────────────────

export const Empty: Story = {
  name: '2. Empty',
  render: () => (
    <div style={{ width: 400 }}>
      <AsyncScreen<Task[]>
        result={ok([])}
        renderData={(tasks) => (
          <ul>
            {tasks.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
        )}
        emptyCheck={(d) => d.length === 0}
      />
    </div>
  ),
};

// ─── State 3: Error ───────────────────────────────────────────────────────────

export const Error: Story = {
  name: '3. Error',
  render: () => (
    <div style={{ width: 400 }}>
      <AsyncScreen<Task[]>
        result={err(makeError('internal'))}
        renderData={(tasks) => (
          <ul>
            {tasks.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
        )}
        onRetry={() => { window.alert('Retrying…'); }}
      />
    </div>
  ),
};

// ─── State 4: Offline ─────────────────────────────────────────────────────────

export const Offline: Story = {
  name: '4. Offline',
  render: () => (
    <div style={{ width: 400 }}>
      <AsyncScreen<Task[]>
        result={err({ code: 'internal', message: 'fetch failed', status: 500 })}
        renderData={(tasks) => (
          <ul>
            {tasks.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
        )}
        slots={{
          // Force offline display for Storybook (navigator.onLine is true in iframe)
          offline: (
            <OfflineState
              heading="You are offline"
              body="Check your connection and try again."
            />
          ),
          error: () => (
            <OfflineState
              heading="You are offline"
              body="Check your connection and try again."
            />
          ),
        }}
      />
    </div>
  ),
};

// ─── State 5: Permission Denied ───────────────────────────────────────────────

export const PermissionDenied: Story = {
  name: '5. Permission Denied',
  render: () => (
    <div style={{ width: 400 }}>
      <AsyncScreen<Task[]>
        result={err(makeError('forbidden'))}
        renderData={(tasks) => (
          <ul>
            {tasks.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
        )}
      />
    </div>
  ),
};

// ─── State 6: Rate Limited ────────────────────────────────────────────────────

export const RateLimited: Story = {
  name: '6. Rate Limited',
  render: () => (
    <div style={{ width: 400 }}>
      <AsyncScreen<Task[]>
        result={err(makeError('rate_limited'))}
        renderData={(tasks) => (
          <ul>
            {tasks.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
        )}
      />
    </div>
  ),
};

// ─── State 7: Populated ───────────────────────────────────────────────────────

export const Populated: Story = {
  name: '7. Populated',
  render: () => (
    <div style={{ width: 400, padding: '1rem' }}>
      <AsyncScreen<Task[]>
        result={ok(sampleData())}
        renderData={(tasks) => (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {tasks.map((t) => (
              <li
                key={t.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #e2e8f0',
                  color: '#0f172a',
                }}
              >
                {t.title}
              </li>
            ))}
          </ul>
        )}
      />
    </div>
  ),
};

// ─── Individual state sub-component stories ───────────────────────────────────

export const LoadingDirect: StoryObj<typeof LoadingState> = {
  name: 'LoadingState (direct)',
  render: () => <LoadingState label="Loading tasks…" />,
};

export const EmptyDirect: StoryObj<typeof EmptyState> = {
  name: 'EmptyState (direct)',
  render: () => <EmptyState heading="Nothing here yet" body="Create your first task to get started." />,
};

export const ErrorDirect: StoryObj<typeof ErrorState> = {
  name: 'ErrorState (direct)',
  render: () => (
    <ErrorState
      heading="Something went wrong"
      body="An unexpected error occurred. Please try again."
      retryLabel="Try again"
      onRetry={() => { window.alert('Retry clicked'); }}
    />
  ),
};

export const OfflineDirect: StoryObj<typeof OfflineState> = {
  name: 'OfflineState (direct)',
  render: () => <OfflineState heading="You are offline" body="Check your connection and try again." />,
};

export const PermissionDeniedDirect: StoryObj<typeof PermissionDeniedState> = {
  name: 'PermissionDeniedState (direct)',
  render: () => (
    <PermissionDeniedState
      heading="Access restricted"
      body="Your plan does not include access to this feature."
    />
  ),
};

export const RateLimitedDirect: StoryObj<typeof RateLimitedState> = {
  name: 'RateLimitedState (direct)',
  render: () => <RateLimitedState heading="Rate limit reached" body="Please wait a moment before trying again." />,
};
