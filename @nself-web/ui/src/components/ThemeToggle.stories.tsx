import type { Meta, StoryObj } from '@storybook/react'
import { ThemeToggle } from './ThemeToggle'

const meta: Meta<typeof ThemeToggle> = {
  title: 'Shell/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// ThemeToggle is uncontrolled: it cycles system → dark → light via
// next-themes and persists under the nself_theme storage key. Stories can
// only vary the surrounding container styling.

export const OnDarkSurface: Story = {
  name: 'On dark surface',
  parameters: {
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0F0F1A' }] },
  },
  render: () => (
    <div className="dark bg-[#0F0F1A] p-4 rounded-lg">
      <ThemeToggle />
    </div>
  ),
}

export const OnLightSurface: Story = {
  name: 'On light surface',
  parameters: {
    backgrounds: { default: 'light', values: [{ name: 'light', value: '#ffffff' }] },
  },
  render: () => (
    <div className="bg-white p-4 rounded-lg">
      <ThemeToggle />
    </div>
  ),
}

export const WithCustomClass: Story = {
  name: 'Custom className',
  render: () => (
    <div className="bg-white p-4 rounded-lg">
      <ThemeToggle className="h-10 w-10 border border-slate-200" />
    </div>
  ),
}
