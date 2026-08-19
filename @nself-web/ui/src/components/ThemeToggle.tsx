'use client'

import * as React from 'react'
import { useTheme as useNextTheme } from 'next-themes'
import { cn } from '../lib/cn'

export interface ThemeToggleProps {
  /** Additional className for the button */
  className?: string
}

type ThemeMode = 'system' | 'dark' | 'light'

const CYCLE: ThemeMode[] = ['system', 'dark', 'light']

const ARIA_LABELS: Record<ThemeMode, string> = {
  system: 'Theme: system (click for dark)',
  dark:   'Theme: dark (click for light)',
  light:  'Theme: light (click for system)',
}

/**
 * ThemeToggle — 3-way cycle: system → dark → light → system.
 *
 * Purpose:  Toggle between system/dark/light themes via next-themes.
 *           Persists to localStorage under the `nself_theme` key (set on ThemeProvider).
 * Inputs:   className prop for additional button styling.
 * Outputs:  Button that cycles theme mode; icon reflects current mode.
 * Constraints:
 *   - Requires <ThemeProvider storageKey="nself_theme"> ancestor
 *   - Icons: monitor (system) · moon (dark) · sun (light)
 *   - aria-label describes the current mode and next action
 * SPORT:    T-P4-theme-toggle
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useNextTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch — render neutral until client mounts
  React.useEffect(() => { setMounted(true) }, [])

  const current: ThemeMode = (theme as ThemeMode | undefined) ?? 'system'

  function handleClick() {
    const idx = CYCLE.indexOf(current)
    const next = CYCLE[(idx + 1) % CYCLE.length]!
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md',
        'text-slate-600 dark:text-slate-300',
        'hover:bg-slate-100 dark:hover:bg-white/5',
        'transition-colors',
        className
      )}
      aria-label={mounted ? ARIA_LABELS[current] : 'Toggle theme'}
    >
      {!mounted ? <SystemIcon /> : current === 'dark' ? <MoonIcon /> : current === 'light' ? <SunIcon /> : <SystemIcon />}
    </button>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path strokeLinecap="round" d="M8 21h8M12 17v4" />
    </svg>
  )
}

/**
 * useTheme — re-export from next-themes for backward compatibility.
 * Consumers that previously used the local useTheme([dark, setDark]) shape
 * should migrate to next-themes' useTheme() API:
 *   const { theme, setTheme, resolvedTheme } = useTheme()
 */
export { useNextTheme as useTheme }
