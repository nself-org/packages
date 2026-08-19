import * as React from 'react'
import { cn } from '../lib/cn'

// A1-T04: Section — eyebrow + title + subtitle pattern; spacing vars.
// Source: web-org-redesign-2026-04-25/src/shell.jsx

export interface SectionProps {
  /** Optional HTML id for anchor links */
  id?: string
  /** Small uppercase label above the title */
  eyebrow?: string
  /** Section heading */
  title?: React.ReactNode
  /** Subtitle / description below the heading */
  subtitle?: React.ReactNode
  /** Section content */
  children?: React.ReactNode
  /** Additional className on the <section> element */
  className?: string
}

export function Section({ id, title, eyebrow, subtitle, children, className }: SectionProps) {
  return (
    <section id={id} className={cn('py-16 sm:py-20', className)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {(title || eyebrow) && (
          <div className="max-w-3xl mb-10">
            {eyebrow && (
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400 mb-3">
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
