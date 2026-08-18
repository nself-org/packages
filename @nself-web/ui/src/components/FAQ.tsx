import * as React from 'react'
import { cn } from '../lib/cn'

// A1-T04: FAQ — native <details>/<summary> accordions, NO JS state.
// Spec: "MUST use native <details>/<summary> — no JS state, no custom accordion library."
// Source: web-org-redesign-2026-04-25/src/pages1.jsx (PricingPage FAQ section)

export interface FAQItem {
  /** The question text shown in the summary / trigger */
  question: string
  /** The answer content — may be a string or JSX */
  answer: React.ReactNode
}

export interface FAQProps {
  /** Array of Q&A pairs */
  items: FAQItem[]
  /**
   * Optional section heading rendered above the FAQ list.
   * When provided, wraps in an <h2>; set to null to omit.
   */
  heading?: string | null
  /** Additional className on the outer <div> */
  className?: string
}

export function FAQ({ items, heading = 'Frequently asked questions', className }: FAQProps) {
  return (
    <div className={cn('mx-auto max-w-3xl', className)}>
      {heading && (
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
          {heading}
        </h2>
      )}
      {/* dl / dt / dd gives correct semantics for a FAQ list */}
      <dl className="divide-y divide-slate-200 dark:divide-white/5">
        {items.map((item, i) => (
          // Native <details> — zero JS state, fully accessible, respects prefers-reduced-motion
          <details
            key={i}
            className="group py-5 [&>summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left">
              <dt className="text-base font-semibold text-slate-900 dark:text-white">
                {item.question}
              </dt>
              {/* Chevron — CSS transform via group-open selector, no JS */}
              <span
                className="mt-0.5 flex-shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </summary>
            <dd className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {item.answer}
            </dd>
          </details>
        ))}
      </dl>
    </div>
  )
}
