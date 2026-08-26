import * as React from 'react'
import { cn } from '../lib/cn'
import { Logo } from './Logo'

export interface FooterLink {
  label: string
  /** Internal href (e.g. '/pricing') or external URL */
  href: string
  /** If true: opens in new tab */
  external?: boolean
}

export interface FooterLinkGroup {
  title: string
  links: FooterLink[]
}

export interface FooterStatusPill {
  /** Operational status text */
  label: string
  /** Status state — controls pill color */
  state: 'ok' | 'degraded' | 'down'
  /** href for the status page */
  href: string
}

export interface FooterProps {
  /** 4-column sitemap link groups — defaults to nself.org structure */
  linkGroups?: FooterLinkGroup[]
  /** Status pill — defaults to nself.org all-operational */
  statusPill?: FooterStatusPill | null
  /** Copyright line text (year is prepended automatically) */
  copyrightText?: string
  /** Logo home href */
  logoHref?: string
  /**
   * Accessible name for the logo/brand link. Override this for a different
   * product (e.g. "ɳTask home") — the default assumes the ɳSelf brand and
   * `Logo` is `aria-hidden`, so its visible text is not exposed as the
   * link's accessible name.
   */
  brandLabel?: string
  /** Social links section — set to null to hide */
  social?: FooterSocialProps | null
  /** Additional className */
  className?: string
}

export interface FooterSocialProps {
  githubUrl?: string
  xUrl?: string
  chatUrl?: string
  rssUrl?: string
}

const defaultLinkGroups: FooterLinkGroup[] = [
  {
    title: 'Product',
    links: [
      { label: 'Products', href: '/products' },
      { label: 'Plugins', href: '/plugins' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Compare', href: '/compare' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'ɳCloud', href: 'https://cloud.nself.org', external: true },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Docs', href: 'https://nself.org/docs', external: true },
      { label: 'GitHub', href: 'https://github.com/nself-org/cli', external: true },
      { label: 'CLI install', href: 'https://install.nself.org', external: true },
      { label: 'Status', href: '/status' },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Community', href: '/community' },
      { label: 'Commercial', href: '/commercial' },
      { label: 'Contact', href: 'mailto:hi@nself.org', external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'License (MIT)', href: '/license' },
      { label: 'Terms of service', href: '/terms' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'DPA', href: '/dpa' },
    ],
  },
]

const defaultStatusPill: FooterStatusPill = {
  label: 'All systems operational',
  state: 'ok',
  href: '/status',
}

const defaultSocial: FooterSocialProps = {
  githubUrl: 'https://github.com/nself-org/cli',
  xUrl: 'https://x.com/nselforg',
  chatUrl: 'https://chat.nself.org',
  rssUrl: 'https://nself.org/feed.xml',
}

/**
 * ɳSelf shared Footer component.
 *
 * Features:
 * - 4-column sitemap (Product / Developers / Company / Legal)
 * - Brand row with logo, tagline, and social links
 * - Status pill with animated dot
 * - Accepts a StatusBadge slot via statusPill prop
 *
 * Based on Claude Design shell.jsx Footer + FooterCol components.
 */
export function Footer({
  linkGroups = defaultLinkGroups,
  statusPill = defaultStatusPill,
  copyrightText = '© {year} ɳSelf · MIT licensed',
  logoHref = 'https://nself.org',
  brandLabel = 'ɳSelf home',
  social = defaultSocial,
  className,
}: FooterProps) {
  const year = new Date().getFullYear()
  const copyright = copyrightText.replace('{year}', String(year))

  return (
    <footer
      className={cn(
        'border-t border-slate-200 dark:border-white/5',
        'bg-slate-50 dark:bg-[#0B0B14] mt-20',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-14">
        {/* Brand row */}
        <div
          className={cn(
            'flex flex-wrap items-start justify-between gap-6',
            'pb-10 border-b border-slate-200 dark:border-white/5'
          )}
        >
          <div className="max-w-md">
            <a
              href={logoHref}
              className="inline-block text-slate-900 dark:text-white"
              aria-label={brandLabel}
            >
              <Logo className="h-8 w-auto" />
            </a>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Own your stack. Ship anything. Self-hosted backend infrastructure,
              MIT licensed, free forever.
            </p>
          </div>
          {social && <FooterSocial {...social} />}
        </div>

        {/* 4-column sitemap */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {linkGroups.map((group) => (
            <FooterCol key={group.title} group={group} />
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className={cn(
            'mt-12 pt-6 border-t border-slate-200 dark:border-white/5',
            'flex flex-wrap items-center justify-between gap-3',
            'text-xs text-slate-500 dark:text-slate-500'
          )}
        >
          <span>{copyright}</span>
          {statusPill && <StatusPill {...statusPill} />}
        </div>
      </div>
    </footer>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FooterCol({ group }: { group: FooterLinkGroup }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
        {group.title}
      </h4>
      <ul className="space-y-2 text-sm">
        {group.links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

const statusDotColors: Record<FooterStatusPill['state'], string> = {
  ok: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-rose-500',
}

function StatusPill({ label, state, href }: FooterStatusPill) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full animate-pulse',
          statusDotColors[state]
        )}
      />
      {label}
    </a>
  )
}

function FooterSocial({ githubUrl, xUrl, chatUrl, rssUrl }: FooterSocialProps) {
  return (
    <div className="flex items-center gap-3">
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <GitHubIcon className="w-5 h-5" />
        </a>
      )}
      {xUrl && (
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="@nselforg on X"
          className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <XLogoIcon className="w-[18px] h-[18px]" />
        </a>
      )}
      {chatUrl && (
        <a
          href={chatUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="ɳChat"
          className="text-slate-500 hover:text-sky-500 transition-colors"
        >
          <ChatIcon className="w-5 h-5" />
        </a>
      )}
      {rssUrl && (
        <a
          href={rssUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="RSS feed"
          className="text-slate-500 hover:text-orange-500 transition-colors"
        >
          <RssIcon className="w-5 h-5" />
        </a>
      )}
    </div>
  )
}

// ─── Inline icons ──────────────────────────────────────────────────────────────

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 .198a8 8 0 0 0-8 8 7.999 7.999 0 0 0 5.47 7.59c.4.076.547-.172.547-.384 0-.19-.007-.694-.01-1.36-2.226.482-2.695-1.074-2.695-1.074-.364-.923-.89-1.17-.89-1.17-.725-.496.056-.486.056-.486.803.056 1.225.824 1.225.824.714 1.224 1.873.87 2.33.666.072-.518.278-.87.507-1.07-1.777-.2-3.644-.888-3.644-3.954 0-.873.31-1.586.823-2.146-.09-.202-.36-1.016.07-2.118 0 0 .67-.214 2.2.82a7.67 7.67 0 0 1 2-.27 7.67 7.67 0 0 1 2 .27c1.52-1.034 2.19-.82 2.19-.82.43 1.102.16 1.916.08 2.118.51.56.82 1.273.82 2.146 0 3.074-1.87 3.75-3.65 3.947.28.24.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.14.46.55.38A7.972 7.972 0 0 0 16 8.199a8 8 0 0 0-8-8Z" />
    </svg>
  )
}

function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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

function RssIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.18 20a2.18 2.18 0 1 1-4.36 0 2.18 2.18 0 0 1 4.36 0zM4 4v4c8.837 0 16 7.163 16 16h4C24 12.954 15.046 4 4 4zm0 8v4a8 8 0 0 1 8 8h4c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}
