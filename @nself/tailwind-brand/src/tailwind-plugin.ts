/**
 * tailwind-plugin.ts — nSelf brand Tailwind v3 plugin
 *
 * The single integration point for all 13 nSelf web subapps that use
 * Tailwind v3. Subapps add only:
 *
 *   // tailwind.config.ts
 *   import nSelfBrandPlugin from '@nself/tailwind-brand/plugin'
 *   export default { plugins: [nSelfBrandPlugin] }
 *
 * For Tailwind v4 subapps, import the CSS file instead:
 *
 *   @import '@nself/tailwind-brand/css-vars.css';
 *
 * What this plugin registers
 * --------------------------
 *
 * 1. CSS custom properties injected into `:root` via `addBase`:
 *    --color-brand-bg, --color-brand-primary, --nself-page-bg-dark,
 *    --nself-status-*, --nself-pill-*, --nself-section-y-*, etc.
 *
 * 2. Tailwind `theme.extend` values for:
 *    - colors: brand palette + A2 redesign tokens
 *    - spacing: section-y-sm, section-y-lg, footer-mt
 *    - borderRadius: pill, card, button
 *
 * 3. Custom utility classes registered via `addUtilities`:
 *    bg-brand-*, text-brand-*, border-brand-*, bg-page-dark,
 *    text-status-*, bg-pill-*, rounded-pill/card/button
 *
 * Source of truth: ~/Sites/nself/.claude/docs/brand/color-theme-standard.md
 * SPORT F15:       ~/Sites/nself/.claude/docs/sport/F15-BRAND-SPEC.md
 */

import {
  nSelfPalette,
  brandCssVars,
  brandUtilities,
  PAGE_BG_DARK,
  statusTones,
  pillTones,
  spacingTokens,
  radiusTokens,
} from './index'

// ---------------------------------------------------------------------------
// Minimal type shims — avoids hard tailwindcss devDep
// ---------------------------------------------------------------------------

type CSSProperties = Record<string, string | Record<string, string>>

interface AddUtilitiesHelper {
  (
    utilities: Record<string, CSSProperties>,
    options?: { respectPrefix?: boolean; respectImportant?: boolean }
  ): void
}

interface AddBaseFn {
  (base: Record<string, CSSProperties>): void
}

interface ThemeConfig {
  colors?: Record<string, string>
  spacing?: Record<string, string>
  borderRadius?: Record<string, string>
}

interface PluginAPI {
  addUtilities: AddUtilitiesHelper
  addBase: AddBaseFn
  theme: (path: string) => unknown
}

type TailwindPluginFn = (api: PluginAPI) => void

// ---------------------------------------------------------------------------
// theme.extend values — consumed by tailwind.config.ts `theme.extend`
// ---------------------------------------------------------------------------

/**
 * Brand color tokens for Tailwind `theme.extend.colors`.
 * Does NOT duplicate built-in Tailwind color scale values — only brand-specific
 * tokens that have no direct Tailwind equivalent.
 */
export const themeColors: Record<string, string> = {
  // Core brand palette (sky-based)
  'brand-bg':        nSelfPalette.bgBody,         // #030712 (gray-950)
  'brand-header':    nSelfPalette.bgHeader,        // #0f172a (slate-900)
  'brand-surface':   nSelfPalette.bgSurface,       // #111827 (gray-900)
  'brand-surface-2': nSelfPalette.bgSurface2,      // #1f2937 (gray-800)
  'brand-primary':   nSelfPalette.accentFrom,      // #0ea5e9 (sky-500)
  'brand-hover':     nSelfPalette.accentHoverFrom, // #38bdf8 (sky-400)
  'brand-ink':       nSelfPalette.textPrimary,     // #ffffff
  'brand-secondary': nSelfPalette.textSecondary,   // #d1d5db (gray-300)
  'brand-muted':     nSelfPalette.textMuted,       // #9ca3af (gray-400)
  'brand-link':      nSelfPalette.textLink,        // #38bdf8 (sky-400)
  'brand-border':    nSelfPalette.borderCard,      // #374151 (gray-700)
  'brand-subtle':    nSelfPalette.borderSubtle,    // #1f2937 (gray-800)

  // A2 redesign: page bg dark
  'page-dark': PAGE_BG_DARK, // #0B0B14

  // A2 redesign: status tones
  'status-ok-light':    statusTones['ok-light'],    // emerald-400
  'status-ok-dark':     statusTones['ok-dark'],     // emerald-600
  'status-warn-light':  statusTones['warn-light'],  // amber-400
  'status-warn-dark':   statusTones['warn-dark'],   // amber-600
  'status-error-light': statusTones['error-light'], // rose-400
  'status-error-dark':  statusTones['error-dark'],  // rose-600

  // A2 redesign: pill backgrounds
  'pill-sky':    pillTones['pill-sky'].bg,
  'pill-indigo': pillTones['pill-indigo'].bg,
  'pill-green':  pillTones['pill-green'].bg,
  'pill-purple': pillTones['pill-purple'].bg,
  'pill-amber':  pillTones['pill-amber'].bg,
  'pill-rose':   pillTones['pill-rose'].bg,
  'pill-slate':  pillTones['pill-slate'].bg,
}

/**
 * Spacing tokens for Tailwind `theme.extend.spacing`.
 */
export const themeSpacing: Record<string, string> = {
  'section-y-sm': spacingTokens['section-y'].sm,  // 4rem
  'section-y-lg': spacingTokens['section-y'].lg,  // 6rem
  'footer-mt':    spacingTokens['footer-mt'],      // 5rem
}

/**
 * Border radius tokens for Tailwind `theme.extend.borderRadius`.
 */
export const themeBorderRadius: Record<string, string> = {
  'pill':   radiusTokens['radius-pill'],   // calc(infinity * 1px)
  'card':   radiusTokens['radius-card'],   // 0.75rem
  'button': radiusTokens['radius-button'], // 0.5rem
}

/**
 * Full theme.extend object — spread into your tailwind.config.ts.
 *
 * Usage (tailwind.config.ts — v3):
 *   import { themeExtend } from '@nself/tailwind-brand/plugin'
 *   export default { theme: { extend: themeExtend }, plugins: [nSelfBrandPlugin] }
 */
export const themeExtend: ThemeConfig = {
  colors:       themeColors,
  spacing:      themeSpacing,
  borderRadius: themeBorderRadius,
}

// ---------------------------------------------------------------------------
// Plugin function
// ---------------------------------------------------------------------------

/**
 * nSelf brand Tailwind v3 plugin.
 *
 * Injects brand CSS custom properties into `:root` (via `addBase`) and
 * registers all brand utility classes (via `addUtilities`).
 *
 * The plugin intentionally does NOT call `matchUtilities` or `addComponents`
 * to keep the surface area minimal and predictable across Tailwind versions.
 */
function nSelfBrandPlugin({ addBase, addUtilities }: PluginAPI): void {
  // 1. Inject CSS custom properties into :root
  addBase({
    ':root': brandCssVars as unknown as CSSProperties,
  })

  // 2. Register brand utility classes
  addUtilities(
    brandUtilities as unknown as Record<string, CSSProperties>,
    { respectPrefix: true, respectImportant: true }
  )
}

export default nSelfBrandPlugin as TailwindPluginFn

// ---------------------------------------------------------------------------
// Re-export raw token maps for consumers that want direct access
// ---------------------------------------------------------------------------
export {
  nSelfPalette,
  brandCssVars,
  brandUtilities,
  PAGE_BG_DARK,
  statusTones,
  pillTones,
  spacingTokens,
  radiusTokens,
} from './index'
