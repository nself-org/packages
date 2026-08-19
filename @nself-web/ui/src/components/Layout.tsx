import * as React from 'react'
import { cn } from '../lib/cn'
import { Header, type HeaderProps } from './Header'
import { Footer, type FooterProps } from './Footer'

export interface LayoutProps {
  children: React.ReactNode
  /** Props forwarded to Header */
  headerProps?: HeaderProps
  /** Props forwarded to Footer */
  footerProps?: FooterProps
  /** Hide header */
  hideHeader?: boolean
  /** Hide footer */
  hideFooter?: boolean
  /** Additional class on the main content wrapper */
  className?: string
}

export function Layout({
  children,
  headerProps,
  footerProps,
  hideHeader = false,
  hideFooter = false,
  className,
}: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-bg text-brand-ink">
      {!hideHeader && <Header {...headerProps} />}
      <main className={cn('flex-1', className)}>
        {children}
      </main>
      {!hideFooter && <Footer {...footerProps} />}
    </div>
  )
}
