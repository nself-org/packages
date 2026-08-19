# @nself/tailwind-brand

Tailwind CSS plugin that registers canonical nSelf brand color utility classes.

Brand canon: sky-500 (`#0ea5e9`) gradient on gray-950 (`#030712`) background.

## Install

```bash
pnpm add @nself/tailwind-brand
# or
npm install @nself/tailwind-brand
```

---

## Plugin Integration (A2-T02)

The package exposes two integration paths. Use the one that matches your Tailwind version.

### Tailwind v4 (recommended for all new subapps)

Import `css-vars.css` into your entry CSS file. This is the **single integration point** — no `tailwind.config.ts` plugin needed.

```css
/* globals.css / tailwind.css */
@import 'tailwindcss';
@import '@nself/tailwind-brand/css-vars.css';
```

This import does three things:

1. Injects all `--color-brand-*` and `--nself-*` CSS custom properties into `:root`.
2. Registers brand tokens in Tailwind v4's `@theme` block (so `bg-page-dark`, `text-status-*`, etc. are available as Tailwind utilities automatically).
3. Registers `@layer utilities` for all brand utility classes (`bg-pill-*`, `rounded-card`, etc.).

### Tailwind v3

Use the dedicated plugin entry point:

```ts
// tailwind.config.ts
import nSelfBrandPlugin from '@nself/tailwind-brand/plugin'
export default {
  plugins: [nSelfBrandPlugin],
}
```

To also extend the Tailwind theme with brand tokens:

```ts
import nSelfBrandPlugin, { themeExtend } from '@nself/tailwind-brand/plugin'
export default {
  theme: { extend: themeExtend },
  plugins: [nSelfBrandPlugin],
}
```

### CSS custom properties emitted

Both integration paths emit the following CSS custom properties:

| Category | Prefix | Example |
|---|---|---|
| Core brand | `--color-brand-*` | `--color-brand-primary: #0ea5e9` |
| A2 page bg | `--nself-page-bg-dark` | `#0B0B14` |
| Status tones | `--nself-status-*` | `--nself-status-ok-light: rgb(52 211 153)` |
| Pill tones | `--nself-pill-*-bg/text` | `--nself-pill-sky-bg: rgb(186 230 253)` |
| Spacing | `--nself-section-y-*`, `--nself-footer-mt` | `--nself-section-y-sm: 4rem` |
| Radius | `--nself-radius-*` | `--nself-radius-pill: calc(infinity * 1px)` |

---

## Token Categories

### Core brand palette

| Utility class | CSS var | Value | Notes |
|---|---|---|---|
| `bg-brand-bg` | `--color-brand-bg` | `#030712` (gray-950) | Page background |
| `bg-brand-header` | `--color-brand-header` | `#0f172a` (slate-900) | Header / nav |
| `bg-brand-surface` | `--color-brand-surface` | `#111827` (gray-900) | Card surfaces |
| `bg-brand-surface-2` | `--color-brand-surface-2` | `#1f2937` (gray-800) | Elevated surfaces |
| `bg-brand-primary` | `--color-brand-primary` | `#0ea5e9` (sky-500) | Solid brand fill |
| `text-brand-primary` | `--color-brand-primary` | `#0ea5e9` (sky-500) | Accent text |
| `text-brand-ink` | `--color-brand-ink` | `#ffffff` | Primary heading text |
| `text-brand-secondary` | `--color-brand-secondary` | `#d1d5db` (gray-300) | Body text |
| `text-brand-muted` | `--color-brand-muted` | `#9ca3af` (gray-400) | Secondary / descriptions |
| `text-brand-link` | `--color-brand-link` | `#38bdf8` (sky-400) | Links in dark mode |
| `border-brand` | `--color-brand-primary` | `#0ea5e9` (sky-500) | Focused / interactive border |
| `border-brand-card` | `--color-brand-border` | `#374151` (gray-700) | Card borders |
| `border-brand-subtle` | `--color-brand-border-subtle` | `#1f2937` (gray-800) | Dividers |
| `from-brand-gradient` | — | sky-500 | Gradient start |
| `to-brand-gradient` | — | blue-600 | Gradient end |

### A2 redesign: page background dark

| Token | CSS var | Value | Notes |
|---|---|---|---|
| `bg-page-dark` | `--nself-page-bg-dark` | `#0B0B14` | Near-black with blue cast — NOT `slate-950` |

### A2 redesign: status tones

| Utility class | CSS var | Tailwind equivalent |
|---|---|---|
| `text-status-ok-light` | `--nself-status-ok-light` | emerald-400 |
| `text-status-ok-dark` | `--nself-status-ok-dark` | emerald-600 |
| `text-status-warn-light` | `--nself-status-warn-light` | amber-400 |
| `text-status-warn-dark` | `--nself-status-warn-dark` | amber-600 |
| `text-status-error-light` | `--nself-status-error-light` | rose-400 |
| `text-status-error-dark` | `--nself-status-error-dark` | rose-600 |

### A2 redesign: pill tones (7 variants)

Each pill utility sets both `background-color` and `color` in a single class.

| Utility class | Background | Text |
|---|---|---|
| `bg-pill-sky` | sky-200 | sky-800 |
| `bg-pill-indigo` | indigo-200 | indigo-800 |
| `bg-pill-green` | green-200 | green-800 |
| `bg-pill-purple` | purple-200 | purple-800 |
| `bg-pill-amber` | amber-100 | amber-800 |
| `bg-pill-rose` | rose-200 | rose-800 |
| `bg-pill-slate` | slate-200 | slate-800 |

### A2 redesign: spacing rhythm

| CSS var | Value | Tailwind equiv |
|---|---|---|
| `--nself-section-y-sm` | `4rem` (64px) | `py-16` |
| `--nself-section-y-lg` | `6rem` (96px) | `py-24` |
| `--nself-footer-mt` | `5rem` (80px) | `mt-20` |

Use via CSS: `padding-block: var(--nself-section-y-sm)`.

### A2 redesign: border radius

| Utility class | CSS var | Value |
|---|---|---|
| `rounded-pill` | `--nself-radius-pill` | `calc(infinity * 1px)` — fully rounded |
| `rounded-card` | `--nself-radius-card` | `0.75rem` (12px) |
| `rounded-button` | `--nself-radius-button` | `0.5rem` (8px) |

---

## Stylelint Plugin (A2-T04)

The package ships a Stylelint plugin that enforces brand-token-only color usage.
It catches Tailwind arbitrary-value hex colors (`bg-[#...]`, `text-[#...]`) that
bypass the shared token system.

### Setup

Add to your workspace root `.stylelintrc.json`:

```json
{
  "plugins": ["./packages/tailwind-brand/stylelint-plugin/index.js"],
  "rules": {
    "tailwind-brand/no-hardcoded-colors": true
  }
}
```

Or when consuming from a subapp:

```json
{
  "plugins": ["@nself/tailwind-brand/stylelint-plugin"],
  "rules": {
    "tailwind-brand/no-hardcoded-colors": true
  }
}
```

### Rule: `tailwind-brand/no-hardcoded-colors`

| Pattern | Behavior | Allowlist |
|---|---|---|
| `bg-[#...]` | Error if hex not in allowlist | `#0B0B14` only |
| `text-[#...]` | Always error | Empty (zero hardcoded text hex permitted) |

**Correct (allowed):**
```tsx
<div className="bg-page-dark text-brand-ink" />
<div className="bg-[#0B0B14]" />  {/* only this hardcoded bg is permitted */}
```

**Rejected:**
```tsx
<div className="bg-[#123456]" />   {/* error: not in allowlist */}
<div className="text-[#ffffff]" /> {/* error: no hardcoded text colors */}
```

### CI supplement: `check-brand-tokens.mjs`

`web/scripts/check-brand-tokens.mjs` runs additional grep-based checks:
- Scans all `.tsx`, `.ts`, `.css`, `.mdx` files across 13 subapps
- Reports `bg-[#...]` violations (allowlist: `#0B0B14` only)
- Reports `text-[#...]` violations (zero allowlist)
- Flags `@font-face` blocks missing an explicit `font-display` declaration

Run via `pnpm lint:tokens` which combines both Stylelint and the grep checks.

### CI gate

`web/.github/workflows/brand-tokens.yml` runs `pnpm lint:tokens` on every PR
affecting `web/**`. Violations fail the PR.

---

## HEX_ALLOWLIST

The `HEX_ALLOWLIST` export lists every raw hex literal that is permitted in application
source files (`.tsx`, `.css`, `.mdx`). Any hex outside this set triggers the CI
`brand-hex-gate.yml` workflow failure.

`#0B0B14` is included in the allowlist (A2 redesign page-bg-dark).

---

## Exports

```ts
import nSelfBrand, {          // default: Tailwind plugin function
  nSelfPalette,               // canonical color hex values
  brandCssVars,               // CSS custom property map (--color-brand-*)
  brandUtilities,             // Tailwind utility class map
  HEX_ALLOWLIST,              // CI-enforced hex allowlist

  // A2 redesign exports
  PAGE_BG_DARK,               // '#0B0B14'
  statusTones,                // ok/warn/error light/dark values
  pillTones,                  // 7 pill bg+text pairs
  spacingTokens,              // section-y, footer-mt
  radiusTokens,               // radius-pill, radius-card, radius-button
} from '@nself/tailwind-brand'
```
