import type { ProductConfig } from './colors'

interface OgTemplateProps {
  title: string
  breadcrumb?: string
  config: ProductConfig
}

// Safe zone is 1100x580 for LinkedIn crop — all text stays within this area.
// 1200x630 is the canonical OG dimension for Twitter/Facebook.
export function OgTemplate({ title, breadcrumb, config }: OgTemplateProps) {
  // Truncate title to prevent overflow — Satori does not ellipsis automatically
  const displayTitle =
    title.length > 80 ? title.slice(0, 77) + '...' : title

  return (
    <div
      style={{
        background: '#030712',    // gray-950
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
      }}
    >
      {/* Left accent bar — 8px wide, full height */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          background: config.accent,
        }}
      />

      {/* Main content area — inset from accent bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 64px 52px 80px',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Top: logo mark */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.5px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            ɳSelf
          </span>
        </div>

        {/* Center: page title + breadcrumb */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 960,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              // Clamp to 2 lines max (112px at line-height 1.1)
              maxHeight: 134,
              overflow: 'hidden',
            }}
          >
            {displayTitle}
          </div>
          {breadcrumb && (
            <div
              style={{
                fontSize: 22,
                color: '#9ca3af',   // gray-400
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              {breadcrumb}
            </div>
          )}
        </div>

        {/* Bottom: product wordmark (right) + domain label (left) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: '#6b7280',   // gray-500
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            nself.org
          </span>

          <div
            style={{
              background: config.accentAlpha,
              border: `1px solid ${config.accentBorder}`,
              borderRadius: 24,
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: config.accentText,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              {config.wordmark}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
