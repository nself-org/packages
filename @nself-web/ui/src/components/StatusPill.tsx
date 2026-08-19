/**
 * StatusPill — async RSC (no 'use client')
 *
 * E3-T02: Footer status pill that fetches live system status from
 * status.nself.org/api/status and renders a dot + short label that links to
 * the public status page. Mounted in Footer of every nself.org subapp.
 *
 * Why an async RSC?
 *   - Each subapp benefits from its own per-deployment ISR cache (60s by
 *     default). No client JS shipped — the dot color reflects server-side
 *     fetched state at request time.
 *   - The fetch is best-effort: any error degrades silently to the
 *     `unknown` state with a generic label. The component never throws.
 *
 * 7 UI states:
 *   1. operational   — green dot, "All systems operational"
 *   2. degraded      — amber dot, "Degraded performance"
 *   3. down          — rose dot, "Major outage"
 *   4. unknown       — slate dot, "Status unknown" (fetch failure)
 *   5. fetch-error   — same as unknown — silent fallback
 *   6. dark-mode     — dot uses tailwind dark variant
 *   7. light-mode    — dot uses tailwind light variant
 *
 * a11y:
 *   - role="status" + aria-live="polite" so screen readers announce changes
 *     when the pill re-renders on revalidate
 *   - aria-label="System status: <label>"
 *
 * Spec: P97 Wave 35 — E3-T02
 */
import * as React from 'react'
import { cn } from '../lib/cn'

export type StatusPillState = 'operational' | 'degraded' | 'down' | 'unknown'

/**
 * Shape of the JSON payload at status.nself.org/api/status. Defensive: every
 * field is optional so a partial / unexpected payload still degrades to
 * `unknown`.
 */
interface StatusPayload {
  overall?: string
}

export interface StatusPillProps {
  /**
   * Override the status endpoint. Defaults to status.nself.org/api/status.
   */
  endpoint?: string
  /**
   * Override the status page link target. Defaults to https://status.nself.org.
   */
  href?: string
  /**
   * Revalidate interval in seconds for the underlying fetch. Defaults to 60.
   */
  revalidateSeconds?: number
  /**
   * Additional className passed through to the wrapping anchor.
   */
  className?: string
}

const STATUS_DOT_CLASS: Record<StatusPillState, string> = {
  operational: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-rose-500',
  unknown: 'bg-slate-400 dark:bg-slate-500',
}

const STATUS_LABEL: Record<StatusPillState, string> = {
  operational: 'All systems operational',
  degraded: 'Degraded performance',
  down: 'Major outage',
  unknown: 'Status unknown',
}

/**
 * Normalise the upstream `overall` string into the four pill states. The
 * status subapp emits operational/degraded/outage/unknown; the org status
 * feed emits operational/degraded/down/unknown. We accept both.
 */
function normaliseOverall(raw: unknown): StatusPillState {
  if (typeof raw !== 'string') return 'unknown'
  const v = raw.trim().toLowerCase()
  if (v === 'operational' || v === 'ok' || v === 'up') return 'operational'
  if (v === 'degraded' || v === 'warn' || v === 'warning') return 'degraded'
  if (v === 'down' || v === 'outage' || v === 'offline') return 'down'
  return 'unknown'
}

/**
 * Server-side fetch with a hard timeout. Returns 'unknown' on any failure
 * (network error, non-2xx, JSON parse failure, abort).
 */
async function fetchStatus(
  endpoint: string,
  revalidateSeconds: number,
): Promise<StatusPillState> {
  try {
    // The `next` field is a Next.js extension to RequestInit; this package
    // doesn't pull in Next types so we use a structural cast. Consumers run
    // inside Next apps where the field is honored.
    const init = {
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(5000),
    } as RequestInit
    const res = await fetch(endpoint, init)
    if (!res.ok) return 'unknown'
    const payload = (await res.json()) as StatusPayload
    return normaliseOverall(payload.overall)
  } catch {
    return 'unknown'
  }
}

/**
 * Async RSC. Suspense-friendly. Mount in Footer.
 */
export async function StatusPill({
  endpoint = 'https://status.nself.org/api/status',
  href = 'https://status.nself.org',
  revalidateSeconds = 60,
  className,
}: StatusPillProps = {}) {
  const state = await fetchStatus(endpoint, revalidateSeconds)
  const label = STATUS_LABEL[state]

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      role="status"
      aria-live="polite"
      aria-label={`System status: ${label}`}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs',
        'text-slate-600 dark:text-slate-400',
        'hover:text-slate-900 dark:hover:text-white transition-colors',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          state === 'operational' && 'animate-pulse',
          STATUS_DOT_CLASS[state],
        )}
      />
      <span>{label}</span>
    </a>
  )
}

/**
 * Loading skeleton rendered by a Suspense boundary while the RSC resolves.
 * Matches the StatusPill height to prevent layout shift on stream-in.
 */
export function StatusPillSkeleton() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-4 w-32 animate-pulse rounded-full bg-slate-200/60 dark:bg-slate-700/40"
    />
  )
}
