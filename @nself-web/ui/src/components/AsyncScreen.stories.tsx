/**
 * Purpose: Storybook stories for AsyncScreen<T> — one story per state (7 total).
 *   Used as the visual QA gate: designers verify each state in isolation before E3 migrations.
 * Inputs: AsyncScreen component with controlled result prop per story.
 * Outputs: 7 Storybook story entries covering all AsyncScreen states.
 * Constraints: Each story must exercise exactly one AsyncScreen state.
 *   All 7 must appear in the built Storybook sidebar.
 */
import type { Meta, StoryObj } from '@storybook/react'
import { AsyncScreen } from './AsyncScreen'
import type { AsyncScreenProps, AppError } from './AsyncScreen'
import React from 'react'

// ---------------------------------------------------------------------------
// Sample data type for stories
// ---------------------------------------------------------------------------
interface TaskItem {
  id: string
  title: string
  done: boolean
}

const sampleData: TaskItem[] = [
  { id: '1', title: 'Ship the design system', done: true },
  { id: '2', title: 'Migrate org app', done: false },
  { id: '3', title: 'Visual regression CI', done: false },
]

function TaskList({ items }: { items: TaskItem[] }): React.ReactElement {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 px-4 py-3 text-sm">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${item.done ? 'bg-emerald-500' : 'bg-slate-300'}`}
            aria-hidden="true"
          />
          <span
            className={
              item.done
                ? 'text-slate-400 dark:text-slate-500 line-through'
                : 'text-slate-900 dark:text-slate-100'
            }
          >
            {item.title}
          </span>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Helper errors
// ---------------------------------------------------------------------------
const networkError: AppError = { code: 'NETWORK', message: 'Network request failed', retryable: true }
const serverError: AppError = { code: 'SERVER_ERROR', message: 'Internal server error (500)', retryable: true }
const authError: AppError = { code: 'AUTH', message: 'Authentication required', retryable: false }
const rateLimitError: AppError = { code: 'RATE_LIMITED', message: 'Rate limit exceeded', retryable: true }

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------
const meta: Meta<AsyncScreenProps<TaskItem[]>> = {
  title: 'UI/AsyncScreen',
  component: AsyncScreen,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0F0F1A' },
        { name: 'light', value: '#f8fafc' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onRetry: { action: 'retry clicked' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// ---------------------------------------------------------------------------
// Story 1: Loading state
// ---------------------------------------------------------------------------
export const Loading: Story = {
  name: 'State 1 — Loading',
  args: {
    result: 'loading',
    renderData: (data: TaskItem[]) => <TaskList items={data} />,
  },
}

// ---------------------------------------------------------------------------
// Story 2: Empty state
// ---------------------------------------------------------------------------
export const Empty: Story = {
  name: 'State 2 — Empty',
  args: {
    result: { ok: true, data: [] as TaskItem[] },
    renderData: (data: TaskItem[]) => <TaskList items={data} />,
    emptyCheck: (data: TaskItem[]) => data.length === 0,
    emptyMessage: 'No tasks yet. Create your first task to get started.',
    emptyActionLabel: 'Create task',
  },
}

// ---------------------------------------------------------------------------
// Story 3: Error state (generic server/unknown error)
// ---------------------------------------------------------------------------
export const Error: Story = {
  name: 'State 3 — Error',
  args: {
    result: { ok: false, error: serverError },
    renderData: (data: TaskItem[]) => <TaskList items={data} />,
  },
}

// ---------------------------------------------------------------------------
// Story 4: Offline state (NETWORK error)
// ---------------------------------------------------------------------------
export const Offline: Story = {
  name: 'State 4 — Offline',
  args: {
    result: { ok: false, error: networkError },
    renderData: (data: TaskItem[]) => <TaskList items={data} />,
  },
}

// ---------------------------------------------------------------------------
// Story 5: Permission denied state (AUTH error)
// ---------------------------------------------------------------------------
export const PermissionDenied: Story = {
  name: 'State 5 — Permission Denied',
  args: {
    result: { ok: false, error: authError },
    renderData: (data: TaskItem[]) => <TaskList items={data} />,
  },
}

// ---------------------------------------------------------------------------
// Story 6: Rate limited state (RATE_LIMITED error)
// ---------------------------------------------------------------------------
export const RateLimited: Story = {
  name: 'State 6 — Rate Limited',
  args: {
    result: { ok: false, error: rateLimitError },
    renderData: (data: TaskItem[]) => <TaskList items={data} />,
  },
}

// ---------------------------------------------------------------------------
// Story 7: Populated state (success with data)
// ---------------------------------------------------------------------------
export const Populated: Story = {
  name: 'State 7 — Populated',
  args: {
    result: { ok: true, data: sampleData },
    renderData: (data: TaskItem[]) => <TaskList items={data} />,
    emptyCheck: (data: TaskItem[]) => data.length === 0,
  },
}
