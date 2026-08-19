import * as React from 'react'
import { cn } from '../lib/cn'

export type Platform =
  | 'macos'
  | 'linux'
  | 'windows'
  | 'ios'
  | 'android'
  | 'appletv'
  | 'roku'
  | 'android-tv'
  | 'web'

const ICONS: Record<Platform, React.ReactNode> = {
  macos: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 17.607c-.786 2.28-3.139 6.317-5.563 6.361-1.608.031-2.125-.953-3.963-.953-1.837 0-2.412.923-3.932.983-2.572.099-6.542-5.827-6.542-10.995 0-4.747 3.308-7.1 6.198-7.143 1.55-.028 3.014 1.045 3.959 1.045.949 0 2.727-1.29 4.596-1.101.782.033 2.979.315 4.389 2.377l-.053.033c-.674.433-2.515 1.845-2.505 4.328.01 3.011 2.266 3.987 2.416 4.069zM15.998 2.38c.678-.820 1.133-1.96 1.009-3.097-1.006.042-2.217.68-2.933 1.498-.647.74-1.214 1.89-1.062 3.003 1.122.086 2.273-.548 2.986-1.404z" />
    </svg>
  ),
  linux: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.581 19.049c-.55-.446-.336-1.431-.932-2.015-.524-.516-1.523-.298-2.221-.932-.715-.647-.485-1.707-1.27-2.286-1.631-1.229-3.27.047-4.917-.301-1.651-.348-2.68-1.949-4.039-2.263-1.21-.279-1.759.47-2.979.498-1.21.023-1.523-.785-2.728-.994-1.195-.205-2.07.702-2.663 1.711-.539.917-.438 1.783-.623 2.736-.205 1.045-.869 1.743-.869 2.697 0 .963.412 1.685.891 2.42.47.716.875 1.587 1.75 1.958 1.101.47 2.064-.148 3.139-.092 1.07.057 1.9.785 2.97.718 1.058-.066 1.878-.893 2.965-.979 1.085-.086 2.047.498 3.066.449 1.034-.051 1.707-.791 2.63-1.135.897-.334 1.767-.15 2.571-.645.777-.477 1.135-1.392 1.668-2.097.509-.672 1.259-1.12 1.481-1.951.223-.828-.076-1.604-.58-2.093l-.03-.024z" />
    </svg>
  ),
  windows: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  ),
  ios: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1 4v2h2V6h-2zm0 4v8h2v-8h-2z" />
    </svg>
  ),
  android: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.523 15.34c-.3.831-1.113 1.426-2.058 1.426-.946 0-1.758-.595-2.059-1.426H10.6c-.3.831-1.113 1.426-2.058 1.426C7.596 16.766 6.784 16.17 6.484 15.34H4.5v-4.05l1.507-5.354A1.5 1.5 0 017.448 4.8h9.104a1.5 1.5 0 011.441 1.136L19.5 11.29v4.05h-1.977zM9 8.25a.75.75 0 000 1.5.75.75 0 000-1.5zm6 0a.75.75 0 000 1.5.75.75 0 000-1.5z" />
    </svg>
  ),
  appletv: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 7.5A1.5 1.5 0 013.5 6h17A1.5 1.5 0 0122 7.5v9A1.5 1.5 0 0120.5 18h-17A1.5 1.5 0 012 16.5v-9zm7.5.5v8h5V8h-5z" />
    </svg>
  ),
  roku: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 6h18v12H3V6zm2 2v8h14V8H5zm2 2h4v4H7v-4zm6 0h4v4h-4v-4z" />
    </svg>
  ),
  'android-tv': (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 3H4a1 1 0 00-1 1v12a1 1 0 001 1h7v2H7v2h10v-2h-4v-2h7a1 1 0 001-1V4a1 1 0 00-1-1zm-1 12H5V5h14v10z" />
    </svg>
  ),
  web: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
    </svg>
  ),
}

const LABELS: Record<Platform, string> = {
  macos: 'macOS',
  linux: 'Linux',
  windows: 'Windows',
  ios: 'iOS',
  android: 'Android',
  appletv: 'Apple TV',
  roku: 'Roku',
  'android-tv': 'Android TV',
  web: 'Web',
}

export interface PlatformBadgesProps {
  platforms: Platform[]
  className?: string
}

export function PlatformBadges({ platforms, className }: PlatformBadgesProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {platforms.map((p) => (
        <span
          key={p}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900 px-3 py-1 text-xs font-medium text-gray-300"
        >
          {ICONS[p]}
          {LABELS[p]}
        </span>
      ))}
    </div>
  )
}
