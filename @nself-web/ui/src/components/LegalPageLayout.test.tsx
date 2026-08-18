import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LegalPageLayout } from './LegalPageLayout'

// A1-T08: LegalPageLayout unit tests
// CR acceptance criteria: TOC generation does not break on empty children.

describe('LegalPageLayout — rendering', () => {
  it('renders the document title as h1', () => {
    render(
      <LegalPageLayout title="Terms of Service">
        <p>Content</p>
      </LegalPageLayout>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeInTheDocument()
  })

  it('renders lastUpdated when provided', () => {
    render(
      <LegalPageLayout title="Privacy Policy" lastUpdated="2026-04-01">
        <p>Content</p>
      </LegalPageLayout>,
    )
    expect(screen.getByText('2026-04-01')).toBeInTheDocument()
  })

  it('does not render lastUpdated element when omitted', () => {
    render(
      <LegalPageLayout title="DPA">
        <p>Content</p>
      </LegalPageLayout>,
    )
    expect(screen.queryByText(/Last updated/)).not.toBeInTheDocument()
  })

  it('renders children inside the content area', () => {
    render(
      <LegalPageLayout title="Terms">
        <p data-testid="legal-para">This is legal text.</p>
      </LegalPageLayout>,
    )
    expect(screen.getByTestId('legal-para')).toBeInTheDocument()
  })
})

describe('LegalPageLayout — TOC navigation', () => {
  it('renders table of contents nav', () => {
    render(
      <LegalPageLayout title="Terms">
        <h2 id="definitions">Definitions</h2>
        <p>Text</p>
      </LegalPageLayout>,
    )
    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument()
  })

  it('renders TOC link for each tocItems prop entry', () => {
    render(
      <LegalPageLayout
        title="Privacy"
        tocItems={[
          { id: 'data-collection', label: 'Data Collection' },
          { id: 'your-rights', label: 'Your Rights' },
        ]}
      >
        <p>Content</p>
      </LegalPageLayout>,
    )
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('#data-collection')
    expect(hrefs).toContain('#your-rights')
    expect(screen.getByText('Data Collection')).toBeInTheDocument()
    expect(screen.getByText('Your Rights')).toBeInTheDocument()
  })

  it('does not crash on empty children (no headings)', () => {
    render(
      <LegalPageLayout title="Empty Doc">
        {/* intentionally no children / headings */}
      </LegalPageLayout>,
    )
    // TOC nav still renders — just with no items (graceful empty state)
    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument()
  })

  it('does not crash when tocItems is an empty array', () => {
    render(
      <LegalPageLayout title="Empty TOC" tocItems={[]}>
        <p>Content</p>
      </LegalPageLayout>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Empty TOC' })).toBeInTheDocument()
  })

  it('TOC links have correct href anchors', () => {
    render(
      <LegalPageLayout
        title="DPA"
        tocItems={[{ id: 'section-one', label: 'Section One' }]}
      >
        <h2 id="section-one">Section One</h2>
      </LegalPageLayout>,
    )
    const link = screen.getByRole('link', { name: 'Section One' })
    expect(link).toHaveAttribute('href', '#section-one')
  })
})

describe('LegalPageLayout — custom className', () => {
  it('applies custom className to the outer wrapper', () => {
    const { container } = render(
      <LegalPageLayout title="Terms" className="test-legal-class">
        <p>Content</p>
      </LegalPageLayout>,
    )
    expect(container.firstChild).toHaveClass('test-legal-class')
  })
})
