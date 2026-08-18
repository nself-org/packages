import type { Meta, StoryObj } from '@storybook/react'
import { HeroBlock } from './HeroBlock'
import { Pill } from './Pill'

const meta: Meta<typeof HeroBlock> = {
  title: 'Layout/HeroBlock',
  component: HeroBlock,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof HeroBlock>

export const Default: Story = {
  args: {
    pills: (
      <>
        <Pill tone="green">100% Open Source</Pill>
        <Pill tone="slate">MIT licensed · v1.0.12</Pill>
      </>
    ),
    headline: (
      <>
        Own your stack.{' '}
        <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
          Ship anything.
        </span>
      </>
    ),
    subtitle:
      'The entire backend Supabase, Firebase, and Nhost charge you for — Postgres, GraphQL, Auth, Storage, Nginx, monitoring — shipped as one MIT-licensed CLI. 25 free plugins in the box.',
    ctas: [
      { label: 'Get started — free forever', href: 'https://nself.org/docs/quick-start', variant: 'primary', external: true },
      { label: 'Star on GitHub · 342', href: 'https://github.com/nself-org/cli', variant: 'ghost', external: true },
    ],
    stats: [
      { value: '93', label: 'total plugins' },
      { value: '47', label: 'CLI commands' },
      { value: '8', label: 'cloud providers' },
      { value: '$0', label: 'forever' },
    ],
  },
}

export const WithDemoSlot: Story = {
  args: {
    headline: (
      <>
        Own your stack.{' '}
        <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
          Ship anything.
        </span>
      </>
    ),
    subtitle: 'One CLI. Five minutes. Complete production backend.',
    ctas: [
      { label: 'Get started free', href: '#', variant: 'primary' },
    ],
    demoSlot: (
      <div className="h-72 rounded-xl bg-[#0B0B14] border border-slate-800 flex items-center justify-center text-slate-400 text-sm">
        TerminalDemo slot (injected by parent)
      </div>
    ),
  },
}

export const MinimalNoStats: Story = {
  args: {
    headline: 'Own your stack.',
    subtitle: 'MIT licensed. Free forever.',
    ctas: [
      { label: 'Get started', href: '#', variant: 'primary' },
    ],
  },
}
