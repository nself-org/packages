import type { Meta, StoryObj } from '@storybook/react'
import { Footer } from './Footer'

const meta: Meta<typeof Footer> = {
  title: 'Shell/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0F0F1A' },
        { name: 'light', value: '#f8fafc' },
      ],
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const StatusOk: Story = {
  name: 'Status pill — ok (green)',
  args: {
    statusPill: { label: 'All systems operational', state: 'ok', href: '/status' },
  },
}

export const StatusDegraded: Story = {
  name: 'Status pill — degraded (amber)',
  args: {
    statusPill: { label: 'Degraded performance', state: 'degraded', href: '/status' },
  },
}

export const StatusDown: Story = {
  name: 'Status pill — down (red)',
  args: {
    statusPill: { label: 'Service disruption', state: 'down', href: '/status' },
  },
}

export const NoStatus: Story = {
  name: 'Without status pill',
  args: {
    statusPill: null,
  },
}

export const NoSocial: Story = {
  name: 'Without social links',
  args: {
    social: null,
  },
}

export const CustomLinkGroups: Story = {
  name: 'Custom link groups (3-col)',
  args: {
    linkGroups: [
      {
        title: 'Product',
        links: [
          { label: 'Docs', href: 'https://nself.org/docs', external: true },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Changelog', href: '/changelog' },
        ],
      },
      {
        title: 'Community',
        links: [
          { label: 'GitHub', href: 'https://github.com/nself-org/cli', external: true },
          { label: 'Discord', href: 'https://discord.gg/nself', external: true },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'MIT License', href: '/license' },
          { label: 'Privacy', href: '/privacy' },
        ],
      },
    ],
  },
}
