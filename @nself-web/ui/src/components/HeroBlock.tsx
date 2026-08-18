import * as React from 'react'
import { cn } from '../lib/cn'

// A1-T04: HeroBlock — home hero with H1 + subtitle + CTA + LiveVersion pill slot.
// Source: web-org-redesign-2026-04-25/src/home.jsx
// HeroBlock accepts a liveVersionSlot prop — the actual <LiveVersion/> component (A1-T06)
// is injected by the caller so that HeroBlock has no server-component dependency.

export interface HeroBlockStat {
  /** Numeric or string value (e.g. "93", "$0") */
  value: string
  /** Label below the value */
  label: string
}

export interface HeroBlockCTA {
  label: React.ReactNode
  href: string
  /** Button variant — primary = sky, ghost = text-only */
  variant?: 'primary' | 'ghost'
  /** Open in new tab */
  external?: boolean
}

export interface HeroBlockChip {
  label: string
  icon?: React.ReactNode
}

export interface HeroBlockProps {
  /** Optional badge pills shown above the H1 */
  pills?: React.ReactNode
  /** Main headline — may contain inline JSX for gradient spans */
  headline: React.ReactNode
  /** Subtitle / description paragraph */
  subtitle: React.ReactNode
  /** CTA buttons; first is primary, rest follow order */
  ctas?: HeroBlockCTA[]
  /** Stats row below CTAs — ignored when chips is provided */
  stats?: HeroBlockStat[]
  /** Small outlined platform chips below CTAs — takes priority over stats */
  chips?: HeroBlockChip[]
  /** Slot for the terminal / demo block shown to the right on desktop */
  demoSlot?: React.ReactNode
  /** Additional className on the outer <section> */
  className?: string
}

/** Star-field decorative background (client-side CSS-only, no JS needed) */
function StarField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      <div
        className="hidden dark:block absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #6366F1 0%, #38BDF8 50%, transparent 80%)' }}
      />
    </div>
  )
}

const arrowIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

const githubIcon = (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path d="M8 .198a8 8 0 0 0-8 8 7.999 7.999 0 0 0 5.47 7.59c.4.076.547-.172.547-.384 0-.19-.007-.694-.01-1.36-2.226.482-2.695-1.074-2.695-1.074-.364-.923-.89-1.17-.89-1.17-.725-.496.056-.486.056-.486.803.056 1.225.824 1.225.824.714 1.224 1.873.87 2.33.666.072-.518.278-.87.507-1.07-1.777-.2-3.644-.888-3.644-3.954 0-.873.31-1.586.823-2.146-.09-.202-.36-1.016.07-2.118 0 0 .67-.214 2.2.82a7.67 7.67 0 0 1 2-.27 7.67 7.67 0 0 1 2 .27c1.52-1.034 2.19-.82 2.19-.82.43 1.102.16 1.916.08 2.118.51.56.82 1.273.82 2.146 0 3.074-1.87 3.75-3.65 3.947.28.24.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.14.46.55.38A7.972 7.972 0 0 0 16 8.199a8 8 0 0 0-8-8Z" />
  </svg>
)

export function HeroBlock({
  pills,
  headline,
  subtitle,
  ctas = [],
  stats = [],
  chips,
  demoSlot,
  className,
}: HeroBlockProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-slate-200 dark:border-white/5',
        className,
      )}
    >
      <StarField />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left column */}
          <div className={cn(demoSlot ? 'lg:col-span-6' : 'lg:col-span-8')}>
            {pills && (
              <div className="flex flex-wrap items-center gap-2 mb-5">{pills}</div>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.05]">
              {headline}
            </h1>
            <div className="mt-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              {subtitle}
            </div>

            {ctas.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {ctas.map((cta, i) => {
                  const base =
                    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors px-5 py-2.5'
                  const variantCls =
                    cta.variant === 'ghost'
                      ? 'text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  return (
                    <a
                      key={i}
                      href={cta.href}
                      target={cta.external ? '_blank' : undefined}
                      rel={cta.external ? 'noopener noreferrer' : undefined}
                      className={cn(base, variantCls)}
                    >
                      {cta.label}
                      {i === 0 && cta.variant !== 'ghost' && arrowIcon}
                      {cta.variant === 'ghost' && githubIcon}
                    </a>
                  )
                })}
              </div>
            )}

            {chips && chips.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    {chip.icon}
                    {chip.label}
                  </span>
                ))}
              </div>
            ) : stats.length > 0 ? (
              <div className="mt-10 grid grid-cols-4 gap-6 text-xs text-slate-500 dark:text-slate-500 max-w-lg">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-wider leading-tight mt-0.5">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Right column — demo slot */}
          {demoSlot && (
            <div className="lg:col-span-6">{demoSlot}</div>
          )}
        </div>
      </div>
    </section>
  )
}
