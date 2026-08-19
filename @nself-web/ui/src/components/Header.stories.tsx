import type { Meta, StoryObj } from '@storybook/react'
import { Header } from './Header'

const meta: Meta<typeof Header> = {
  title: 'Shell/Header',
  component: Header,
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
  args: {
    currentPath: undefined,
    githubStars: 342,
  },
}

export const WithActivePath: Story = {
  name: 'With active path (/pricing)',
  args: {
    currentPath: '/pricing',
    githubStars: 342,
  },
}

export const WithAccountButton: Story = {
  name: 'With AccountButton slot',
  args: {
    githubStars: 342,
    accountButton: (
      <div className="hidden md:inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white">
        Sign in
      </div>
    ),
  },
}

export const NoGitHub: Story = {
  name: 'Without GitHub badge',
  args: {
    githubUrl: undefined,
    githubStars: null,
  },
}

export const NoChat: Story = {
  name: 'Without chat link',
  args: {
    chatUrl: null,
    githubStars: 342,
  },
}

export const SkipToContentVisible: Story = {
  name: 'Skip-to-content (UX-U19) — focus the header to reveal',
  parameters: {
    docs: {
      description: {
        story:
          'The skip-to-content link is visually hidden but visible on keyboard focus (Tab). ' +
          'Press Tab after clicking the story to reveal it.',
      },
    },
  },
  args: {
    githubStars: 342,
  },
}
