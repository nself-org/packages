import type { Meta, StoryObj } from '@storybook/react'
import { DashboardCard } from './DashboardCard'

// A1-T08: DashboardCard stories

const meta: Meta<typeof DashboardCard> = {
  title: 'Dashboard/DashboardCard',
  component: DashboardCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DashboardCard>

// Story icon components (inline SVGs for self-contained stories)
const BoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
)

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

export const Default: Story = {
  args: {
    title: 'Plugin Usage',
    subtitle: '3 of 7 plugins active this month',
    icon: <BoxIcon />,
  },
}

export const WithAction: Story = {
  args: {
    title: 'Active License',
    subtitle: 'ɳSelf+ — expires 2027-04-01',
    icon: <ZapIcon />,
    action: (
      <button className="text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
        Manage →
      </button>
    ),
  },
}

export const StatusOk: Story = {
  args: {
    title: 'Backend Health',
    subtitle: 'All services operational',
    status: 'ok',
    icon: <BoxIcon />,
  },
}

export const StatusWarn: Story = {
  args: {
    title: 'Storage',
    subtitle: 'Disk at 78% — consider expanding',
    status: 'warn',
    icon: <BoxIcon />,
  },
}

export const StatusError: Story = {
  args: {
    title: 'Auth Service',
    subtitle: 'Service unreachable',
    status: 'error',
    icon: <BoxIcon />,
  },
}

export const WithChildren: Story = {
  args: {
    title: 'Monthly Requests',
    subtitle: 'API call breakdown',
    icon: <ZapIcon />,
    children: (
      <div className="mt-2 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">GraphQL</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">12,845</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">REST</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">4,201</span>
        </div>
      </div>
    ),
  },
}

export const MinimalNoIcon: Story = {
  args: {
    title: 'Quick Note',
    subtitle: 'No icon provided — layout should still hold.',
  },
}

export const GridExample: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <DashboardCard
        title="Plugins"
        subtitle="7 active"
        icon={<BoxIcon />}
        status="ok"
        action={
          <button className="text-xs text-sky-600 hover:underline dark:text-sky-400">
            Manage
          </button>
        }
      />
      <DashboardCard
        title="Storage"
        subtitle="78% used"
        icon={<BoxIcon />}
        status="warn"
      />
      <DashboardCard
        title="Auth"
        subtitle="Service error"
        icon={<ZapIcon />}
        status="error"
      />
    </div>
  ),
}
