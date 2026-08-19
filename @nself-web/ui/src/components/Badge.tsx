import * as React from 'react'
import { cn } from '../lib/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'success' | 'warning'
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/40',
  outline: 'border border-white/20 text-white/60',
  success: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
  warning: 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
