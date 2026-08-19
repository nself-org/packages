# @nself-web/ui

Shared UI component library for all nSelf web marketing sites. This is the single source of truth for every component used across the 13 nSelf subapps.

## Install

```bash
pnpm add @nself-web/ui
```

Peer dependencies (required):

```bash
pnpm add react react-dom
```

## Usage

```ts
import { Button, Header, Footer, cn } from '@nself-web/ui'
import type { ButtonProps } from '@nself-web/ui'
```

Within the nself/web monorepo, add to any subapp's `package.json`:

```json
{
  "dependencies": {
    "@nself-web/ui": "workspace:*"
  }
}
```

## Components

### Shell

| Component | Description |
|-----------|-------------|
| `Logo` | nSelf SVG brand logo (eta mark + wordmark). Props: `className`, `withCli` |
| `Header` | Top nav with skip-to-content link (UX-U19), ThemeToggle, GitHub stars badge, ɳChat link, and `accountButton` slot. Props: `navItems`, `currentPath`, `githubUrl`, `githubStars`, `accountButton`, `chatUrl`, `logo`, `logoHref` |
| `Footer` | 4-column sitemap (Product / Developers / Company / Legal) + animated status pill + social links. Props: `linkGroups`, `statusPill`, `social`, `copyrightText`, `logoHref` |
| `ThemeToggle` | Persists theme to `nself_theme` localStorage; sun/moon icons. Works uncontrolled (reads localStorage) or controlled via `dark` + `onToggle` props |
| `useTheme` | Hook — returns `[dark, setDark]`; setDark updates `nself_theme` localStorage + `<html>` class |

### Buttons and Indicators

| Component | Description |
|-----------|-------------|
| `Button` | 5 variants (primary, indigo, outline, ghost, soft) × 3 sizes + loading state (UX-U08 compliant) |
| `Pill` | 7 tones (sky, indigo, green, purple, amber, rose, slate) × 2 variants (outlined/solid) |

### Layout

| Component | Description |
|-----------|-------------|
| `Section` | Eyebrow + title + subtitle pattern with spacing vars |
| `HeroBlock` | Home hero with H1 + subtitle + CTA + LiveVersion slot |
| `FeatureGrid` | 3-column feature grid |
| `FAQ` | Native `<details>` accordions — no JS state |
| `CompareTable` | Generic competitor comparison matrix |

### Cards and Status

| Component | Description |
|-----------|-------------|
| `StatusBadge` | ok/warn/error pill — wraps `Pill` |
| `DocsCard` | Docs landing card |
| `PluginCard` | Plugin grid item |
| `PriceCard` | Pricing card with tier indicator |
| `ChangelogEntry` | Release entry with date + version + body |
| `BlogCard` | Blog index card |
| `BlogPostLayout` | Blog post detail wrapper |

### Data and Interactive

| Component | Description |
|-----------|-------------|
| `LiveVersion` | RSC component — fetches latest CLI release from GitHub; falls back to `fallbackVersion` prop on API failure (UX-U15) |
| `TerminalDemo` | Animated terminal demonstration |
| `SocialProofRow` | Logo strip + GitHub stars + Hacker News links |
| `Toast` | Error/success/info notification with auto-dismiss (UX-U08; `role="alert"` for errors) |

### Auth and Account

| Component | Description |
|-----------|-------------|
| `AccountButton` | Signed-out: "Sign in" / "Get started"; signed-in: avatar dropdown with focus trap (UX-U19) |
| `LicensesTable` | Active licenses with copy/deactivate per-machine |
| `BillingPanel` | Stripe Customer Portal link + invoice list slot |

### Pages and Layouts

| Component | Description |
|-----------|-------------|
| `DashboardCard` | Account dashboard tile with title, subtitle, icon, and action slots |
| `LegalPageLayout` | Wrapper for terms/privacy/dpa with auto-generated TOC |

### Utilities

| Export | Description |
|--------|-------------|
| `cn` | `clsx` + `tailwind-merge` className helper |
| `tokens` | Shared design token map |

## Development

```bash
# Type-check
pnpm type-check

# Unit tests (vitest — Button, Pill, and future components)
pnpm test

# Lint
pnpm lint

# Storybook
pnpm storybook
```

## Image optimization policy

See [IMAGE-OPTIMIZATION.md](./IMAGE-OPTIMIZATION.md) for the image optimization policy applied across all subapps.

## Brand and design tokens

Brand canon: `~/Sites/nself/.claude/docs/brand/brand-guide.md`
Token map: `src/tokens.ts` — import via `import { tokens } from '@nself-web/ui'`
Tailwind plugin: `import '@nself-web/ui/tailwind-plugin'` in each subapp's CSS
