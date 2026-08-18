import * as React from 'react'
import { cn } from '../lib/cn'

// A1-T04: CompareTable — competitor comparison matrix.
// Source: web-org-redesign-2026-04-25/src/pages1.jsx (ComparePage, home.jsx comparison section)

export interface CompareColumn {
  /** Unique key used to look up cell values */
  key: string
  /** Display label in the header row */
  label: string
  /** When true, column is styled as "us" — sky accent, font-semibold cells */
  highlight?: boolean
  /** Optional URL — makes the label a link */
  url?: string
}

export interface CompareRow {
  /** Row label displayed in the first (sticky) column */
  feature: string
  /** Map from column.key → cell value */
  values: Record<string, string>
}

export interface CompareTableProps {
  /** Column definitions (first column is auto-generated as the feature label) */
  columns: CompareColumn[]
  /** Data rows */
  rows: CompareRow[]
  /** Footer note — small text below the table */
  footerNote?: React.ReactNode
  /** Additional className on the outer wrapper */
  className?: string
}

/** Renders a table cell value with semantic colours */
function CellValue({ value, highlight }: { value: string; highlight: boolean }) {
  if (value === 'Yes') {
    return (
      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
        ✓ Yes
      </span>
    )
  }
  if (value === 'No') {
    return <span className="text-slate-400 dark:text-slate-500">— No</span>
  }
  if (value === 'Limited' || value === 'Partial') {
    return (
      <span className="text-amber-600 dark:text-amber-400">◐ {value}</span>
    )
  }
  if (value === 'None') {
    return (
      <span className="text-emerald-600 dark:text-emerald-400">{value}</span>
    )
  }
  return (
    <span
      className={cn(
        highlight
          ? 'font-semibold text-slate-900 dark:text-white'
          : 'text-slate-600 dark:text-slate-400',
      )}
    >
      {value}
    </span>
  )
}

const externalIcon = (
  <svg
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="inline-block w-3 h-3 opacity-60 ml-0.5"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
    />
  </svg>
)

export function CompareTable({ columns, rows, footerNote, className }: CompareTableProps) {
  return (
    <div className={cn('', className)}>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/[0.03]">
            <tr>
              {/* Feature label column header (empty) */}
              <th
                scope="col"
                className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white sticky left-0 bg-slate-50 dark:bg-[#131322]"
              />
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-center font-semibold',
                    col.highlight
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-slate-600 dark:text-slate-400',
                  )}
                >
                  {col.url ? (
                    <a
                      href={col.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      {col.label}
                      {!col.highlight && externalIcon}
                    </a>
                  ) : (
                    col.label
                  )}
                  {col.highlight && (
                    <div className="text-[10px] font-normal opacity-70 normal-case tracking-normal">
                      (us)
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-transparent">
            {rows.map((row) => (
              <tr key={row.feature}>
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-brand-bg">
                  {row.feature}
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-center">
                    <CellValue
                      value={row.values[col.key] ?? '—'}
                      highlight={!!col.highlight}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footerNote && (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">{footerNote}</p>
      )}
    </div>
  )
}
