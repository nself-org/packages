import type { Meta, StoryObj } from '@storybook/react'
import { Section } from './Section'

const meta: Meta<typeof Section> = {
  title: 'Layout/Section',
  component: Section,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Section>

export const WithEyebrowTitleSubtitle: Story = {
  args: {
    eyebrow: 'Why ɳSelf',
    title: 'Free forever. And by free, we mean the whole thing.',
    subtitle:
      'Not a trial. Not a nerfed community edition. The entire core is MIT — use it in production, modify it, sell things built on top of it.',
    children: (
      <div className="h-32 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 text-sm">
        Section content slot
      </div>
    ),
  },
}

export const TitleOnly: Story = {
  args: {
    title: 'A section with no eyebrow',
    children: (
      <div className="h-24 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 text-sm">
        Children slot
      </div>
    ),
  },
}

export const ContentOnly: Story = {
  args: {
    children: (
      <div className="h-24 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 text-sm">
        No heading — content only
      </div>
    ),
  },
}

export const WithId: Story = {
  args: {
    id: 'products',
    eyebrow: 'Products',
    title: 'Run the whole thing — or just use our apps.',
    children: (
      <div className="h-32 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 text-sm">
        Anchored by id="products"
      </div>
    ),
  },
}
