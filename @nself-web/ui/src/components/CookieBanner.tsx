'use client'

import * as React from 'react'

/**
 * Cookie consent banner — shared across all nSelf web apps.
 *
 * Stores decision in localStorage under `nself_cookie_consent`:
 *   'accepted' | 'rejected' | (absent = no decision yet → show banner)
 *
 * Emits a `cookie-consent-change` CustomEvent so analytics modules can react.
 * Ships no external dependencies. Uses a plain <a> tag so it works in any
 * React app regardless of routing library (Next.js, Remix, Vite SPA, etc.).
 *
 * GDPR / ePrivacy compliance:
 *   - No non-essential cookies fire before the user accepts.
 *   - "Reject" has equal visual weight to "Accept".
 *   - Banner does not block site usage.
 *   - Decision persists in localStorage so the banner does not reappear.
 */

const STORAGE_KEY = 'nself_cookie_consent'

type Consent = 'accepted' | 'rejected' | null

function readConsent(): Consent {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v === 'accepted' || v === 'rejected') return v
  } catch {
    // localStorage unavailable (private browsing, etc.) — treat as no decision.
  }
  return null
}

function writeConsent(value: Consent) {
  if (typeof window === 'undefined') return
  try {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    window.dispatchEvent(
      new CustomEvent('cookie-consent-change', { detail: value }),
    )
  } catch {
    // ignore
  }
}

export interface CookieBannerProps {
  /**
   * URL of the Cookie Policy page. Rendered as a plain anchor.
   * @default "/legal/cookies"
   */
  cookiePolicyUrl?: string
}

export function CookieBanner({ cookiePolicyUrl = '/legal/cookies' }: CookieBannerProps) {
  // Start hidden to avoid SSR/hydration flash for users who already decided.
  // The effect flips it on when there is no stored decision.
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (readConsent() === null) setOpen(true)
  }, [])

  if (!open) return null

  const decide = (v: 'accepted' | 'rejected') => {
    writeConsent(v)
    setOpen(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-[#1A1A2E]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-200">
          <p className="font-medium">We use a few cookies.</p>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Essential cookies keep the site working. Analytics cookies help us
            improve. You can say no.{' '}
            <a
              href={cookiePolicyUrl}
              className="underline decoration-dotted underline-offset-2 hover:text-sky-600 dark:hover:text-sky-400"
            >
              Cookie Policy
            </a>
            .
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide('rejected')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => decide('accepted')}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Returns true when the user has explicitly accepted cookies.
 * Treats 'rejected' and no-decision-yet as false.
 * Safe to call server-side (returns false when window is unavailable).
 */
export function hasCookieConsent(): boolean {
  return readConsent() === 'accepted'
}
