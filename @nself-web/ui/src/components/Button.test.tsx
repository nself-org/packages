import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Button } from './Button'

// A1-T03: Button unit tests — all variants × states
// Covers: 5 variants, 3 sizes, loading state (UX-U08), disabled, onNetworkError

describe('Button — variants', () => {
  const variants = ['primary', 'indigo', 'outline', 'ghost', 'soft'] as const

  variants.forEach((variant) => {
    it(`renders ${variant} variant`, () => {
      render(<Button variant={variant}>{variant}</Button>)
      expect(screen.getByRole('button', { name: variant })).toBeInTheDocument()
    })
  })
})

describe('Button — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const

  sizes.forEach((size) => {
    it(`renders size=${size} without error`, () => {
      render(<Button size={size}>Label</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})

describe('Button — active state', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('Button — disabled state', () => {
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Disabled</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('Button — loading state (UX-U08)', () => {
  it('is disabled when loading=true', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders spinner SVG when loading=true', () => {
    const { container } = render(<Button loading>Loading</Button>)
    const svg = container.querySelector('svg.animate-spin')
    expect(svg).toBeInTheDocument()
  })

  it('sets aria-busy when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('is NOT disabled when loading=false', () => {
    render(<Button loading={false}>Not loading</Button>)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('does not render spinner when not loading', () => {
    const { container } = render(<Button>No spinner</Button>)
    expect(container.querySelector('svg.animate-spin')).toBeNull()
  })

  it('shows spinner on all 5 variants while loading', () => {
    const variants = ['primary', 'indigo', 'outline', 'ghost', 'soft'] as const
    variants.forEach((variant) => {
      const { container, unmount } = render(
        <Button variant={variant} loading>Loading</Button>
      )
      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument()
      unmount()
    })
  })
})

describe('Button — onNetworkError callback (UX-U08)', () => {
  it('calls onNetworkError when onClick throws an Error', async () => {
    const error = new Error('Network timeout')
    const onNetworkError = vi.fn()
    const onClick = vi.fn().mockRejectedValue(error)

    render(
      <Button onClick={onClick} onNetworkError={onNetworkError}>
        Submit
      </Button>
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(onNetworkError).toHaveBeenCalledWith(error)
    })
  })

  it('does not call onNetworkError when onClick succeeds', async () => {
    const onNetworkError = vi.fn()
    const onClick = vi.fn().mockResolvedValue(undefined)

    render(
      <Button onClick={onClick} onNetworkError={onNetworkError}>
        Submit
      </Button>
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(onClick).toHaveBeenCalled()
    })
    expect(onNetworkError).not.toHaveBeenCalled()
  })
})

describe('Button — loading × sizes grid', () => {
  const sizes = ['sm', 'md', 'lg'] as const

  sizes.forEach((size) => {
    it(`loading spinner renders for size=${size}`, () => {
      const { container } = render(<Button size={size} loading>Loading</Button>)
      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument()
    })
  })
})
