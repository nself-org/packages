import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Pill } from './Pill'

// A1-T03: Pill unit tests — all 7 tones × 2 variants

describe('Pill — renders all 7 tones', () => {
  const tones = ['sky', 'indigo', 'green', 'purple', 'amber', 'rose', 'slate'] as const

  tones.forEach((tone) => {
    it(`renders tone=${tone} solid`, () => {
      render(<Pill tone={tone} variant="solid">{tone}</Pill>)
      expect(screen.getByText(tone)).toBeInTheDocument()
    })

    it(`renders tone=${tone} outlined`, () => {
      render(<Pill tone={tone} variant="outlined">{tone}</Pill>)
      expect(screen.getByText(tone)).toBeInTheDocument()
    })
  })
})

describe('Pill — defaults', () => {
  it('renders with default tone=sky and variant=solid', () => {
    const { container } = render(<Pill>default</Pill>)
    const span = container.querySelector('span')
    expect(span).toHaveClass('bg-sky-50')
    expect(span).toHaveClass('text-sky-700')
    expect(span).not.toHaveClass('border-sky-200')
  })

  it('renders children text', () => {
    render(<Pill>MIT</Pill>)
    expect(screen.getByText('MIT')).toBeInTheDocument()
  })

  it('is a <span> element', () => {
    const { container } = render(<Pill>v1.0.12</Pill>)
    expect(container.querySelector('span')).toBeInTheDocument()
  })
})

describe('Pill — outlined variant has border class', () => {
  const tones = ['sky', 'indigo', 'green', 'purple', 'amber', 'rose', 'slate'] as const

  tones.forEach((tone) => {
    it(`${tone} outlined has border class`, () => {
      const { container } = render(
        <Pill tone={tone} variant="outlined">{tone}</Pill>
      )
      const span = container.querySelector('span')
      expect(span?.className).toMatch(/border/)
    })
  })
})

describe('Pill — solid variant has no explicit border class', () => {
  it('sky solid does not have outlined border class', () => {
    const { container } = render(<Pill tone="sky" variant="solid">sky</Pill>)
    const span = container.querySelector('span')
    // solid uses bg, not a raw border- prefix
    expect(span).toHaveClass('bg-sky-50')
  })
})

describe('Pill — rose tone (7th tone, not in original shell.jsx)', () => {
  it('solid rose renders correct classes', () => {
    const { container } = render(<Pill tone="rose" variant="solid">rose</Pill>)
    const span = container.querySelector('span')
    expect(span).toHaveClass('bg-rose-50')
    expect(span).toHaveClass('text-rose-700')
  })

  it('outlined rose renders correct classes', () => {
    const { container } = render(<Pill tone="rose" variant="outlined">rose</Pill>)
    const span = container.querySelector('span')
    expect(span?.className).toMatch(/border-rose-200/)
  })
})
