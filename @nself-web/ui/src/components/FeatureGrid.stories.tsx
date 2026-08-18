import type { Meta, StoryObj } from '@storybook/react'
import { FeatureGrid } from './FeatureGrid'

const checkIcon = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
)

const lockIcon = (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
)

const terminalIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9l3 3-3 3M13 15h5" />
  </svg>
)

const sparkleIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2zm7 11l.9 2.7L22 16l-2.1.7L19 20l-.9-3.3L16 16l2.1-.7L19 13zm-15 2l.6 1.7L6 17l-1.4.5L4 19l-.6-1.5L2 17l1.4-.3L4 15z" />
  </svg>
)

const sampleFeatures = [
  {
    icon: checkIcon,
    title: '100% MIT licensed',
    description: 'The CLI, the admin UI, every core service, and all 25 free plugins. Fork it, embed it, sell it.',
    tone: 'green' as const,
  },
  {
    icon: lockIcon,
    title: 'Your server. Your data.',
    description: 'A $5 VPS, your Kubernetes cluster, or an air-gapped box in a closet. Nothing phones home.',
    tone: 'sky' as const,
  },
  {
    icon: terminalIcon,
    title: 'One CLI, fully wired',
    description: 'Postgres, Hasura, Auth, Storage, Nginx, and monitoring — generated, healthy, and behind HTTPS.',
    tone: 'indigo' as const,
  },
  {
    icon: sparkleIcon,
    title: 'Plugins, not a fork',
    description: 'Extend without touching core. 25 free plugins cover auth, search, flags, jobs, webhooks.',
    tone: 'purple' as const,
  },
]

const meta: Meta<typeof FeatureGrid> = {
  title: 'Layout/FeatureGrid',
  component: FeatureGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof FeatureGrid>

export const FourColumns: Story = {
  args: {
    columns: 4,
    features: sampleFeatures,
  },
}

export const ThreeColumns: Story = {
  args: {
    columns: 3,
    features: sampleFeatures.slice(0, 3),
  },
}

export const TwoColumns: Story = {
  args: {
    columns: 2,
    features: sampleFeatures.slice(0, 2),
  },
}

export const AllTones: Story = {
  args: {
    columns: 4,
    features: [
      { icon: checkIcon, title: 'Green', description: 'tone="green"', tone: 'green' },
      { icon: lockIcon, title: 'Sky', description: 'tone="sky"', tone: 'sky' },
      { icon: terminalIcon, title: 'Indigo', description: 'tone="indigo"', tone: 'indigo' },
      { icon: sparkleIcon, title: 'Purple', description: 'tone="purple"', tone: 'purple' },
      { icon: checkIcon, title: 'Amber', description: 'tone="amber"', tone: 'amber' },
      { icon: lockIcon, title: 'Rose', description: 'tone="rose"', tone: 'rose' },
      { icon: terminalIcon, title: 'Slate', description: 'tone="slate"', tone: 'slate' },
    ],
  },
}
