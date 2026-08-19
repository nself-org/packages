/**
 * tailwind-plugin.ts — nSelf brand token plugin for Tailwind CSS v4
 *
 * Provides canonical brand utility classes consumed by all web/ subapps.
 * Import this in each subapp's CSS:
 *   @import '@nself-web/ui/tailwind-plugin'
 *
 * Or reference the token map directly for CSS variable usage.
 *
 * Brand canon: ~/Sites/nself/.claude/docs/brand/brand-guide.md
 * SPORT F15: ~/Sites/nself/.claude/docs/sport/F15-BRAND-SPEC.md
 *
 * nSelf brand:    primary sky-500 #0ea5e9, bg gray-950 #030712
 * ClawDE brand:   primary sky-500 #0ea5e9, bg gray-950 #030712 (same palette)
 *
 * NOTE: The authoritative token source is @nself/tailwind-brand/css-vars.css.
 * This file must stay in sync. Any change here must also update that package.
 */

/**
 * Brand token map — canonical values for all nSelf products.
 * Used both as CSS custom properties and as Tailwind theme extensions.
 * All products use the unified sky-500 / gray-950 brand (S3.T12 — 2026-05-13).
 */
export const brandTokens = {
  /** nSelf core brand — sky-500 on gray-950 */
  nself: {
    primary:      '#0ea5e9',
    primaryHover: '#0284c7',
    primaryMuted: '#38bdf8',
    bg:           '#030712',
    bgMuted:      '#0f172a',
    surface:      '#111827',
    ink:          '#ffffff',
  },
  /** ClawDE — sky on near-black (same as nSelf) */
  clawde: {
    primary:      '#0ea5e9',
    primaryHover: '#0284c7',
    primaryMuted: '#38bdf8',
    bg:           '#030712',
    bgMuted:      '#0f172a',
    surface:      '#030712',
    ink:          '#F8FAFC',
  },
  /** nTV — sky palette */
  ntv: {
    primary:      '#0ea5e9',
    primaryHover: '#0284c7',
    primaryMuted: '#38bdf8',
    bg:           '#030712',
    bgMuted:      '#0f172a',
    surface:      '#030712',
    ink:          '#F8FAFC',
  },
  /** nFamily — sky-500 on gray-950 (unified brand; was indigo pre-S3.T12) */
  nfamily: {
    primary:      '#0ea5e9',
    primaryHover: '#0284c7',
    primaryMuted: '#38bdf8',
    bg:           '#030712',
    bgMuted:      '#0f172a',
    surface:      '#111827',
    ink:          '#F8FAFC',
  },
} as const

export type BrandProduct = keyof typeof brandTokens

/**
 * CSS custom property block for a given product brand.
 * Inject into :root or a .brand-<product> scope in your CSS.
 *
 * Example (Tailwind CSS v4 @theme block):
 *   @theme {
 *     --color-brand-primary:       #0ea5e9;
 *     --color-brand-primary-hover: #0284c7;
 *     --color-brand-primary-muted: #38bdf8;
 *     --color-brand-bg:            #030712;
 *     --color-brand-bg-muted:      #0f172a;
 *     --color-brand-surface:       #111827;
 *     --color-brand-ink:           #ffffff;
 *   }
 */
export function getBrandCssVars(product: BrandProduct = 'nself'): Record<string, string> {
  const t = brandTokens[product]
  return {
    '--color-brand-primary':       t.primary,
    '--color-brand-primary-hover': t.primaryHover,
    '--color-brand-primary-muted': t.primaryMuted,
    '--color-brand-bg':            t.bg,
    '--color-brand-bg-muted':      t.bgMuted,
    '--color-brand-surface':       t.surface,
    '--color-brand-ink':           t.ink,
  }
}

/**
 * Utility class map — Tailwind-style class names wired to brand CSS vars.
 *
 * Subapps use these class names instead of raw hex values:
 *   bg-brand-bg        → background-color: var(--color-brand-bg)
 *   text-brand-primary → color: var(--color-brand-primary)
 *   accent-brand       → accent-color: var(--color-brand-primary)
 *   border-brand       → border-color: var(--color-brand-primary)
 *   ring-brand         → --tw-ring-color: var(--color-brand-primary)
 */
export const brandUtilityMap = {
  'bg-brand-bg':           'background-color: var(--color-brand-bg)',
  'bg-brand-bg-muted':     'background-color: var(--color-brand-bg-muted)',
  'bg-brand-surface':      'background-color: var(--color-brand-surface)',
  'bg-brand-primary':      'background-color: var(--color-brand-primary)',
  'text-brand-primary':    'color: var(--color-brand-primary)',
  'text-brand-muted':      'color: var(--color-brand-primary-muted)',
  'text-brand-ink':        'color: var(--color-brand-ink)',
  'border-brand':          'border-color: var(--color-brand-primary)',
  'ring-brand':            '--tw-ring-color: var(--color-brand-primary)',
  'accent-brand':          'accent-color: var(--color-brand-primary)',
  'fill-brand':            'fill: var(--color-brand-primary)',
  'stroke-brand':          'stroke: var(--color-brand-primary)',
} as const

export type BrandUtilityClass = keyof typeof brandUtilityMap

/**
 * Allowlisted hex values that may appear in non-CSS source.
 *
 * The CI grep gate `brand-hex-gate.yml` fails PRs that contain raw hex color
 * literals outside this list. OG image routes and structured SVG content that
 * must use inline style attributes are allowed to reference only these values.
 *
 * Any other hex in application source (TSX, CSS, MDX) outside this set
 * is a brand-drift violation and will fail CI.
 */
export const HEX_ALLOWLIST = [
  // nSelf canonical brand — sky-500 on gray-950 (S3.T12 — 2026-05-13)
  '#0ea5e9',              // sky-500 — brand primary
  '#0284c7',              // sky-600 — brand primary hover
  '#38bdf8', '#38BDF8',   // sky-400 — brand muted / links
  '#2563eb',              // blue-600 — gradient end
  '#3b82f6',              // blue-500 — gradient hover end
  '#030712',              // gray-950 — brand background
  '#0f172a',              // slate-900 — header / bg muted
  '#111827',              // gray-900 — card surfaces
  '#1f2937',              // gray-800 — elevated surfaces / dividers
  '#374151',              // gray-700 — card borders
  '#9ca3af',              // gray-400 — muted text
  '#d1d5db',              // gray-300 — body text
  '#AAE4FF',              // logo gradient start
  '#F8FAFC', '#f8fafc',   // ink white (legacy)
  '#ffffff', '#FFFFFF',   // ink white
  // OG image page backgrounds (near-black with blue cast)
  '#0B0B14',
  // Standard palette (Google logo, OAuth buttons, etc.)
  '#4285F4', '#34A853', '#FBBC05', '#EA4335',
  // Surface neutrals referenced in opengraph routes
  '#94a3b8',  // slate-400
  '#cbd5e1',  // slate-300
] as const

export type AllowlistedHex = typeof HEX_ALLOWLIST[number]
