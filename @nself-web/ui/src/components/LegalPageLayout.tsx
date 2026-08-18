'use client'

import * as React from 'react'
import { cn } from '../lib/cn'

// A1-T08: LegalPageLayout — wrapper for terms/privacy/dpa with auto-generated TOC
// Spec: p97-web-redesign-a1-component-library-expansion.md § Components — LegalPageLayout
// Source: pages4.jsx
//
// TOC generation: useEffect traverses children container via ref, collecting <h2> elements.
// Falls back gracefully to empty TOC when no headings are found.

export interface LegalTocItem {
  id: string
  label: string
}

export interface LegalPageLayoutProps {
  /** Document title rendered as the <h1> at the top */
  title: string
  /** Last-updated / effective date shown below the title */
  lastUpdated?: string
  /** Page content — TOC links are auto-generated from <h2> elements inside.
   * Optional: component gracefully renders an empty TOC when no children are provided. */
  children?: React.ReactNode
  /** Additional className on the outer wrapper */
  className?: string
  /**
   * Optional override for TOC items. When provided, the auto-generated TOC
   * is skipped and these items are rendered instead. Useful for RSC / SSR contexts.
   */
  tocItems?: LegalTocItem[]
}

/**
 * LegalPageLayout — full-page layout for legal documents (Terms, Privacy, DPA).
 *
 * Renders a two-column layout:
 * - Left sidebar: sticky TOC auto-generated from <h2> elements in children
 * - Right content: the legal page body
 *
 * TOC links are functional `<a href="#id">` anchors. <h2> elements in children
 * must carry id attributes for the links to work. If an <h2> has no id, it is
 * skipped from TOC. An empty children tree produces an empty TOC gracefully.
 */
export function LegalPageLayout({
  title,
  lastUpdated,
  children,
  className,
  tocItems: tocItemsProp,
}: LegalPageLayoutProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [autoTocItems, setAutoTocItems] = React.useState<LegalTocItem[]>([])

  // Auto-generate TOC from <h2> elements when no tocItems prop provided
  React.useEffect(() => {
    if (tocItemsProp !== undefined) return
    if (!contentRef.current) return

    const headings = Array.from(contentRef.current.querySelectorAll('h2'))
    const items: LegalTocItem[] = headings
      .filter((h) => !!h.id)
      .map((h) => ({
        id: h.id,
        label: h.textContent?.trim() ?? '',
      }))

    setAutoTocItems(items)
  }, [tocItemsProp, children])

  const tocItems = tocItemsProp ?? autoTocItems

  return (
    <div className={cn('min-h-screen bg-white dark:bg-slate-950', className)}>
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        {/* Page title block */}
        <div className="mb-12 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {title}
          </h1>
          {lastUpdated && (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Last updated:{' '}
              <time dateTime={lastUpdated} className="font-medium text-slate-700 dark:text-slate-300">
                {lastUpdated}
              </time>
            </p>
          )}
        </div>

        {/* Two-column layout */}
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-16">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <nav aria-label="Table of contents">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  On this page
                </p>
                {tocItems.length === 0 ? null : (
                  <ol className="space-y-2.5">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className={cn(
                            'block text-sm text-slate-600 dark:text-slate-400',
                            'hover:text-sky-600 dark:hover:text-sky-400',
                            'transition-colors duration-150',
                          )}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </nav>
            </div>
          </aside>

          {/* Legal content */}
          <div
            ref={contentRef}
            className={cn(
              'prose prose-slate dark:prose-invert max-w-none',
              // Headings
              'prose-h2:scroll-mt-8 prose-h2:text-xl prose-h2:font-semibold',
              // Links
              'prose-a:text-sky-600 dark:prose-a:text-sky-400',
              // Lead paragraphs
              'prose-lead:text-slate-600 dark:prose-lead:text-slate-400',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
