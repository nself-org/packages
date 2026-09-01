import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
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
    variant: {
      control: 'select',
      options: ['primary', 'indigo', 'outline', 'ghost', 'soft'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// ── Default (primary / md / active) ──────────────────────────────────────────

export const Default: Story = {
  args: {
    children: 'Get started',
    variant: 'primary',
    size: 'md',
  },
}

// ── All 5 Variants ────────────────────────────────────────────────────────────

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Button variant="primary">Primary</Button>
      <Button variant="indigo">Indigo</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="soft">Soft</Button>
    </div>
  ),
}

// ── Sizes ─────────────────────────────────────────────────────────────────────

export const AllSizes: Story = {
  name: 'All sizes',
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

// ── Loading state (UX-U08) ────────────────────────────────────────────────────

export const Loading: Story = {
  name: 'Loading (UX-U08)',
  args: {
    children: 'Submitting…',
    loading: true,
    variant: 'primary',
  },
}

export const LoadingAllVariants: Story = {
  name: 'Loading — all variants',
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Button variant="primary" loading>Primary</Button>
      <Button variant="indigo" loading>Indigo</Button>
      <Button variant="outline" loading>Outline</Button>
      <Button variant="ghost" loading>Ghost</Button>
      <Button variant="soft" loading>Soft</Button>
    </div>
  ),
}

export const LoadingAllSizes: Story = {
  name: 'Loading — all sizes',
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Button size="sm" loading>Small</Button>
      <Button size="md" loading>Medium</Button>
      <Button size="lg" loading>Large</Button>
    </div>
  ),
}

// ── Disabled state ────────────────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
    variant: 'primary',
  },
}

export const DisabledAllVariants: Story = {
  name: 'Disabled — all variants',
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Button variant="primary" disabled>Primary</Button>
      <Button variant="indigo" disabled>Indigo</Button>
      <Button variant="outline" disabled>Outline</Button>
      <Button variant="ghost" disabled>Ghost</Button>
      <Button variant="soft" disabled>Soft</Button>
    </div>
  ),
}

// ── onNetworkError callback (UX-U08) ─────────────────────────────────────────

export const NetworkErrorCallback: Story = {
  name: 'Network error callback (UX-U08)',
  render: () => (
    <Button
      variant="primary"
      onClick={async () => {
        await new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 800)
        )
      }}
      onNetworkError={(err) => {
        // In production: parent calls <Toast type="error" message={err.message} />
        alert(`onNetworkError triggered: ${err.message}`)
      }}
    >
      Simulate network error
    </Button>
  ),
}

// ── Full 5×3 grid ─────────────────────────────────────────────────────────────

export const FullGrid: Story = {
  name: 'Full 5 × 3 grid (variants × sizes)',
  render: () => (
    <div className="overflow-auto">
      <table className="border-collapse text-xs text-slate-400">
        <thead>
          <tr>
            <th className="p-2 text-left font-normal">variant \\ size</th>
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <th key={s} className="p-2 font-normal">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(['primary', 'indigo', 'outline', 'ghost', 'soft'] as const).map((v) => (
            <tr key={v}>
              <td className="p-2 pr-4">{v}</td>
              {(['sm', 'md', 'lg'] as const).map((s) => (
                <td key={s} className="p-2">
                  <Button variant={v} size={s}>{v}</Button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}
