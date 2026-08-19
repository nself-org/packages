'use client'

import { useState } from 'react'

interface TooltipVideoProps {
  videoId: string
  title: string
  /** Optional thumbnail URL. Falls back to YouTube maxresdefault. */
  thumbnailUrl?: string
  /** Duration shown as a badge on the thumbnail, e.g. "4 min" */
  duration?: string
}

/**
 * TooltipVideo — lightweight YouTube embed with click-to-play.
 *
 * Renders a thumbnail image until the user clicks. On click, replaces with
 * the YouTube iframe. Keeps Cumulative Layout Shift (CLS) < 0.1 by reserving
 * a fixed 16:9 aspect-ratio container before play starts.
 *
 * Usage:
 *   <TooltipVideo videoId="dQw4w9WgXcQ" title="Install nSelf in 5 minutes" duration="4 min" />
 */
export function TooltipVideo({ videoId, title, thumbnailUrl, duration }: TooltipVideoProps) {
  const [playing, setPlaying] = useState(false)

  const thumb = thumbnailUrl ?? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-slate-900 shadow-md"
      style={{ aspectRatio: '16 / 9' }}
      aria-label={title}
    >
      {playing ? (
        <iframe
          src={embedSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex items-center justify-center w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          aria-label={`Play: ${title}`}
        >
          {/* Thumbnail */}
          <img
            src={thumb}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />

          {/* Dark overlay */}
          <span className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/50 transition-colors" />

          {/* Play button */}
          <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-sky-500 shadow-lg group-hover:bg-sky-400 transition-colors">
            <svg
              className="h-7 w-7 translate-x-0.5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>

          {/* Duration badge */}
          {duration && (
            <span className="absolute bottom-3 right-3 z-10 rounded bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-white">
              {duration}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
