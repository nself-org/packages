import * as React from 'react'
import { cn } from '../lib/cn'

export interface LandingHeroProps {
  headline: string
  subhead: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  badge?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Shared hero section for all nSelf landing pages.
 * Brand: sky-500 on gray-950. Changing tokens.ts brand.primary updates all pages.
 */
export function LandingHero({
  headline,
  subhead,
  primaryCta,
  secondaryCta,
  badge,
  children,
  className,
}: LandingHeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden bg-gray-950 py-20 sm:py-28',
        className
      )}
    >
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,transparent,transparent 31px,#0ea5e9 31px,#0ea5e9 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,#0ea5e9 31px,#0ea5e9 32px)',
        }}
      />
      {/* Sky glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {badge && (
          <div className="mb-6 flex justify-center sm:justify-start">
            <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1 text-sm font-medium text-sky-400">
              {badge}
            </span>
          </div>
        )}

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {headline}
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-gray-400">{subhead}</p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href={primaryCta.href}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400"
            data-analytics-event="hero_primary_cta_click"
          >
            {primaryCta.label}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>

          {secondaryCta && (
            <a
              href={secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
              data-analytics-event="hero_secondary_cta_click"
            >
              {secondaryCta.label}
            </a>
          )}
        </div>

        {children && <div className="mt-12">{children}</div>}
      </div>
    </section>
  )
}
