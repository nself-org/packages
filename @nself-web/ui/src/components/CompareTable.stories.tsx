import type { Meta, StoryObj } from '@storybook/react'
import { CompareTable } from './CompareTable'

const meta: Meta<typeof CompareTable> = {
  title: 'Layout/CompareTable',
  component: CompareTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof CompareTable>

const backendColumns = [
  { key: 'nself', label: 'ɳSelf', highlight: true },
  { key: 'supabase', label: 'Supabase', url: 'https://supabase.com' },
  { key: 'firebase', label: 'Firebase', url: 'https://firebase.google.com' },
  { key: 'nhost', label: 'Nhost', url: 'https://nhost.io' },
]

const backendRows = [
  {
    feature: '100% FOSS core',
    values: { nself: 'Yes', supabase: 'Partial', firebase: 'No', nhost: 'Partial' },
  },
  {
    feature: 'Self-hosted',
    values: { nself: 'Yes', supabase: 'Limited', firebase: 'No', nhost: 'Limited' },
  },
  {
    feature: 'Data ownership',
    values: { nself: '100%', supabase: 'Shared', firebase: 'Google', nhost: 'Shared' },
  },
  {
    feature: 'Production cost',
    values: { nself: '$0 + VPS', supabase: '$25/mo+', firebase: 'Pay per use', nhost: '$25/mo+' },
  },
  {
    feature: 'Free plugins',
    values: { nself: '25', supabase: '~5 ext', firebase: 'A few', nhost: '~3' },
  },
  {
    feature: 'Vendor lock-in',
    values: { nself: 'None', supabase: 'Moderate', firebase: 'High', nhost: 'Moderate' },
  },
  {
    feature: 'Built-in AI assistant',
    values: { nself: 'ɳClaw', supabase: 'No', firebase: 'No', nhost: 'No' },
  },
]

export const BackendComparison: Story = {
  args: {
    columns: backendColumns,
    rows: backendRows,
    footerNote: (
      <>
        Last verified April 2026. Competitor facts sourced from public docs and pricing pages.{' '}
        <a
          href="https://github.com/nself-org/cli/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 dark:text-sky-400 hover:underline"
        >
          Open an issue
        </a>{' '}
        if something looks wrong.
      </>
    ),
  },
}

export const SmallMatrix: Story = {
  args: {
    columns: [
      { key: 'us', label: 'ɳSelf', highlight: true },
      { key: 'them', label: 'Competitor' },
    ],
    rows: [
      { feature: 'Open source', values: { us: 'Yes', them: 'Partial' } },
      { feature: 'Self-hostable', values: { us: 'Yes', them: 'No' } },
      { feature: 'Plugin system', values: { us: 'Yes', them: 'Limited' } },
    ],
  },
}

export const AllCellTypes: Story = {
  name: 'Cell value types — Yes/No/Limited/Partial/Text/None',
  args: {
    columns: [
      { key: 'a', label: 'Column A', highlight: true },
      { key: 'b', label: 'Column B' },
    ],
    rows: [
      { feature: 'Yes / No', values: { a: 'Yes', b: 'No' } },
      { feature: 'Limited / Partial', values: { a: 'Limited', b: 'Partial' } },
      { feature: 'None', values: { a: 'None', b: 'High' } },
      { feature: 'Free text', values: { a: '$0 + VPS', b: '$25/mo+' } },
    ],
  },
}
