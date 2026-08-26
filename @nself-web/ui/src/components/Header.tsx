'use client'

import * as React from 'react'
import { cn } from '../lib/cn'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

export interface HeaderNavItem {
  label: string
  href: string
  /** If true, opens in a new tab with rel="noopener noreferrer" */
  external?: boolean
}

export interface HeaderProps {
  /** Current path/route — used to highlight the active nav item */
  currentPath?: string
  /** Override default nav items */
  navItems?: HeaderNavItem[]
  /** GitHub repo URL for stars badge (null to hide) */
  githubUrl?: string
  /** GitHub star count to display (null to hide count) */
  githubStars?: number | null
  /** Custom logo element — defaults to ɳSelf SVG logo */
  logo?: React.ReactNode
  /** AccountButton slot — rendered in the header right side */
  accountButton?: React.ReactNode
  /** Logo home href */
  logoHref?: string
  /**
   * Accessible name for the logo/brand link. Override this when passing a
   * `logo` for a different product (e.g. "ɳTask home") — the default assumes
   * the ɳSelf brand and the `logo` SVG icon is `aria-hidden`, so its visible
   * text is not exposed as the link's accessible name.
   */
  brandLabel?: string
  /** Chat URL for ɳChat link (null to hide) */
  chatUrl?: string | null
  /** Additional className for the <header> element */
  className?: string
}

const defaultNavItems: HeaderNavItem[] = [
  { label: 'Products', href: '/products' },
  { label: 'Plugins', href: '/plugins' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: 'https://nself.org/docs', external: true },
  { label: 'Changelog', href: '/changelog' },
  { label: 'Blog', href: '/blog' },
]

/**
 * ɳSelf shared Header component.
 *
 * Features:
 * - UX-U19: skip-to-content link as first focusable element
 * - Sticky top nav with blur backdrop
 * - Desktop nav with active link highlighting
 * - GitHub stars badge (optional)
 * - ɳChat link (optional)
 * - AccountButton slot (for auth components — wired in A1-T07)
 * - ThemeToggle (persists to nself_theme localStorage)
 * - Mobile hamburger menu
 *
 * Based on Claude Design shell.jsx Header component.
 */
export function Header({
  currentPath,
  navItems = defaultNavItems,
  githubUrl = 'https://github.com/nself-org/cli',
  githubStars = null,
  logo,
  accountButton,
  logoHref = 'https://nself.org',
  brandLabel = 'ɳSelf home',
  chatUrl = 'https://chat.nself.org',
  className,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-white/90 backdrop-blur-md dark:bg-brand-header/90',
        'border-b border-slate-200/70 dark:border-white/5',
        className
      )}
    >
      {/* UX-U19: Skip to main content — first focusable element */}
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only',
          'focus:absolute focus:left-4 focus:top-4 focus:z-50',
          'focus:rounded-md focus:bg-sky-600 focus:px-4 focus:py-2',
          'focus:text-sm focus:font-medium focus:text-white',
          'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2'
        )}
      >
        Skip to content
      </a>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <a
            href={logoHref}
            className="flex-shrink-0 text-slate-900 dark:text-white"
            aria-label={brandLabel}
          >
            {logo ?? <Logo className="h-8 w-auto" />}
          </a>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => {
              const active = isActive(item.href, currentPath)
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    active
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400'
                  )}
                >
                  {item.label}
                  {item.external && (
                    <ExternalIcon className="inline h-3 w-3 ml-0.5 opacity-60" />
                  )}
                </a>
              )
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* GitHub stars badge */}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'hidden md:inline-flex items-center gap-1.5 rounded-md',
                  'border border-slate-200 dark:border-white/10',
                  'px-2.5 py-1 text-xs font-medium',
                  'text-slate-700 dark:text-slate-300',
                  'hover:bg-slate-50 dark:hover:bg-white/5 transition'
                )}
                aria-label="GitHub repository"
              >
                <GitHubIcon className="w-4 h-4" />
                {githubStars !== null && (
                  <>
                    <span>{formatStars(githubStars)}</span>
                    <span className="text-amber-500">★</span>
                  </>
                )}
              </a>
            )}

            {/* ɳChat link */}
            {chatUrl && (
              <a
                href={chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="ɳChat — our self-hosted chat"
                className={cn(
                  'hidden md:inline-flex items-center justify-center h-8 w-8 rounded-md',
                  'text-sky-600 dark:text-sky-400',
                  'hover:bg-sky-50 dark:hover:bg-sky-500/10 transition'
                )}
                aria-label="ɳChat"
              >
                <ChatIcon className="w-4 h-4" />
              </a>
            )}

            {/* AccountButton slot — wired in A1-T07 */}
            {accountButton}

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                'lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-md',
                'text-slate-700 dark:text-slate-300',
                'hover:bg-slate-100 dark:hover:bg-white/5'
              )}
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-white/5 bg-white dark:bg-brand-bg">
          <nav
            aria-label="Mobile navigation"
            className="px-4 py-4 flex flex-col gap-1"
          >
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isActive(itemHref: string, currentPath?: string): boolean {
  if (!currentPath) return false
  // External links (with ://) are never "active" by path
  if (itemHref.includes('://')) return false
  // Strip trailing slash for comparison
  const normalize = (p: string) => p.replace(/\/$/, '') || '/'
  const normed = normalize(itemHref)
  const cur = normalize(currentPath)
  return cur === normed || cur.startsWith(normed + '/')
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ─── Inline icons (no external dep) ───────────────────────────────────────────

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 .198a8 8 0 0 0-8 8 7.999 7.999 0 0 0 5.47 7.59c.4.076.547-.172.547-.384 0-.19-.007-.694-.01-1.36-2.226.482-2.695-1.074-2.695-1.074-.364-.923-.89-1.17-.89-1.17-.725-.496.056-.486.056-.486.803.056 1.225.824 1.225.824.714 1.224 1.873.87 2.33.666.072-.518.278-.87.507-1.07-1.777-.2-3.644-.888-3.644-3.954 0-.873.31-1.586.823-2.146-.09-.202-.36-1.016.07-2.118 0 0 .67-.214 2.2.82a7.67 7.67 0 0 1 2-.27 7.67 7.67 0 0 1 2 .27c1.52-1.034 2.19-.82 2.19-.82.43 1.102.16 1.916.08 2.118.51.56.82 1.273.82 2.146 0 3.074-1.87 3.75-3.65 3.947.28.24.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.14.46.55.38A7.972 7.972 0 0 0 16 8.199a8 8 0 0 0-8-8Z" />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.28 3.22a.75.75 0 00-1.06 1.06L8.94 10l-5.72 5.72a.75.75 0 101.06 1.06L10 11.06l5.72 5.72a.75.75 0 101.06-1.06L11.06 10l5.72-5.72a.75.75 0 00-1.06-1.06L10 8.94 4.28 3.22z"
        clipRule="evenodd"
      />
    </svg>
  )
}
