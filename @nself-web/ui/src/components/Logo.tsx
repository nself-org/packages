'use client'

import * as React from 'react'
import { cn } from '../lib/cn'

export interface LogoProps {
  /** Height class (e.g. 'h-8') — width is auto */
  className?: string
  /** Whether to show the "CLI" suffix */
  withCli?: boolean
  /**
   * Product wordmark. When set, the logo renders the terminal icon + the large
   * "ɳ" glyph + this product name (thin), and DROPS "SELF"/"CLI".
   * e.g. product="Task" → ">_ ɳTask". When unset, renders the default ">_ ɳSELF CLI".
   */
  product?: string
}

/**
 * ɳSelf SVG logo.
 * Gradient rect + terminal icon + wordmark.
 * Based on Claude Design shell.jsx Logo component.
 */
export function Logo({ className = 'h-8 w-auto', withCli = true, product }: LogoProps) {
  const id = React.useId()
  return (
    <svg
      viewBox="0 0 120 32"
      fill="none"
      aria-hidden="true"
      className={cn(className)}
    >
      <defs>
        <linearGradient
          id={`${id}-g`}
          x1="0"
          y1="16"
          x2="24"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#AAE4FF" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <rect x="2" y="6" width="20" height="20" rx="4" fill={`url(#${id}-g)`} />
      <path
        d="M6 11l3 3-3 3M11 17h6"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="28"
        y="23"
        fill="currentColor"
        fontSize="20"
        fontWeight="500"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
      >
        ɳ
      </text>
      {product ? (
        <text
          x="42"
          y="23"
          fill="currentColor"
          fontSize="14"
          fontWeight="400"
          fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
          letterSpacing="0.5"
          opacity="0.85"
        >
          {product}
        </text>
      ) : (
        <>
          <text
            x="40"
            y="23"
            fill="currentColor"
            fontSize="14"
            fontWeight="600"
            fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            letterSpacing="1.2"
          >
            SELF
          </text>
          {withCli && (
            <text
              x="84"
              y="23"
              fill="currentColor"
              fontSize="12"
              fontWeight="400"
              fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
              letterSpacing="1"
              opacity="0.7"
            >
              CLI
            </text>
          )}
        </>
      )}
    </svg>
  )
}
