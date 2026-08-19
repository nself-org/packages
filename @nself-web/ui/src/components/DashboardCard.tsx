import * as React from 'react'
import { cn } from '../lib/cn'

// A1-T08: DashboardCard — account dashboard tile
// Spec: p97-web-redesign-a1-component-library-expansion.md § Components — DashboardCard
// Source: pages3.jsx

export interface DashboardCardProps {
  /** Card heading */
  title: string
  /** Optional subtitle / description below the title */
  subtitle?: string
  /** Icon slot — rendered in the top-left corner of the card */
  icon?: React.ReactNode
  /** Action slot — rendered in the bottom-right corner (e.g. a <Button>) */
  action?: React.ReactNode
  /** Optional status indicator: 'ok' | 'warn' | 'error' */
  status?: 'ok' | 'warn' | 'error'
  /** Additional className applied to the card root */
  className?: string
  /** Card children rendered between subtitle and action rows */
  children?: React.ReactNode
}

const statusDotClass: Record<NonNullable<DashboardCardProps['status']>, string> = {
  ok: 'bg-green-500',
  warn: 'bg-amber-400',
  error: 'bg-rose-500',
}

/**
 * DashboardCard — account dashboard tile component.
 *
 * Provides a structured layout for dashboard overview tiles with:
 * - Icon slot (top-left)
 * - Title + subtitle
 * - Optional status dot
 * - Action slot (bottom-right, e.g. a <Button>)
 * - Optional children for additional content
 */
export function DashboardCard({
  title,
  subtitle,
  icon,
  action,
  status,
  className,
  children,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-6',
        'dark:border-white/10 dark:bg-slate-900',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        className,
      )}
    >
      {/* Header row: icon + status dot */}
      <div className="flex items-start justify-between mb-4">
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
            {icon}
          </div>
        ) : (
          <div />
        )}

        {status && (
          <span
            className={cn('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', statusDotClass[status])}
            role="status"
            aria-label={`Status: ${status}`}
          />
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}

      {/* Optional children */}
      {children && <div className="mt-4">{children}</div>}

      {/* Action slot */}
      {action && (
        <div className="mt-5 flex justify-end">
          {action}
        </div>
      )}
    </div>
  )
}
