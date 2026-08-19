/**
 * @nself/tailwind-brand
 *
 * Tailwind CSS plugin that registers canonical nSelf brand color utility
 * classes. Wire it into any Tailwind v3/v4 config:
 *
 *   // tailwind.config.ts (v3)
 *   import nSelfBrand from '@nself/tailwind-brand'
 *   export default { plugins: [nSelfBrand] }
 *
 * Brand canon: sky-500 (#0ea5e9) gradient on gray-950 (#030712) background.
 * Source of truth: ~/Sites/nself/.claude/docs/brand/color-theme-standard.md
 * SPORT F15:      ~/Sites/nself/.claude/docs/sport/F15-BRAND-SPEC.md
 *
 * Tokens registered
 * -----------------
 * Background:
 *   bg-brand-bg          gray-950 (#030712) — page background
 *   bg-brand-header      slate-900 (#0f172a) — header / nav
 *   bg-brand-surface     gray-900 (#111827) — card surfaces
 *   bg-brand-surface-2   gray-800 (#1f2937) — elevated surfaces
 *   bg-brand-primary     sky-500 (#0ea5e9) — solid brand fill
 *   bg-page-dark         #0B0B14 — redesign page bg (near-black, blue-cast)
 *
 * Text:
 *   text-brand-primary   sky-500 (#0ea5e9) — accent text
 *   text-brand-ink       white (#ffffff) — primary heading text
 *   text-brand-secondary gray-300 (#d1d5db) — body text
 *   text-brand-muted     gray-400 (#9ca3af) — secondary / descriptions
 *   text-brand-link      sky-400 (#38bdf8) — links in dark mode
 *
 * Border:
 *   border-brand         sky-500 (#0ea5e9) — focused / interactive border
 *   border-brand-card    gray-700 (#374151) — card borders
 *   border-brand-subtle  gray-800 (#1f2937) — dividers
 *
 * Accent / utility:
 *   accent-brand         sky-500 — native form accent color
 *   ring-brand           sky-500 — focus ring color
 *
 * Gradient:
 *   from-brand-gradient  sky-500 (#0ea5e9) — gradient start (use with to-blue-600)
 *   to-brand-gradient    blue-600 (#2563eb) — gradient end
 *
 * Status tones (A2 redesign tokens):
 *   text-status-ok-light / text-status-ok-dark
 *   text-status-warn-light / text-status-warn-dark
 *   text-status-error-light / text-status-error-dark
 *
 * Pill tones (7 variants):
 *   bg-pill-sky, bg-pill-indigo, bg-pill-green, bg-pill-purple,
 *   bg-pill-amber, bg-pill-rose, bg-pill-slate
 */

/**
 * A2 redesign tokens — page background, status tones, pill tones,
 * spacing rhythm, and border radius.
 *
 * These tokens extend the existing brand palette for the P97 redesign.
 * Values are defined per Claude Design README § "Color system".
 */

// 1. Page background dark (NOT slate-950 — custom near-black with blue cast)
export const PAGE_BG_DARK = '#0B0B14' as const

// 2. Status tones — raw Tailwind color scale references (not hardcoded hex)
export const statusTones = {
  'ok-light':    'rgb(52 211 153)',   // emerald-400
  'ok-dark':     'rgb(5 150 105)',    // emerald-600
  'warn-light':  'rgb(251 191 36)',   // amber-400
  'warn-dark':   'rgb(217 119 6)',    // amber-600
  'error-light': 'rgb(251 113 133)', // rose-400
  'error-dark':  'rgb(225 29 72)',    // rose-600
} as const

export type StatusToneKey = keyof typeof statusTones

// 3. Pill tones — 7 variants mapped to Tailwind color scale values
export const pillTones = {
  'pill-sky':    { bg: 'rgb(186 230 253)', text: 'rgb(7 89 133)' },    // sky-200 / sky-800
  'pill-indigo': { bg: 'rgb(199 210 254)', text: 'rgb(55 48 163)' },   // indigo-200 / indigo-800
  'pill-green':  { bg: 'rgb(187 247 208)', text: 'rgb(22 101 52)' },   // green-200 / green-800
  'pill-purple': { bg: 'rgb(233 213 255)', text: 'rgb(88 28 135)' },   // purple-200 / purple-800
  'pill-amber':  { bg: 'rgb(254 243 199)', text: 'rgb(146 64 14)' },   // amber-100 / amber-800
  'pill-rose':   { bg: 'rgb(254 205 211)', text: 'rgb(159 18 57)' },   // rose-200 / rose-800
  'pill-slate':  { bg: 'rgb(226 232 240)', text: 'rgb(30 41 59)' },    // slate-200 / slate-800
} as const

export type PillToneKey = keyof typeof pillTones

// 4. Spacing rhythm tokens
export const spacingTokens = {
  'section-y': { sm: '4rem', lg: '6rem' },  // 64px / 96px
  'footer-mt': '5rem',                       // 80px = mt-20
} as const

// 5. Border radius tokens
export const radiusTokens = {
  'radius-pill':   'calc(infinity * 1px)',  // fully rounded
  'radius-card':   '0.75rem',              // rounded-xl
  'radius-button': '0.5rem',              // rounded-lg
} as const

/**
 * Canonical nSelf brand palette.
 * Reference: color-theme-standard.md
 */
export const nSelfPalette = {
  // Backgrounds
  bgBody:     '#030712',  // gray-950
  bgHeader:   '#0f172a',  // slate-900
  bgSurface:  '#111827',  // gray-900
  bgSurface2: '#1f2937',  // gray-800

  // Accent gradient (buttons, CTAs)
  accentFrom:      '#0ea5e9',  // sky-500
  accentTo:        '#2563eb',  // blue-600
  accentHoverFrom: '#38bdf8',  // sky-400
  accentHoverTo:   '#3b82f6',  // blue-500

  // ɳ logo gradient
  logoFrom: '#AAE4FF',  // light cyan
  logoTo:   '#38BDF8',  // sky-400

  // Text
  textPrimary:   '#ffffff',  // white
  textSecondary: '#d1d5db',  // gray-300
  textMuted:     '#9ca3af',  // gray-400
  textLink:      '#38bdf8',  // sky-400 (dark mode links)

  // Borders
  borderCard:   '#374151',  // gray-700
  borderSubtle: '#1f2937',  // gray-800

  // Shadow
  shadowAccent: 'rgba(14, 165, 233, 0.25)',  // sky-500/25
} as const

export type NselfPaletteKey = keyof typeof nSelfPalette

/**
 * CSS custom properties block for nSelf brand tokens.
 * Inject into :root in your global CSS.
 *
 * All --color-brand-* vars map 1-to-1 to the utility classes below.
 * A2 tokens added: --nself-page-bg-dark, --nself-status-*, --nself-pill-*,
 * --nself-section-y-*, --nself-footer-mt, --nself-radius-*
 */
export const brandCssVars: Record<string, string> = {
  // --- core brand palette ---
  '--color-brand-bg':           nSelfPalette.bgBody,
  '--color-brand-header':       nSelfPalette.bgHeader,
  '--color-brand-surface':      nSelfPalette.bgSurface,
  '--color-brand-surface-2':    nSelfPalette.bgSurface2,
  '--color-brand-primary':      nSelfPalette.accentFrom,
  '--color-brand-primary-to':   nSelfPalette.accentTo,
  '--color-brand-hover':        nSelfPalette.accentHoverFrom,
  '--color-brand-hover-to':     nSelfPalette.accentHoverTo,
  '--color-brand-logo-from':    nSelfPalette.logoFrom,
  '--color-brand-logo-to':      nSelfPalette.logoTo,
  '--color-brand-ink':          nSelfPalette.textPrimary,
  '--color-brand-secondary':    nSelfPalette.textSecondary,
  '--color-brand-muted':        nSelfPalette.textMuted,
  '--color-brand-link':         nSelfPalette.textLink,
  '--color-brand-border':       nSelfPalette.borderCard,
  '--color-brand-border-subtle':nSelfPalette.borderSubtle,

  // --- A2 redesign: page background ---
  '--nself-page-bg-dark': PAGE_BG_DARK,

  // --- A2 redesign: status tones ---
  '--nself-status-ok-light':    statusTones['ok-light'],
  '--nself-status-ok-dark':     statusTones['ok-dark'],
  '--nself-status-warn-light':  statusTones['warn-light'],
  '--nself-status-warn-dark':   statusTones['warn-dark'],
  '--nself-status-error-light': statusTones['error-light'],
  '--nself-status-error-dark':  statusTones['error-dark'],

  // --- A2 redesign: pill tones (background only for CSS vars; text via utilities) ---
  '--nself-pill-sky-bg':    pillTones['pill-sky'].bg,
  '--nself-pill-sky-text':  pillTones['pill-sky'].text,
  '--nself-pill-indigo-bg': pillTones['pill-indigo'].bg,
  '--nself-pill-indigo-text': pillTones['pill-indigo'].text,
  '--nself-pill-green-bg':  pillTones['pill-green'].bg,
  '--nself-pill-green-text': pillTones['pill-green'].text,
  '--nself-pill-purple-bg': pillTones['pill-purple'].bg,
  '--nself-pill-purple-text': pillTones['pill-purple'].text,
  '--nself-pill-amber-bg':  pillTones['pill-amber'].bg,
  '--nself-pill-amber-text': pillTones['pill-amber'].text,
  '--nself-pill-rose-bg':   pillTones['pill-rose'].bg,
  '--nself-pill-rose-text': pillTones['pill-rose'].text,
  '--nself-pill-slate-bg':  pillTones['pill-slate'].bg,
  '--nself-pill-slate-text': pillTones['pill-slate'].text,

  // --- A2 redesign: spacing rhythm ---
  '--nself-section-y-sm': spacingTokens['section-y'].sm,
  '--nself-section-y-lg': spacingTokens['section-y'].lg,
  '--nself-footer-mt':    spacingTokens['footer-mt'],

  // --- A2 redesign: border radius ---
  '--nself-radius-pill':   radiusTokens['radius-pill'],
  '--nself-radius-card':   radiusTokens['radius-card'],
  '--nself-radius-button': radiusTokens['radius-button'],
}

/**
 * Utility class map — Tailwind class names mapped to CSS declarations.
 * These are registered as custom utilities by the Tailwind plugin below.
 */
export const brandUtilities: Record<string, Record<string, string>> = {
  // --- background ---
  '.bg-brand-bg':        { 'background-color': 'var(--color-brand-bg)' },
  '.bg-brand-header':    { 'background-color': 'var(--color-brand-header)' },
  '.bg-brand-surface':   { 'background-color': 'var(--color-brand-surface)' },
  '.bg-brand-surface-2': { 'background-color': 'var(--color-brand-surface-2)' },
  '.bg-brand-primary':   { 'background-color': 'var(--color-brand-primary)' },

  // A2: page background dark (#0B0B14)
  '.bg-page-dark': { 'background-color': 'var(--nself-page-bg-dark)' },

  // --- text ---
  '.text-brand-primary':   { color: 'var(--color-brand-primary)' },
  '.text-brand-ink':       { color: 'var(--color-brand-ink)' },
  '.text-brand-secondary': { color: 'var(--color-brand-secondary)' },
  '.text-brand-muted':     { color: 'var(--color-brand-muted)' },
  '.text-brand-link':      { color: 'var(--color-brand-link)' },

  // --- border ---
  '.border-brand':        { 'border-color': 'var(--color-brand-primary)' },
  '.border-brand-card':   { 'border-color': 'var(--color-brand-border)' },
  '.border-brand-subtle': { 'border-color': 'var(--color-brand-border-subtle)' },

  // --- accent / ring ---
  '.accent-brand': { 'accent-color': 'var(--color-brand-primary)' },
  '.ring-brand':   { '--tw-ring-color': 'var(--color-brand-primary)' },

  // --- gradient helpers ---
  '.from-brand-gradient': { '--tw-gradient-from': 'var(--color-brand-primary)' },
  '.to-brand-gradient':   { '--tw-gradient-to':   'var(--color-brand-primary-to)' },

  // --- A2 redesign: status tones ---
  '.text-status-ok-light':    { color: 'var(--nself-status-ok-light)' },
  '.text-status-ok-dark':     { color: 'var(--nself-status-ok-dark)' },
  '.text-status-warn-light':  { color: 'var(--nself-status-warn-light)' },
  '.text-status-warn-dark':   { color: 'var(--nself-status-warn-dark)' },
  '.text-status-error-light': { color: 'var(--nself-status-error-light)' },
  '.text-status-error-dark':  { color: 'var(--nself-status-error-dark)' },

  // --- A2 redesign: pill tones (7 variants, each sets bg + text) ---
  '.bg-pill-sky':    { 'background-color': 'var(--nself-pill-sky-bg)',    color: 'var(--nself-pill-sky-text)' },
  '.bg-pill-indigo': { 'background-color': 'var(--nself-pill-indigo-bg)', color: 'var(--nself-pill-indigo-text)' },
  '.bg-pill-green':  { 'background-color': 'var(--nself-pill-green-bg)',  color: 'var(--nself-pill-green-text)' },
  '.bg-pill-purple': { 'background-color': 'var(--nself-pill-purple-bg)', color: 'var(--nself-pill-purple-text)' },
  '.bg-pill-amber':  { 'background-color': 'var(--nself-pill-amber-bg)',  color: 'var(--nself-pill-amber-text)' },
  '.bg-pill-rose':   { 'background-color': 'var(--nself-pill-rose-bg)',   color: 'var(--nself-pill-rose-text)' },
  '.bg-pill-slate':  { 'background-color': 'var(--nself-pill-slate-bg)',  color: 'var(--nself-pill-slate-text)' },

  // --- A2 redesign: border radius ---
  '.rounded-pill':   { 'border-radius': 'var(--nself-radius-pill)' },
  '.rounded-card':   { 'border-radius': 'var(--nself-radius-card)' },
  '.rounded-button': { 'border-radius': 'var(--nself-radius-button)' },
}

/**
 * Tailwind v3 plugin factory.
 *
 * Usage in tailwind.config.ts:
 *   import nSelfBrand from '@nself/tailwind-brand'
 *   export default { plugins: [nSelfBrand] }
 */

// Minimal type shim — avoids requiring tailwindcss as a hard dep at build time.
type AddUtilitiesHelper = (
  utilities: Record<string, Record<string, string>>,
  options?: { respectPrefix?: boolean; respectImportant?: boolean }
) => void
type AddBaseFn = (base: Record<string, Record<string, string>>) => void

interface PluginAPI {
  addUtilities: AddUtilitiesHelper
  addBase: AddBaseFn
}

type TailwindPluginFn = (api: PluginAPI) => void
type TailwindPlugin = TailwindPluginFn & { __isOptionsFunction?: boolean }

function nSelfBrandPlugin({ addBase, addUtilities }: PluginAPI): void {
  // Inject CSS custom properties into :root
  addBase({ ':root': brandCssVars as unknown as Record<string, string> })
  // Register brand utility classes
  addUtilities(brandUtilities, { respectPrefix: true, respectImportant: true })
}

export default nSelfBrandPlugin as TailwindPlugin

/**
 * Allowlisted hex literals for CI brand-hex-gate.
 *
 * The brand-hex-gate.yml workflow fails PRs that contain raw hex literals
 * outside this set. OG image routes and SVG files that need inline styles
 * may reference only these values.
 *
 * Any other hex in application source (.tsx, .css, .mdx) is a brand-drift
 * violation. Use the bg-brand-* / text-brand-* utilities instead.
 */
export const HEX_ALLOWLIST = [
  // nSelf primary gradient
  '#0ea5e9',              // sky-500 (accent-from)
  '#2563eb',              // blue-600 (accent-to)
  '#38bdf8', '#38BDF8',   // sky-400 (hover-from / link)
  '#3b82f6',              // blue-500 (hover-to)
  // Backgrounds
  '#030712',              // gray-950 (body)
  '#0B0B14', '#0b0b14',   // A2 redesign: page-bg-dark (near-black, blue cast)
  '#0f172a',              // slate-900 / gray-950 variant (header)
  '#111827',              // gray-900 (surface)
  '#1f2937',              // gray-800 (surface-2 / border-subtle)
  // Text / border
  '#ffffff', '#FFFFFF',   // white
  '#d1d5db',              // gray-300 (secondary text)
  '#9ca3af',              // gray-400 (muted text)
  '#374151',              // gray-700 (card border)
  // Logo gradient
  '#AAE4FF', '#aae4ff',   // logo-from light cyan
  // Google / third-party logos
  '#4285F4', '#34A853', '#FBBC05', '#EA4335',
  // Indigo (OG image routes only — do NOT use in new subapp code; S3.T12 brand fix)
  '#6366F1', '#6366f1',
  '#4F46E5', '#4f46e5',
  '#818CF8', '#818cf8',
  // Slate neutrals (stats, layout)
  '#94a3b8',              // slate-400
  '#a5b4fc',              // indigo-300
  '#cbd5e1',              // slate-300
] as const

export type AllowlistedHex = (typeof HEX_ALLOWLIST)[number]
