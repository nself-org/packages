// Product accent colors for OG image generation.
// Canonical source: I07 spec — matches brand color-theme-standard.md

export type ProductKey =
  | 'org'
  | 'docs'
  | 'cloud'
  | 'nchat'
  | 'nclaw'
  | 'ntv'
  | 'nfamily'
  | 'ntask'
  | 'clawde'

export interface ProductConfig {
  accent: string
  accentAlpha: string  // accent at 15% opacity for backgrounds
  accentBorder: string // accent at 40% opacity for borders
  accentText: string   // accent at 80% opacity for text
  label: string
  wordmark: string
}

export const PRODUCT_COLORS: Record<ProductKey, ProductConfig> = {
  org: {
    accent: '#0ea5e9',       // sky-500
    accentAlpha: 'rgba(14, 165, 233, 0.15)',
    accentBorder: 'rgba(14, 165, 233, 0.4)',
    accentText: '#38bdf8',   // sky-400
    label: 'nself.org',
    wordmark: 'ɳSelf',
  },
  docs: {
    accent: '#0ea5e9',       // sky-500
    accentAlpha: 'rgba(14, 165, 233, 0.15)',
    accentBorder: 'rgba(14, 165, 233, 0.4)',
    accentText: '#38bdf8',
    label: 'nself.org/docs',
    wordmark: 'ɳSelf Docs',
  },
  cloud: {
    accent: '#0ea5e9',       // sky-500
    accentAlpha: 'rgba(14, 165, 233, 0.15)',
    accentBorder: 'rgba(14, 165, 233, 0.4)',
    accentText: '#38bdf8',
    label: 'cloud.nself.org',
    wordmark: 'nCloud',
  },
  nchat: {
    accent: '#6366f1',       // indigo-500
    accentAlpha: 'rgba(99, 102, 241, 0.15)',
    accentBorder: 'rgba(99, 102, 241, 0.4)',
    accentText: '#818cf8',   // indigo-400
    label: 'chat.nself.org',
    wordmark: 'ɳChat',
  },
  nclaw: {
    accent: '#8b5cf6',       // violet-500
    accentAlpha: 'rgba(139, 92, 246, 0.15)',
    accentBorder: 'rgba(139, 92, 246, 0.4)',
    accentText: '#a78bfa',   // violet-400
    label: 'claw.nself.org',
    wordmark: 'ɳClaw',
  },
  ntv: {
    accent: '#ef4444',       // red-500
    accentAlpha: 'rgba(239, 68, 68, 0.15)',
    accentBorder: 'rgba(239, 68, 68, 0.4)',
    accentText: '#f87171',   // red-400
    label: 'ntv.nself.org',
    wordmark: 'nTV',
  },
  nfamily: {
    accent: '#10b981',       // emerald-500
    accentAlpha: 'rgba(16, 185, 129, 0.15)',
    accentBorder: 'rgba(16, 185, 129, 0.4)',
    accentText: '#34d399',   // emerald-400
    label: 'family.nself.org',
    wordmark: 'nFamily',
  },
  ntask: {
    accent: '#f59e0b',       // amber-500
    accentAlpha: 'rgba(245, 158, 11, 0.15)',
    accentBorder: 'rgba(245, 158, 11, 0.4)',
    accentText: '#fbbf24',   // amber-400
    label: 'task.nself.org',
    wordmark: 'ɳTasks',
  },
  clawde: {
    accent: '#06b6d4',       // cyan-500
    accentAlpha: 'rgba(6, 182, 212, 0.15)',
    accentBorder: 'rgba(6, 182, 212, 0.4)',
    accentText: '#22d3ee',   // cyan-400
    label: 'clawde.nself.org',
    wordmark: 'ClawDE',
  },
}

export function getProductConfig(product: string): ProductConfig {
  const key = product as ProductKey
  return PRODUCT_COLORS[key] ?? PRODUCT_COLORS.org
}
