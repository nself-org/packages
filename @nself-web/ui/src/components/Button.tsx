import * as React from 'react'
import { cn } from '../lib/cn'

// A1-T03: Button — 5 variants × 3 sizes × (loading, disabled, active)
// Spec: p97-web-redesign-a1-component-library-expansion.md § Components — Button, Pill
// Source: web-org-redesign-2026-04-25/src/shell.jsx
// UX-U08: disabled during loading; onNetworkError for optimistic rollback + toast trigger

export type ButtonVariant = 'primary' | 'indigo' | 'outline' | 'ghost' | 'soft'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style.
   * - primary: sky-600 (nSelf brand CTA)
   * - indigo: indigo-600 (AI / premium CTA)
   * - outline: sky border, transparent bg
   * - ghost: text-only, no background
   * - soft: muted background, tertiary action
   */
  variant?: ButtonVariant
  /** Size token */
  size?: ButtonSize
  /**
   * UX-U08: When true, shows a spinner and disables the button.
   * Use this to indicate an in-flight form submit or async operation.
   */
  loading?: boolean
  /**
   * UX-U08: Called when the button's onClick throws or rejects with an Error.
   * Parent can use this to trigger optimistic rollback and show an error toast.
   * The Toast component (A1-T10) integrates here.
   */
  onNetworkError?: (error: Error) => void
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-sky-600 hover:bg-sky-500 text-white focus-visible:outline-sky-600',
  indigo:
    'bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:outline-indigo-600',
  outline:
    'border border-sky-600 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-400 dark:hover:bg-sky-500/10 focus-visible:outline-sky-600',
  ghost:
    'text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 focus-visible:outline-sky-500',
  soft:
    'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 focus-visible:outline-slate-500',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-7 py-3 text-base rounded-lg gap-2',
}

const spinnerSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

function Spinner({ size }: { size: ButtonSize }) {
  return (
    <svg
      className={cn('animate-spin shrink-0', spinnerSizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  onClick,
  onNetworkError,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  const handleClick = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick) return
      try {
        await (onClick as (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void)(e)
      } catch (err) {
        if (onNetworkError && err instanceof Error) {
          onNetworkError(err)
        } else {
          throw err
        }
      }
    },
    [onClick, onNetworkError]
  )

  return (
    <button
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={onNetworkError ? handleClick : onClick}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Spinner size={size} />}
      {children}
    </button>
  )
}
