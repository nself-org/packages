import * as React from 'react'
import { cn } from '../lib/cn'

// A1-T03: Pill — 7 tones × 2 variants (solid / outlined)
// Spec: p97-web-redesign-a1-component-library-expansion.md § Components — Button, Pill
// Source: web-org-redesign-2026-04-25/src/shell.jsx

export type PillTone =
  | 'sky'
  | 'indigo'
  | 'green'
  | 'purple'
  | 'amber'
  | 'rose'
  | 'slate'

export type PillVariant = 'solid' | 'outlined'

export interface PillProps {
  /** 7 brand tones */
  tone?: PillTone
  /** solid = filled background; outlined = transparent bg, coloured border */
  variant?: PillVariant
  className?: string
  children: React.ReactNode
}

/**
 * Solid = tinted bg + matching text. Used for labels, badges, status chips.
 * Outlined = transparent bg + border. Used for version chips, filter pills.
 */
const toneClasses: Record<PillTone, Record<PillVariant, string>> = {
  sky: {
    solid:
      'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    outlined:
      'border border-sky-200 dark:border-sky-500/20 text-sky-700 dark:text-sky-300',
  },
  indigo: {
    solid:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
    outlined:
      'border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  },
  green: {
    solid:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    outlined:
      'border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  },
  purple: {
    solid:
      'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
    outlined:
      'border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300',
  },
  amber: {
    solid:
      'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    outlined:
      'border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400',
  },
  rose: {
    solid:
      'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    outlined:
      'border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300',
  },
  slate: {
    solid:
      'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400',
    outlined:
      'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400',
  },
}

export function Pill({
  tone = 'sky',
  variant = 'solid',
  className,
  children,
}: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        toneClasses[tone][variant],
        className
      )}
    >
      {children}
    </span>
  )
}
