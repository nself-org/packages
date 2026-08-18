'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface TerminalLine {
  type: 'command' | 'output' | 'blank' | 'url' | 'service'
  text: string
  delay: number
  /** Color tone for output lines */
  tone?: 'amber' | 'green' | 'sky' | 'gray' | 'indigo'
}

const DEFAULT_SCRIPT: TerminalLine[] = [
  { type: 'command', text: 'curl -sSL https://install.nself.org | bash', delay: 0 },
  { type: 'output', text: '↓ Installing ɳSelf v1.0.12 (MIT licensed)...', delay: 700, tone: 'amber' },
  { type: 'output', text: '✓ Downloaded nself (14.8 MB)', delay: 1300, tone: 'green' },
  { type: 'output', text: '✓ Installed to /usr/local/bin/nself', delay: 1700, tone: 'green' },
  { type: 'command', text: 'nself init my-saas --template=multi-tenant', delay: 2200 },
  { type: 'output', text: '→ Created ./my-saas', delay: 2900, tone: 'sky' },
  { type: 'output', text: '→ Generated 23 config files', delay: 3300, tone: 'sky' },
  { type: 'output', text: '→ 12 services + 25 free plugins available', delay: 3700, tone: 'sky' },
  { type: 'command', text: 'nself up', delay: 4200 },
  { type: 'service', text: '▸ postgres      healthy     (16.2, TimescaleDB, pgvector)', delay: 4800 },
  { type: 'service', text: '▸ hasura        healthy     (v2.44, GraphQL on :8080)', delay: 5200 },
  { type: 'service', text: '▸ auth          healthy     (sessions, 13 OAuth, WebAuthn)', delay: 5600 },
  { type: 'service', text: '▸ storage       healthy     (MinIO S3, 4 buckets)', delay: 6000 },
  { type: 'service', text: '▸ nginx         healthy     (SSL via Let\'s Encrypt)', delay: 6400 },
  { type: 'service', text: '▸ prometheus    healthy     (+9 observability services)', delay: 6800 },
  { type: 'blank', text: '', delay: 7300 },
  { type: 'output', text: '🚀 Stack live at https://api.my-saas.local.nself.org', delay: 7600, tone: 'green' },
  { type: 'output', text: '   Your data. Your server. $0 forever.', delay: 8000, tone: 'gray' },
]

const TOTAL_DURATION = 9000
const LOOP_PAUSE = 3000

export interface TerminalDemoProps {
  /** Override the default animation script */
  script?: TerminalLine[]
  /** Total animation duration in ms (default 9000) */
  totalDuration?: number
  /** Pause between animation loops in ms (default 3000) */
  loopPause?: number
  /** Additional className */
  className?: string
}

/**
 * Render a `service` type line: `▸ <name>      <status>     (<detail>)`
 * Colors: ▸ sky-400, name white, "healthy" green-400, parens gray-500
 */
function ServiceLine({ text }: { text: string }) {
  // Strip leading ▸ and split by 2+ spaces into segments
  const stripped = text.replace(/^▸\s*/, '')
  const segments = stripped.split(/  +/)
  return (
    <div className="ml-4 flex items-baseline gap-0">
      <span className="text-sky-400 mr-2">▸</span>
      {segments.map((seg, idx) => {
        if (idx === 0) return <span key={idx} className="text-white mr-6">{seg}</span>
        if (seg === 'healthy') return <span key={idx} className="text-green-400 mr-6">{seg}</span>
        if (seg.startsWith('(') && seg.endsWith(')')) return <span key={idx} className="text-gray-500">{seg}</span>
        return <span key={idx} className="text-gray-400 mr-6">{seg}</span>
      })}
    </div>
  )
}

function toneClass(tone?: TerminalLine['tone']): string {
  switch (tone) {
    case 'amber': return 'text-amber-400'
    case 'green': return 'text-green-400'
    case 'sky': return 'text-sky-400'
    case 'gray': return 'text-gray-500'
    case 'indigo': return 'text-indigo-400'
    default: return 'text-gray-400'
  }
}

export function TerminalDemo({
  script = DEFAULT_SCRIPT,
  totalDuration = TOTAL_DURATION,
  loopPause = LOOP_PAUSE,
  className,
}: TerminalDemoProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isVisible = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const runAnimation = useCallback(() => {
    clearTimers()
    setVisibleLines(0)

    script.forEach((line, index) => {
      const t = setTimeout(() => {
        setVisibleLines(index + 1)
      }, line.delay)
      timersRef.current.push(t)
    })

    const loopTimer = setTimeout(() => {
      if (isVisible.current) runAnimation()
    }, totalDuration + loopPause)
    timersRef.current.push(loopTimer)
  }, [script, totalDuration, loopPause])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]: IntersectionObserverEntry[]) => {
        if (entry?.isIntersecting && !isVisible.current) {
          isVisible.current = true
          runAnimation()
        } else if (!entry?.isIntersecting) {
          isVisible.current = false
          clearTimers()
        }
      },
      { threshold: 0.3 }
    )

    const el = containerRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
      clearTimers()
    }
  }, [runAnimation])

  function handleReplay() {
    runAnimation()
  }

  return (
    <div ref={containerRef} className={className}>
      {/* Desktop: animated terminal */}
      <div className="hidden md:block">
        <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden shadow-2xl">
          {/* Title bar */}
          <div className="flex items-center justify-between bg-gray-900 px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>
              <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              <span className="ml-3 text-xs text-gray-500 font-mono">~/my-saas — zsh</span>
            </div>
            <button
              onClick={handleReplay}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-mono select-none"
              aria-label="Replay animation"
            >
              ↻ replay
            </button>
          </div>
          {/* Terminal body */}
          <div className="p-6 font-mono text-sm min-h-[320px]">
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <span className="text-green-400">~</span>
              <span>$</span>
            </div>
            {script.slice(0, visibleLines).map((line, i) => (
              <div key={i} className="mb-1">
                {line.type === 'command' && (
                  <div className="flex items-start gap-2">
                    <span className="text-sky-400 select-none">$</span>
                    <span className="text-white">{line.text}</span>
                    {i === visibleLines - 1 && (
                      <span className="ml-0.5 inline-block h-4 w-0.5 bg-white animate-pulse" />
                    )}
                  </div>
                )}
                {line.type === 'output' && (
                  <div className={`ml-4 ${toneClass(line.tone)}`}>{line.text}</div>
                )}
                {line.type === 'url' && (
                  <div className="text-indigo-400 ml-4">{line.text}</div>
                )}
                {line.type === 'service' && (
                  <ServiceLine text={line.text} />
                )}
                {line.type === 'blank' && <div className="h-2" />}
              </div>
            ))}
            {visibleLines === 0 && (
              <span className="inline-block h-4 w-0.5 bg-white animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile: static screenshot fallback */}
      <div className="md:hidden">
        <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="flex items-center gap-2 bg-gray-900 px-4 py-3 border-b border-gray-800">
            <span className="h-3 w-3 rounded-full bg-red-500"></span>
            <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
            <span className="h-3 w-3 rounded-full bg-green-500"></span>
          </div>
          <div className="p-4 font-mono text-xs">
            <div className="text-gray-500 mb-3">~ $</div>
            <div className="flex gap-2 mb-1">
              <span className="text-sky-400">$</span>
              <span className="text-white">curl -sSL https://install.nself.org | bash</span>
            </div>
            <div className="text-amber-400 ml-4 mb-1">↓ Installing ɳSelf v1.0.12 (MIT licensed)...</div>
            <div className="flex gap-2 mb-1 mt-2">
              <span className="text-sky-400">$</span>
              <span className="text-white">nself up</span>
            </div>
            <div className="ml-4 mb-1 flex gap-2"><span className="text-sky-400">▸</span><span className="text-white">postgres</span><span className="text-green-400 ml-2">healthy</span></div>
            <div className="ml-4 mb-1 flex gap-2"><span className="text-sky-400">▸</span><span className="text-white">hasura</span><span className="text-green-400 ml-4">healthy</span></div>
            <div className="ml-4 mb-3 flex gap-2"><span className="text-sky-400">▸</span><span className="text-white">auth</span><span className="text-green-400 ml-6">healthy</span></div>
            <div className="text-green-400 ml-4">🚀 Stack live at https://api.my-saas.local.nself.org</div>
          </div>
        </div>
      </div>
    </div>
  )
}
