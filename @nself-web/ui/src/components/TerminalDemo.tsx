'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * TerminalDemo
 *
 * Hero-section animated terminal that mimics real nSelf CLI output. The faux
 * window has a FIXED height; content scrolls inside it as new lines append.
 * The window does not grow with the script.
 *
 * Output format mirrors the real CLI's `internal/ui` helpers:
 *   ✓ <message>            → Success (green check + body)
 *   ℹ <message>            → Info (blue circle)
 *   ⚙ Step N/M ─ <text>    → Step (gear + bold counter)
 *   → <heading>            → Section header (blue arrow + bold)
 *   $ <command>            → User-typed command (sky $ prompt + white text)
 *
 * The script reflects a real `init → start → status` flow against the demo
 * preset. Commands and output strings are kept close to what the CLI actually
 * prints (see cli/internal/ui/messages.go and cli/cmd/commands/{init,start,status}.go).
 *
 * The classic v1 script lives at TerminalDemo.classic.tsx for fallback.
 */

export type TerminalLineType =
  | 'command'
  | 'output'
  | 'step'
  | 'success'
  | 'info'
  | 'section'
  | 'service'
  | 'summary'
  | 'blank'

export interface TerminalLine {
  type: TerminalLineType
  text: string
  delay: number
  /** Optional explicit color tone for `output` */
  tone?: 'amber' | 'green' | 'sky' | 'gray' | 'indigo' | 'red'
}

const DEFAULT_SCRIPT: TerminalLine[] = [
  // 1. install — one-line install summary, no banner spam
  { type: 'command', text: 'curl -sSL install.nself.org | bash', delay: 0 },
  { type: 'success', text: 'Installed nself v1.0.12', delay: 700 },
  { type: 'blank', text: '', delay: 1000 },

  // half-second pause before init
  { type: 'command', text: 'nself init', delay: 1700 },
  { type: 'success', text: 'Project ready (6 services configured)', delay: 2300 },
  { type: 'info', text: 'Run nself start to launch your stack', delay: 2550 },
  { type: 'blank', text: '', delay: 2800 },

  // half-second pause before start
  { type: 'command', text: 'nself start', delay: 3500 },
  { type: 'success', text: 'All ports available', delay: 4000 },
  { type: 'success', text: 'PostgreSQL ready', delay: 4350 },
  { type: 'success', text: 'hasura ready', delay: 4650 },
  { type: 'success', text: 'auth ready', delay: 4950 },
  { type: 'success', text: 'storage ready', delay: 5250 },
  { type: 'success', text: 'nginx ready', delay: 5550 },
  { type: 'blank', text: '', delay: 5800 },
  { type: 'summary', text: '6/6 services healthy', delay: 6000 },
  { type: 'info', text: 'https://api.local.nself.org', delay: 6300 },
]

const TOTAL_DURATION = 6800
const LOOP_PAUSE = 12000

export interface TerminalDemoProps {
  /** Override the default animation script */
  script?: TerminalLine[]
  /** Total animation duration in ms (default 6800) */
  totalDuration?: number
  /** Pause between animation loops in ms (default 12000 — long enough to read the final state) */
  loopPause?: number
  /** Fixed body height in px (window does not grow). Default 320. */
  bodyHeightPx?: number
  /** Additional className */
  className?: string
}

function toneClass(tone?: TerminalLine['tone']): string {
  switch (tone) {
    case 'amber': return 'text-amber-400'
    case 'green': return 'text-green-400'
    case 'sky': return 'text-sky-400'
    case 'gray': return 'text-gray-500'
    case 'indigo': return 'text-indigo-400'
    case 'red': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

/**
 * Render a `service` type line. Two formats supported:
 *  - `<name>      <status>     (<detail>)`        used by `nself start` step output
 *  - `healthy   <name>        (<detail>)`         used by `nself status` rows
 *
 * Either way: split on runs of 2+ spaces, color-code the segments, prefix with
 * a green ✓.
 */
function ServiceLine({ text }: { text: string }) {
  const segments = text.split(/  +/)
  const isHealthRow = segments[0] === 'healthy'
  return (
    <div className="ml-4 flex items-baseline">
      <span className="text-green-400 mr-2">✓</span>
      {segments.map((seg, idx) => {
        if (isHealthRow && idx === 0) {
          return <span key={idx} className="text-green-400 mr-4">{seg}</span>
        }
        if (idx === 0) {
          return <span key={idx} className="text-white mr-4">{seg}</span>
        }
        if (seg === 'started' || seg === 'healthy' || seg === 'ready') {
          return <span key={idx} className="text-green-400 mr-4">{seg}</span>
        }
        if (seg === 'failed' || seg === 'down') {
          return <span key={idx} className="text-red-400 mr-4">{seg}</span>
        }
        if (seg.startsWith('(') && seg.endsWith(')')) {
          return <span key={idx} className="text-gray-500">{seg}</span>
        }
        return <span key={idx} className="text-gray-400 mr-4">{seg}</span>
      })}
    </div>
  )
}

export function TerminalDemo({
  script = DEFAULT_SCRIPT,
  totalDuration = TOTAL_DURATION,
  loopPause = LOOP_PAUSE,
  bodyHeightPx = 320,
  className,
}: TerminalDemoProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
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

  // Auto-scroll body to bottom each time a new line appears, so the latest
  // output is always visible inside the fixed-height window.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [visibleLines])

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
              <span className="ml-3 text-xs text-gray-500 font-mono">~/demo — zsh</span>
            </div>
            <button
              onClick={handleReplay}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-mono select-none"
              aria-label="Replay animation"
            >
              ↻ replay
            </button>
          </div>
          {/* Terminal body — fixed height, scrolls inside */}
          <div
            ref={bodyRef}
            className="px-6 py-4 font-mono text-[13px] leading-6 overflow-y-auto"
            style={{ height: bodyHeightPx }}
          >
            {script.slice(0, visibleLines).map((line, i) => {
              const isLast = i === visibleLines - 1
              switch (line.type) {
                case 'command':
                  return (
                    <div key={i} className="flex items-baseline gap-2 mt-1">
                      <span className="text-sky-400 select-none">$</span>
                      <span className="text-white">{line.text}</span>
                      {isLast && (
                        <span className="ml-0.5 inline-block h-3.5 w-1.5 bg-white/80 animate-pulse" />
                      )}
                    </div>
                  )
                case 'step':
                  return (
                    <div key={i} className="mt-2 flex items-baseline">
                      <span className="text-sky-400 mr-2">⚙</span>
                      <span className="text-white font-semibold">{line.text}</span>
                    </div>
                  )
                case 'success':
                  return (
                    <div key={i} className="ml-4 flex items-baseline">
                      <span className="text-green-400 mr-2">✓</span>
                      <span className="text-gray-200">{line.text}</span>
                    </div>
                  )
                case 'info':
                  return (
                    <div key={i} className="ml-4 flex items-baseline">
                      <span className="text-sky-400 mr-2">ℹ</span>
                      <span className="text-gray-300">{line.text}</span>
                    </div>
                  )
                case 'section':
                  return (
                    <div key={i} className="mt-3 flex items-baseline">
                      <span className="text-sky-400 mr-2">→</span>
                      <span className="text-white font-semibold">{line.text}</span>
                    </div>
                  )
                case 'service':
                  return <ServiceLine key={i} text={line.text} />
                case 'summary':
                  return (
                    <div key={i} className="ml-4 mt-1 text-emerald-300 font-medium">
                      {line.text}
                    </div>
                  )
                case 'output':
                  return (
                    <div key={i} className={toneClass(line.tone)}>{line.text || ' '}</div>
                  )
                case 'blank':
                  return <div key={i} className="h-2" />
                default:
                  return null
              }
            })}
            {visibleLines === 0 && (
              <span className="inline-block h-3.5 w-1.5 bg-white/80 animate-pulse" />
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
            <span className="ml-3 text-xs text-gray-500 font-mono">~/demo — zsh</span>
          </div>
          <div className="p-4 font-mono text-xs leading-5">
            <div className="flex gap-2"><span className="text-sky-400">$</span><span className="text-white">curl -sSL install.nself.org | bash</span></div>
            <div className="ml-4 mt-1 text-gray-200"><span className="text-green-400">✓</span> Installed nself v1.0.12</div>
            <div className="flex gap-2 mt-3"><span className="text-sky-400">$</span><span className="text-white">nself init</span></div>
            <div className="ml-4 mt-1 text-gray-200"><span className="text-green-400">✓</span> Project ready</div>
            <div className="flex gap-2 mt-3"><span className="text-sky-400">$</span><span className="text-white">nself start</span></div>
            <div className="ml-4 mt-1 text-gray-200"><span className="text-green-400">✓</span> PostgreSQL ready</div>
            <div className="ml-4 text-gray-200"><span className="text-green-400">✓</span> hasura ready</div>
            <div className="ml-4 text-gray-200"><span className="text-green-400">✓</span> auth ready</div>
            <div className="ml-4 text-gray-200"><span className="text-green-400">✓</span> storage ready</div>
            <div className="ml-4 text-gray-200"><span className="text-green-400">✓</span> nginx ready</div>
            <div className="ml-4 mt-2 text-emerald-300 font-medium">6/6 services healthy</div>
            <div className="ml-4 mt-1 text-sky-400">https://api.local.nself.org</div>
          </div>
        </div>
      </div>
    </div>
  )
}
