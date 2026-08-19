import * as React from 'react'
import { cn } from '../lib/cn'

// T01: Shared skeleton loading primitives used across all nself web apps.
// Apps import from @nself-web/ui rather than duplicating locally.

export interface SkeletonLineProps {
  className?: string
}

export function SkeletonLine({ className = '' }: SkeletonLineProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-gray-700/60',
        className,
      )}
    />
  )
}

export interface SkeletonCardProps {
  children?: React.ReactNode
  className?: string
}

export function SkeletonCard({ children, className = '' }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl border border-gray-800 bg-gray-900 p-8',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Generic list-row skeleton — a title line + two supporting lines. */
export function SkeletonListRow({ className = '' }: { className?: string }) {
  return (
    <div className={cn('space-y-2 py-3 border-b border-gray-800/60', className)}>
      <SkeletonLine className="h-4 w-48" />
      <div className="flex gap-3">
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-3 w-16" />
      </div>
    </div>
  )
}

/** Feed-item / message card skeleton. */
export function SkeletonFeedItem({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex gap-3 py-4 border-b border-gray-800/40', className)}>
      {/* Avatar */}
      <SkeletonLine className="h-9 w-9 flex-shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3 w-32" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-3/4" />
      </div>
    </div>
  )
}

/** Profile / header skeleton — avatar + two text lines. */
export function SkeletonProfile({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <SkeletonLine className="h-14 w-14 flex-shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-5 w-40" />
        <SkeletonLine className="h-3 w-24" />
      </div>
    </div>
  )
}

/** Two-column pricing card skeleton — mirrors the standard pricing page layout. */
export function SkeletonPricingCards({ className = '' }: { className?: string }) {
  return (
    <div className={cn('grid gap-6 sm:grid-cols-2', className)}>
      {[0, 1].map((i) => (
        <SkeletonCard key={i}>
          <SkeletonLine className="mb-3 h-6 w-20" />
          <SkeletonLine className="mb-2 h-10 w-24" />
          <SkeletonLine className="mb-6 h-4 w-48" />
          <SkeletonLine className="mb-6 h-10 w-full" />
          {[0, 1, 2, 3].map((j) => (
            <SkeletonLine key={j} className="mb-2 h-4 w-full" />
          ))}
        </SkeletonCard>
      ))}
    </div>
  )
}

/** Generic page-level loading skeleton — hero title + subtitle + CTA. */
export function SkeletonPageHero({ className = '' }: { className?: string }) {
  return (
    <div className={cn('mx-auto max-w-2xl space-y-4 py-20 text-center', className)}>
      <SkeletonLine className="mx-auto h-10 w-2/3" />
      <SkeletonLine className="mx-auto h-5 w-3/4" />
      <SkeletonLine className="mx-auto h-5 w-1/2" />
      <div className="flex justify-center gap-3 pt-4">
        <SkeletonLine className="h-10 w-32 rounded-md" />
        <SkeletonLine className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}
