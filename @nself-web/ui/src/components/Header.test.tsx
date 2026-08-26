import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'

// Regression test: the brand link's accessible name must follow the
// `brandLabel` prop so consumers (e.g. ntask) can announce their own
// product name instead of the hardcoded "ɳSelf home" default.

describe('Header — brand link accessible name', () => {
  it('defaults to "ɳSelf home" when brandLabel is not set', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: 'ɳSelf home' })).toBeInTheDocument()
  })

  it('uses brandLabel when provided by a consumer', () => {
    render(<Header brandLabel="ɳTask home" />)
    expect(screen.getByRole('link', { name: 'ɳTask home' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'ɳSelf home' })).not.toBeInTheDocument()
  })
})
