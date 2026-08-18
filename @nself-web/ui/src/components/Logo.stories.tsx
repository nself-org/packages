import type { Meta, StoryObj } from '@storybook/react'
import { Logo } from './Logo'

const meta: Meta<typeof Logo> = {
  title: 'Shell/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0F0F1A' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    className: 'h-8 w-auto',
    withCli: true,
  },
  render: (args) => (
    <div className="text-white">
      <Logo {...args} />
    </div>
  ),
}

export const WithoutCli: Story = {
  args: {
    className: 'h-8 w-auto',
    withCli: false,
  },
  render: (args) => (
    <div className="text-white">
      <Logo {...args} />
    </div>
  ),
}

export const LargeLight: Story = {
  name: 'Large (light background)',
  parameters: {
    backgrounds: { default: 'light' },
  },
  render: () => (
    <div className="text-slate-900">
      <Logo className="h-12 w-auto" withCli />
    </div>
  ),
}

export const SmallDark: Story = {
  name: 'Small (dark background)',
  render: () => (
    <div className="text-white">
      <Logo className="h-6 w-auto" withCli />
    </div>
  ),
}
