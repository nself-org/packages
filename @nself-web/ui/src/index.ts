'use client'
// A1-T03: Button — 5 variants (primary/indigo/outline/ghost/soft) + 3 sizes + loading state (UX-U08)
export { Button } from './components/Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button'

// A1-T03: Pill — 7 tones (sky/indigo/green/purple/amber/rose/slate) × 2 variants (solid/outlined)
export { Pill } from './components/Pill'
export type { PillProps, PillTone, PillVariant } from './components/Pill'

export { Badge } from './components/Badge'
export type { BadgeProps } from './components/Badge'

export { Card } from './components/Card'
export type { CardProps } from './components/Card'

export { Header } from './components/Header'
export type { HeaderProps, HeaderNavItem } from './components/Header'

export { Footer } from './components/Footer'
export type { FooterProps, FooterLinkGroup, FooterLink, FooterStatusPill, FooterSocialProps } from './components/Footer'

// E3-T02: StatusPill — async RSC live status pill backed by status.nself.org/api/status
export { StatusPill, StatusPillSkeleton } from './components/StatusPill'
export type { StatusPillProps, StatusPillState } from './components/StatusPill'

// A1-T02: Shell components
export { Logo } from './components/Logo'
export type { LogoProps } from './components/Logo'

export { ThemeToggle, useTheme } from './components/ThemeToggle'
export type { ThemeToggleProps } from './components/ThemeToggle'

export { Layout } from './components/Layout'
export type { LayoutProps } from './components/Layout'

export { cn } from './lib/cn'

// Landing page shared components
export { LandingHero } from './components/LandingHero'
export type { LandingHeroProps } from './components/LandingHero'

export { TerminalAnimation } from './components/TerminalAnimation'
export type { TerminalAnimationProps } from './components/TerminalAnimation'

export { PlatformBadges } from './components/PlatformBadges'
export type { PlatformBadgesProps, Platform } from './components/PlatformBadges'

// Video embed
export { TooltipVideo } from './components/TooltipVideo'

// Design tokens
export { tokens, colors, spacing, fonts } from './tokens'
export type { Tokens, Colors, Spacing } from './tokens'

// A1-T04: Layout components — Section, HeroBlock, FeatureGrid, FAQ, CompareTable
export { Section } from './components/Section'
export type { SectionProps } from './components/Section'

export { HeroBlock } from './components/HeroBlock'
export type { HeroBlockProps, HeroBlockCTA, HeroBlockStat } from './components/HeroBlock'

export { FeatureGrid } from './components/FeatureGrid'
export type { FeatureGridProps, FeatureGridItem, FeatureGridTone } from './components/FeatureGrid'

export { FAQ } from './components/FAQ'
export type { FAQProps, FAQItem } from './components/FAQ'

export { CompareTable } from './components/CompareTable'
export type { CompareTableProps, CompareColumn, CompareRow } from './components/CompareTable'

// E1-T02: LiveVersion — shared live CLI version pill (RSC + fetcher prop)
export {
  LiveVersion,
  LiveVersionSkeleton,
  FALLBACK_CLI_VERSION,
  normaliseVersionTag,
} from './components/LiveVersion'
export type {
  LiveVersionProps,
  LiveVersionFetcher,
} from './components/LiveVersion'

// A1-T08: Dashboard and Legal page components — DashboardCard, LegalPageLayout
export { DashboardCard } from './components/DashboardCard'
export type { DashboardCardProps } from './components/DashboardCard'

export { LegalPageLayout } from './components/LegalPageLayout'
export type { LegalPageLayoutProps, LegalTocItem } from './components/LegalPageLayout'

// A1-T09: TerminalDemo — moved from web/org/components/marketing/TerminalDemo
export { TerminalDemo } from './components/TerminalDemo'
export type { TerminalDemoProps, TerminalLine as TerminalDemoLine } from './components/TerminalDemo'

// T01: Skeleton loading primitives — shared across all nself web apps
export {
  SkeletonLine,
  SkeletonCard,
  SkeletonListRow,
  SkeletonFeedItem,
  SkeletonProfile,
  SkeletonPricingCards,
  SkeletonPageHero,
} from './components/Skeleton'
export type {
  SkeletonLineProps,
  SkeletonCardProps,
} from './components/Skeleton'

// T12: CookieBanner — GDPR cookie consent banner, shared across all nSelf web apps
export { CookieBanner, hasCookieConsent } from './components/CookieBanner'
export type { CookieBannerProps } from './components/CookieBanner'

// T-P3-E2-W4-S01-T01: AsyncScreen<T> — 7-state UI contract (loading/empty/error/populated/offline/permission-denied/rate-limited)
export {
  AsyncScreen,
  LoadingState,
  EmptyState,
  ErrorState,
  OfflineState,
  PermissionDeniedState,
  RateLimitedState,
} from './components/AsyncScreen'
export type {
  AsyncScreenProps,
  AsyncState,
  AppError,
  AppErrorCode,
  Result,
} from './components/AsyncScreen'
