import type { Meta, StoryObj } from '@storybook/react'
import { Pill } from './Pill'

const meta: Meta<typeof Pill> = {
  title: 'UI/Pill',
  component: Pill,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0F0F1A' },
        { name: 'light', value: '#f8fafc' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['sky', 'indigo', 'green', 'purple', 'amber', 'rose', 'slate'],
    },
    variant: {
      control: 'select',
      options: ['solid', 'outlined'],
    },
    children: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// ── Default ───────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    children: 'v1.0.12',
    tone: 'sky',
    variant: 'solid',
  },
}

// ── All 7 tones — solid ───────────────────────────────────────────────────────

export const AllTonesSolid: Story = {
  name: 'All tones — solid',
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Pill tone="sky" variant="solid">sky</Pill>
      <Pill tone="indigo" variant="solid">indigo</Pill>
      <Pill tone="green" variant="solid">green</Pill>
      <Pill tone="purple" variant="solid">purple</Pill>
      <Pill tone="amber" variant="solid">amber</Pill>
      <Pill tone="rose" variant="solid">rose</Pill>
      <Pill tone="slate" variant="solid">slate</Pill>
    </div>
  ),
}

// ── All 7 tones — outlined ────────────────────────────────────────────────────

export const AllTonesOutlined: Story = {
  name: 'All tones — outlined',
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Pill tone="sky" variant="outlined">sky</Pill>
      <Pill tone="indigo" variant="outlined">indigo</Pill>
      <Pill tone="green" variant="outlined">green</Pill>
      <Pill tone="purple" variant="outlined">purple</Pill>
      <Pill tone="amber" variant="outlined">amber</Pill>
      <Pill tone="rose" variant="outlined">rose</Pill>
      <Pill tone="slate" variant="outlined">slate</Pill>
    </div>
  ),
}

// ── Full 7×2 grid ─────────────────────────────────────────────────────────────

export const FullGrid: Story = {
  name: 'Full 7 × 2 grid (tones × variants)',
  render: () => (
    <div className="flex flex-col gap-3">
      {(['sky', 'indigo', 'green', 'purple', 'amber', 'rose', 'slate'] as const).map((tone) => (
        <div key={tone} className="flex items-center gap-3">
          <Pill tone={tone} variant="solid">{tone}</Pill>
          <Pill tone={tone} variant="outlined">{tone} outlined</Pill>
        </div>
      ))}
    </div>
  ),
}

// ── Semantic usage examples ───────────────────────────────────────────────────

export const SemanticExamples: Story = {
  name: 'Semantic examples',
  render: () => (
    <div className="flex flex-wrap gap-2 items-center">
      <Pill tone="sky" variant="outlined">v1.0.12</Pill>
      <Pill tone="green" variant="solid">MIT</Pill>
      <Pill tone="indigo" variant="solid">AI</Pill>
      <Pill tone="amber" variant="solid">Beta</Pill>
      <Pill tone="rose" variant="solid">Deprecated</Pill>
      <Pill tone="slate" variant="solid">Planned</Pill>
      <Pill tone="purple" variant="solid">Pro</Pill>
    </div>
  ),
}
