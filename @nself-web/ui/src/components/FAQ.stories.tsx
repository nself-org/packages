import type { Meta, StoryObj } from '@storybook/react'
import { FAQ } from './FAQ'

const meta: Meta<typeof FAQ> = {
  title: 'Layout/FAQ',
  component: FAQ,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof FAQ>

const pricingFaq = [
  {
    question: 'Can I really use nSelf commercially for free?',
    answer:
      'Yes. The CLI and every free plugin are MIT licensed. You can build a commercial product on top of nSelf, charge your customers, and owe us nothing. Revenue is from optional paid plugin bundles and ɳSelf+.',
  },
  {
    question: 'What happens if I cancel my bundle subscription?',
    answer:
      'Your license key becomes inactive. The CLI will warn on the next build. Pro plugins stop loading. Your data and schema are untouched — you can re-subscribe at any time to re-activate.',
  },
  {
    question: 'Is ɳSelf+ billed monthly or yearly?',
    answer:
      'Both. $3.99/mo or $39.99/yr. Annual saves about 16% vs monthly — that is roughly two months free.',
  },
  {
    question: 'Do I need a server to use nSelf?',
    answer:
      'For self-hosting: yes — any Linux VPS with Docker installed. We run fine on a $5/mo DigitalOcean droplet. For hosted apps (ɳTask, ɳChat at chat.nself.org): no — just sign up.',
  },
  {
    question: 'What is the difference between ɳSelf and ɳCloud?',
    answer:
      'ɳSelf is the open-source CLI stack you run on your own server. ɳCloud is our managed hosting where we run the stack for you — billed separately as management fee plus at-cost infrastructure.',
  },
]

export const Default: Story = {
  args: {
    items: pricingFaq,
    heading: 'Frequently asked questions',
  },
}

export const NoHeading: Story = {
  args: {
    items: pricingFaq.slice(0, 3),
    heading: null,
  },
}

export const SingleItem: Story = {
  args: {
    items: [
      {
        question: 'Is nSelf free forever?',
        answer:
          'Yes. The core CLI and 25 free plugins are MIT licensed and free forever. Optional paid plugin bundles start at $0.99/mo.',
      },
    ],
  },
}

export const WithRichAnswer: Story = {
  args: {
    heading: 'Using rich answer content',
    items: [
      {
        question: 'How do I install nSelf?',
        answer: (
          <div className="space-y-2">
            <p>Run the one-liner installer:</p>
            <code className="block rounded bg-slate-100 dark:bg-white/10 px-3 py-2 font-mono text-xs">
              curl -sSL https://install.nself.org | bash
            </code>
            <p>
              Or via Homebrew:{' '}
              <code className="font-mono text-xs bg-slate-100 dark:bg-white/10 px-1 rounded">
                brew install nself
              </code>
            </p>
          </div>
        ),
      },
    ],
  },
}
