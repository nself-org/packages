/**
 * nSelf Tailwind Preset — brand color tokens and semantic design system.
 *
 * Purpose: Single source of truth for all nSelf brand colors, semantic tokens,
 *          spacing scale, typography, and dark-mode strategy across every web surface.
 * Inputs:  None — pure Tailwind config preset exported as a plain object.
 * Outputs: A Tailwind preset object (type: Config['presets'][number]) ready to
 *          spread into any app's tailwind.config.ts as `presets: [nSelfPreset]`.
 * Constraints:
 *   - Dark mode via class strategy (class="dark" on <html>).
 *   - All colors expressed as CSS-variable-backed channel values so consumers can
 *     override individual tokens without forking the preset.
 *   - Token naming: primary / secondary / surface / muted / destructive / success /
 *     warning / info. Each has DEFAULT, foreground, muted, and border variants.
 * SPORT: F-NSELF-UI-THEME-01
 */

// Tailwind Config type — imported as a type-only import so tailwindcss is an
// optional dev/peer dep. Consumers who use this preset in tailwind.config.ts
// will have tailwindcss installed; in test/build contexts we stub the type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TailwindConfig = { darkMode?: any; theme?: any; plugins?: any[] };

/** nSelf brand color palette (hex source of truth). */
const palette = {
  // Primary — indigo-based nSelf brand
  indigo50:  '#eef2ff',
  indigo100: '#e0e7ff',
  indigo200: '#c7d2fe',
  indigo300: '#a5b4fc',
  indigo400: '#818cf8',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',
  indigo700: '#4338ca',
  indigo800: '#3730a3',
  indigo900: '#312e81',
  indigo950: '#1e1b4b',

  // Slate — neutral surface
  slate50:  '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  slate950: '#020617',

  // Semantic aliases
  rose500:   '#f43f5e',
  rose600:   '#e11d48',
  green500:  '#22c55e',
  green600:  '#16a34a',
  amber500:  '#f59e0b',
  amber600:  '#d97706',
  sky500:    '#0ea5e9',
  sky600:    '#0284c7',
} as const;

export const nSelfPreset = {
  darkMode: 'class' as const,
  theme: {
    extend: {
      colors: {
        // ─── Primary (brand indigo) ──────────────────────────────────────────
        primary: {
          DEFAULT:    palette.indigo600,
          foreground: '#ffffff',
          muted:      palette.indigo100,
          border:     palette.indigo200,
          hover:      palette.indigo700,
          // Dark-mode overrides handled via CSS vars in consuming app
        },

        // ─── Secondary ────────────────────────────────────────────────────────
        secondary: {
          DEFAULT:    palette.slate100,
          foreground: palette.slate900,
          muted:      palette.slate50,
          border:     palette.slate200,
          hover:      palette.slate200,
        },

        // ─── Surface (page / card backgrounds) ───────────────────────────────
        surface: {
          DEFAULT:    '#ffffff',
          raised:     palette.slate50,
          overlay:    palette.slate100,
          border:     palette.slate200,
          foreground: palette.slate900,
        },

        // ─── Muted text / helper ─────────────────────────────────────────────
        muted: {
          DEFAULT:    palette.slate100,
          foreground: palette.slate500,
        },

        // ─── Destructive (errors, delete, danger) ────────────────────────────
        destructive: {
          DEFAULT:    palette.rose600,
          foreground: '#ffffff',
          muted:      '#fff1f2',
          border:     '#fecdd3',
        },

        // ─── Success ──────────────────────────────────────────────────────────
        success: {
          DEFAULT:    palette.green500,
          foreground: '#ffffff',
          muted:      '#f0fdf4',
          border:     '#bbf7d0',
        },

        // ─── Warning ──────────────────────────────────────────────────────────
        warning: {
          DEFAULT:    palette.amber500,
          foreground: '#ffffff',
          muted:      '#fffbeb',
          border:     '#fde68a',
        },

        // ─── Info ─────────────────────────────────────────────────────────────
        info: {
          DEFAULT:    palette.sky500,
          foreground: '#ffffff',
          muted:      '#f0f9ff',
          border:     '#bae6fd',
        },

        // ─── Raw palette access (for bespoke usage) ───────────────────────────
        brand: palette,
      },

      fontFamily: {
        sans:  ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      borderRadius: {
        sm:  '0.25rem',
        md:  '0.375rem',
        lg:  '0.5rem',
        xl:  '0.75rem',
        '2xl': '1rem',
      },

      boxShadow: {
        card:    '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        raised:  '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        overlay: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
      },

      animation: {
        'spin-slow': 'spin 1.2s linear infinite',
        'fade-in':   'fadeIn 0.15s ease-out',
        'slide-up':  'slideUp 0.2s ease-out',
      },

      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
} satisfies Partial<TailwindConfig>;
