/**
 * LiveVersion tests — E1-T06
 *
 * Covers the shared @nself-web/ui LiveVersion component contract:
 *   - GitHub mock 200 → fresh version rendered
 *   - GitHub mock 404 / 5xx / 429 / network error → fallback rendered
 *   - Non-semver tag → fallback (never renders garbage)
 *   - Tag without 'v' prefix → normalised to v-prefixed
 *   - Skeleton rendered as a no-aria-label pulse element
 *
 * Strategy: LiveVersion is an RSC, so we test the awaited element via
 * @testing-library/react render (jsdom env, vitest). The component takes a
 * fetcher prop, so the tests inject mock fetchers — no `fetch` mocking, no
 * network. This keeps tests deterministic and host-agnostic.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  LiveVersion,
  LiveVersionSkeleton,
  FALLBACK_CLI_VERSION,
  normaliseVersionTag,
} from '../LiveVersion'

describe('LiveVersion — fetcher returns valid tag', () => {
  it('renders fresh version when fetcher returns v1.2.3', async () => {
    const element = await LiveVersion({
      fetchVersion: async () => 'v1.2.3',
    })
    render(element)
    expect(screen.getByText('v1.2.3')).toBeInTheDocument()
  })

  it('normalises tag without v-prefix (1.0.12 → v1.0.12)', async () => {
    const element = await LiveVersion({
      fetchVersion: async () => '1.0.12',
    })
    render(element)
    expect(screen.getByText('v1.0.12')).toBeInTheDocument()
  })

  it('accepts pre-release tags (v1.0.12-rc1)', async () => {
    const element = await LiveVersion({
      fetchVersion: async () => 'v1.0.12-rc1',
    })
    render(element)
    expect(screen.getByText('v1.0.12-rc1')).toBeInTheDocument()
  })
})

describe('LiveVersion — fallback paths (UX-U15 graceful degrade)', () => {
  it('renders fallback when fetcher returns null', async () => {
    const element = await LiveVersion({
      fetchVersion: async () => null,
    })
    render(element)
    expect(screen.getByText(FALLBACK_CLI_VERSION)).toBeInTheDocument()
  })

  it('renders fallback when fetcher throws (network / 5xx / 429)', async () => {
    const element = await LiveVersion({
      fetchVersion: async () => {
        throw new Error('GitHub 429 rate limited')
      },
    })
    render(element)
    expect(screen.getByText(FALLBACK_CLI_VERSION)).toBeInTheDocument()
  })

  it('renders fallback when fetcher returns a non-semver tag', async () => {
    const element = await LiveVersion({
      fetchVersion: async () => 'unknownsub_xyz',
    })
    render(element)
    expect(screen.getByText(FALLBACK_CLI_VERSION)).toBeInTheDocument()
  })

  it('renders fallback when fetcher returns empty string', async () => {
    const element = await LiveVersion({
      fetchVersion: async () => '',
    })
    render(element)
    expect(screen.getByText(FALLBACK_CLI_VERSION)).toBeInTheDocument()
  })

  it('renders fallback when no fetcher is provided', async () => {
    const element = await LiveVersion()
    render(element)
    expect(screen.getByText(FALLBACK_CLI_VERSION)).toBeInTheDocument()
  })

  it('uses caller-provided fallbackVersion override', async () => {
    const element = await LiveVersion({
      fetchVersion: async () => null,
      fallbackVersion: 'v9.9.9',
    })
    render(element)
    expect(screen.getByText('v9.9.9')).toBeInTheDocument()
  })
})

describe('LiveVersion — link + accessibility chrome', () => {
  it('wraps the pill in an <a> with default /changelog href', async () => {
    const element = await LiveVersion({
      fetchVersion: async () => 'v1.0.12',
    })
    const { container } = render(element)
    const anchor = container.querySelector('a')
    expect(anchor).toBeInTheDocument()
    expect(anchor).toHaveAttribute('href', '/changelog')
    expect(anchor).toHaveAttribute(
      'aria-label',
      'ɳSelf CLI v1.0.12 — view changelog',
    )
  })

  it('uses caller-provided href when supplied', async () => {
    const element = await LiveVersion({
      fetchVersion: async () => 'v1.0.12',
      href: 'https://github.com/nself-org/cli/releases',
    })
    const { container } = render(element)
    const anchor = container.querySelector('a')
    expect(anchor).toHaveAttribute(
      'href',
      'https://github.com/nself-org/cli/releases',
    )
  })

  it('skeleton is aria-hidden and animates', () => {
    const { container } = render(<LiveVersionSkeleton />)
    const span = container.querySelector('span')
    expect(span).toHaveAttribute('aria-hidden', 'true')
    expect(span?.className).toMatch(/animate-pulse/)
  })
})

describe('normaliseVersionTag', () => {
  it.each([
    ['v1.0.12', 'v1.0.12'],
    ['1.0.12', 'v1.0.12'],
    ['v0.0.1', 'v0.0.1'],
    ['v1.0.0-rc1', 'v1.0.0-rc1'],
    ['v1.0.0-beta.5', 'v1.0.0-beta.5'],
    ['v1.0.0+build.123', 'v1.0.0+build.123'],
  ])('accepts %s → %s', (input, expected) => {
    expect(normaliseVersionTag(input)).toBe(expected)
  })

  it.each([
    [''],
    ['nightly'],
    ['vnext'],
    ['v1'],
    ['v1.0'],
    ['1.0.0.0'],
    ['unknownsub_xyz'],
  ])('rejects %s', (input) => {
    expect(normaliseVersionTag(input)).toBeNull()
  })

  it.each([[null], [undefined], [42], [{}], [[]]])(
    'rejects non-string %p',
    (input) => {
      expect(normaliseVersionTag(input)).toBeNull()
    },
  )
})
