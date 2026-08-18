'use client'

import * as React from 'react'
import { cn } from '../lib/cn'

interface TerminalLine {
  type: 'command' | 'output' | 'success' | 'dim'
  text: string
  delay?: number
}

const DEFAULT_LINES: TerminalLine[] = [
  { type: 'dim', text: '# Install nSelf CLI', delay: 0 },
  { type: 'command', text: 'brew install nself-org/nself/nself', delay: 300 },
  { type: 'output', text: '==> Downloading nself v1.0.9...', delay: 900 },
  { type: 'success', text: '✓ nself installed', delay: 1400 },
  { type: 'dim', text: '', delay: 1700 },
  { type: 'dim', text: '# Spin up your backend', delay: 1800 },
  { type: 'command', text: 'nself init my-backend', delay: 2100 },
  { type: 'output', text: '✓ PostgreSQL, Hasura, Auth, Nginx configured', delay: 2700 },
  { type: 'command', text: 'nself start', delay: 3000 },
  { type: 'output', text: '✓ Backend running at https://api.my-backend.com', delay: 3800 },
  { type: 'success', text: '✓ 5 minutes. Production-ready.', delay: 4200 },
]

export interface TerminalAnimationProps {
  lines?: TerminalLine[]
  className?: string
}

export function TerminalAnimation({ lines = DEFAULT_LINES, className }: TerminalAnimationProps) {
  const [visibleCount, setVisibleCount] = React.useState(0)

  React.useEffect(() => {
    if (visibleCount >= lines.length) return
    const line: TerminalLine | undefined = lines[visibleCount]
    if (line === undefined) return
    const timer = setTimeout(
      () => setVisibleCount((c) => c + 1),
      line.delay !== undefined && visibleCount === 0
        ? line.delay
        : (line.delay ?? 0) - (lines[visibleCount - 1]?.delay ?? 0)
    )
    return () => clearTimeout(timer)
  }, [visibleCount, lines])

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-gray-800 bg-gray-950 font-mono text-sm shadow-2xl shadow-sky-500/5',
        className
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
        <span className="ml-2 text-xs text-gray-500">bash</span>
      </div>

      {/* Terminal body */}
      <div className="min-h-[220px] space-y-1 p-5">
        {lines.slice(0, visibleCount).map((line, i) => (
          <div key={i} className="leading-6">
            {line.type === 'command' && (
              <span>
                <span className="text-sky-400">$</span>{' '}
                <span className="text-gray-100">{line.text}</span>
              </span>
            )}
            {line.type === 'output' && (
              <span className="text-gray-400">{line.text}</span>
            )}
            {line.type === 'success' && (
              <span className="text-green-400">{line.text}</span>
            )}
            {line.type === 'dim' && (
              <span className="text-gray-600">{line.text}</span>
            )}
          </div>
        ))}
        {visibleCount < lines.length && (
          <span className="inline-block h-4 w-2 animate-pulse bg-sky-400" />
        )}
      </div>
    </div>
  )
}
