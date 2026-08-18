/**
 * LiveVersion — RSC (no 'use client')
 *
 * E1-T02: Shared LiveVersion component for the @nself-web/ui package. Renders
 * the latest ɳSelf CLI release as a <Pill tone="sky" variant="outlined"> linked
 * to the changelog. Each subapp wires this into its Header (or hero) by passing
 * a fetcher that hits its own `/api/cli-version` route.
 *
 * Why a fetcher prop instead of a hardcoded URL?
 *   - Each subapp has its own Next.js route handler at `/api/cli-version` so
 *     edge cache + ISR are per-deployment (no cross-subapp coupling).
 *   - The fetcher is server-side only; the component remains an RSC and ships
 *     no client JS. Tests inject a mock fetcher to bypass network entirely.
 *
 * Fetch strategy:
 *   - Calls the provided `fetchVersion` server function (default: returns
 *     fallback) — each subapp passes its own implementation that hits
 *     `/api/cli-version` with `next: { revalidate: 600 }`.
 *   - Any error in the fetcher → fallback. Component never throws to client.
 *
 * 7 UI states:
 *   1. loading-skeleton       — Suspense boundary shows skeleton
 *   2. live-version-fetched   — fetcher returned a valid tag
 *   3. fallback-version       — fetcher errored / returned undefined
 *   4. v-prefix-present       — version already starts with 'v'
 *   5. v-prefix-normalised    — version normalised to start with 'v'
 *   6. dark-mode              — Pill uses sky tone dark variant via Tailwind dark:
 *   7. light-mode             — Pill uses sky tone light variant
 *
 * Spec: .claude/phases/current/sprint-E1.md § E1-T02 + AC-extension UX-U15
 */

import * as React from 'react'
import { Pill } from './Pill'

/**
 * Default fallback CLI version. Per E1-T04, kept in sync with
 * .claude/docs/MASTER-VERSIONS.md current-target row. Subapps may override
 * via the `fallbackVersion` prop or via their own lib/version.ts constants.
 */
export const FALLBACK_CLI_VERSION = 'v1.1.2'

/**
 * Strict semver-only matcher: vX.Y.Z optionally followed by -prerelease/+build.
 * Anything else (placeholder strings, draft test releases, mistyped tags) is
 * rejected so we never render garbage like `vunknownsub_xyz` in the header.
 */
const SEMVER_TAG = /^v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?$/

/**
 * Normalise a tag to v-prefixed semver, or return null if it can't be made
 * to match. Exported for tests.
 */
export function normaliseVersionTag(tag: unknown): string | null {
  if (typeof tag !== 'string' || !tag) return null
  const normalized = tag.startsWith('v') ? tag : `v${tag}`
  if (!SEMVER_TAG.test(normalized)) return null
  return normalized
}

/**
 * The fetcher signature. Subapps pass an async function that hits their own
 * `/api/cli-version` route handler and returns the version string (or null on
 * any error). In tests, pass a mock fetcher.
 */
export type LiveVersionFetcher = () => Promise<string | null>

export interface LiveVersionProps {
  /**
   * Server-side fetcher that returns the live CLI version, or null on any
   * error. The component never throws — null falls back silently.
   */
  fetchVersion?: LiveVersionFetcher
  /**
   * Override the fallback version string. Defaults to FALLBACK_CLI_VERSION.
   */
  fallbackVersion?: string
  /**
   * Where the pill links to. Defaults to `/changelog` (each subapp's local
   * changelog page). Pass an absolute URL like
   * `https://github.com/nself-org/cli/releases` for external links.
   */
  href?: string
  /**
   * Additional className passed through to the wrapping anchor.
   */
  className?: string
}

/**
 * RSC — no 'use client'. Must remain a server component to benefit from
 * the per-subapp ISR caching applied at the route handler. Wrap in <Suspense>
 * at the call site so the parent shell renders before the fetch resolves.
 */
export async function LiveVersion({
  fetchVersion,
  fallbackVersion = FALLBACK_CLI_VERSION,
  href = '/changelog',
  className,
}: LiveVersionProps = {}) {
  let version = fallbackVersion
  if (fetchVersion) {
    try {
      const fetched = await fetchVersion()
      const normalized = normaliseVersionTag(fetched)
      if (normalized) {
        version = normalized
      }
    } catch {
      // Swallow — fall through to fallback. Never throw to the client.
    }
  }

  const wrapperClass = `hidden md:inline-flex items-center${className ? ` ${className}` : ''}`

  return (
    <a
      href={href}
      className={wrapperClass}
      aria-label={`ɳSelf CLI ${version} — view changelog`}
      title={`ɳSelf CLI ${version} — view changelog`}
    >
      <Pill tone="sky" variant="outlined">
        {version}
      </Pill>
    </a>
  )
}

/**
 * Loading skeleton rendered by the Suspense boundary while the RSC resolves.
 * Matches the Pill outlined size to prevent layout shift on stream-in.
 */
export function LiveVersionSkeleton() {
  return (
    <span
      aria-hidden="true"
      className="hidden md:inline-flex h-6 w-16 animate-pulse rounded-full border border-sky-200/60 bg-sky-50/40 dark:border-sky-400/20 dark:bg-sky-500/5"
    />
  )
}
