import * as React from 'react'
import { cn } from '../lib/cn'

// A1-T04: FeatureGrid — 3-col feature grid pattern.
// Source: web-org-redesign-2026-04-25/src/home.jsx (ValueCard pattern), products.jsx

export type FeatureGridTone = 'green' | 'sky' | 'indigo' | 'purple' | 'amber' | 'rose' | 'slate'

export interface FeatureGridItem {
  /** Icon element (e.g. SVG or emoji) */
  icon: React.ReactNode
  /** Feature name / heading */
  title: string
  /** Feature description */
  description: string
  /** Colour tone for the icon container ring */
  tone?: FeatureGridTone
}

export interface FeatureGridProps {
  /** Array of feature items to render */
  features: FeatureGridItem[]
  /**
   * Grid column count on large screens.
   * @default 3
   */
  columns?: 2 | 3 | 4
  /** Additional className on the grid container */
  className?: string
}

const toneCls: Record<FeatureGridTone, string> = {
  green:  'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  sky:    'text-sky-600 dark:text-sky-400 bg-sky-500/10 ring-sky-500/20',
  indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 ring-indigo-500/20',
  purple: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 ring-purple-500/20',
  amber:  'text-amber-600 dark:text-amber-400 bg-amber-500/10 ring-amber-500/20',
  rose:   'text-rose-600 dark:text-rose-400 bg-rose-500/10 ring-rose-500/20',
  slate:  'text-slate-600 dark:text-slate-400 bg-slate-500/10 ring-slate-500/20',
}

const colsCls: Record<2 | 3 | 4, string> = {
  2: 'grid sm:grid-cols-2 gap-4',
  3: 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4',
  4: 'grid sm:grid-cols-2 lg:grid-cols-4 gap-4',
}

export function FeatureGrid({ features, columns = 3, className }: FeatureGridProps) {
  return (
    <div className={cn(colsCls[columns], className)}>
      {features.map((feat, i) => {
        const tone = feat.tone ?? 'sky'
        return (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 hover:border-sky-300 dark:hover:border-sky-500/30 transition-colors"
          >
            <div
              className={cn(
                'h-10 w-10 rounded-lg grid place-items-center ring-1 ring-inset',
                toneCls[tone],
              )}
              aria-hidden="true"
            >
              {feat.icon}
            </div>
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{feat.title}</h3>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {feat.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
