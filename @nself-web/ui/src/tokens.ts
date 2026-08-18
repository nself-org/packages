/**
 * nSelf shared design tokens
 * Brand: sky-500 (#0ea5e9) on gray-950 (#030712)
 * Change brand.primary here to update all 9 landing pages.
 */

export const tokens = {
  brand: {
    primary: '#0ea5e9',       // sky-500
    primaryHover: '#38bdf8',  // sky-400
    primaryDark: '#0284c7',   // sky-600
    background: '#030712',    // gray-950
    surface: '#111827',       // gray-900
    border: '#1f2937',        // gray-800
  },
  text: {
    primary: '#ffffff',       // white
    secondary: '#9ca3af',     // gray-400
    muted: '#6b7280',         // gray-500
    link: '#38bdf8',          // sky-400
  },
  status: {
    success: '#22c55e',       // green-500
    error: '#ef4444',         // red-500
    warning: '#f59e0b',       // amber-500
    info: '#0ea5e9',          // sky-500
  },
  spacing: {
    sectionY: 'py-24',
    containerMax: 'max-w-7xl',
    containerPad: 'px-4 sm:px-6 lg:px-8',
  },
  radius: {
    card: 'rounded-xl',
    button: 'rounded-lg',
    badge: 'rounded-full',
  },
  fonts: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, Fira Code, monospace',
  },
} as const

/** Flat color map for cross-subapp usage (nsentry, nfamily, clawde, ntv, etc.) */
export const colors = {
  primary:       tokens.brand.primary,
  accent:        tokens.brand.primaryHover,
  background:    tokens.brand.background,
  surface:       tokens.brand.surface,
  border:        tokens.brand.border,
  textPrimary:   tokens.text.primary,
  textSecondary: tokens.text.secondary,
  textMuted:     tokens.text.muted,
  success:       tokens.status.success,
  error:         tokens.status.error,
  warning:       tokens.status.warning,
  info:          tokens.status.info,
} as const

export const spacing = {
  '0':  '0px',
  '1':  '4px',
  '2':  '8px',
  '3':  '12px',
  '4':  '16px',
  '5':  '20px',
  '6':  '24px',
  '8':  '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
} as const

export const fonts = tokens.fonts

export type Tokens = typeof tokens
export type Colors = typeof colors
export type Spacing = typeof spacing
