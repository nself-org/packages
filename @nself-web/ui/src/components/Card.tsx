import * as React from 'react'
import { cn } from '../lib/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'glow'
}

const variantClasses: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-white/[0.03] border border-white/10',
  bordered: 'border border-white/10',
  glow: 'bg-white/[0.03] border border-indigo-500/30 shadow-[0_0_24px_-8px_rgba(99,102,241,0.3)]',
}

export function Card({ variant = 'default', className, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-xl p-6', variantClasses[variant], className)}
      {...props}
    />
  )
}
