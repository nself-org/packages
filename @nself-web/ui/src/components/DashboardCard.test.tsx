import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardCard } from './DashboardCard'

// A1-T08: DashboardCard unit tests
// Reviewer note (Wave 3): layout components need tests in this wave.

describe('DashboardCard — rendering', () => {
  it('renders the title', () => {
    render(<DashboardCard title="Plugin Usage" />)
    expect(screen.getByRole('heading', { name: 'Plugin Usage' })).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<DashboardCard title="Usage" subtitle="Your monthly plugin summary" />)
    expect(screen.getByText('Your monthly plugin summary')).toBeInTheDocument()
  })

  it('does not render subtitle element when omitted', () => {
    render(<DashboardCard title="Usage" />)
    expect(screen.queryByText(/Your monthly/)).not.toBeInTheDocument()
  })
})

describe('DashboardCard — icon slot', () => {
  it('renders icon when provided', () => {
    render(<DashboardCard title="Usage" icon={<span data-testid="icon">★</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('does not crash when icon is omitted', () => {
    render(<DashboardCard title="Usage" />)
    expect(screen.getByRole('heading', { name: 'Usage' })).toBeInTheDocument()
  })
})

describe('DashboardCard — action slot', () => {
  it('renders action when provided', () => {
    render(<DashboardCard title="Usage" action={<button>Manage</button>} />)
    expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument()
  })

  it('does not render action wrapper when action is omitted', () => {
    const { container } = render(<DashboardCard title="Usage" />)
    // No flex justify-end div when action is absent
    expect(container.querySelector('.mt-5.flex')).not.toBeInTheDocument()
  })
})

describe('DashboardCard — status dot', () => {
  it('renders status role when status provided', () => {
    render(<DashboardCard title="Service" status="ok" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: ok')
  })

  it('renders warn status', () => {
    render(<DashboardCard title="Service" status="warn" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: warn')
  })

  it('renders error status', () => {
    render(<DashboardCard title="Service" status="error" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: error')
  })

  it('does not render status dot when status is omitted', () => {
    render(<DashboardCard title="Service" />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('DashboardCard — children', () => {
  it('renders children when provided', () => {
    render(
      <DashboardCard title="Stats">
        <span data-testid="child">42 active licenses</span>
      </DashboardCard>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})

describe('DashboardCard — custom className', () => {
  it('applies custom className to root element', () => {
    const { container } = render(<DashboardCard title="Usage" className="test-class-xyz" />)
    expect(container.firstChild).toHaveClass('test-class-xyz')
  })
})
