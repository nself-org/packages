/**
 * @nself-web/og — public types.
 *
 * OGVariant maps to the four primary nSelf product surfaces that generate
 * OG images. Each variant drives colour selection and the product wordmark
 * shown in the lower-right badge.
 *
 * Sprint: P103 S16 T01.
 */

/** Supported OG image variants — one per product surface. */
export type OGVariant = 'org' | 'cloud' | 'nchat' | 'ntv'

/**
 * Options accepted by {@link generateOG}.
 *
 * `title` and `variant` are required. All other fields are optional with
 * sensible defaults (empty breadcrumb, 'org' variant colours).
 */
export interface OGOptions {
  /** Page title — truncated to 80 chars if longer. */
  readonly title: string

  /**
   * Optional breadcrumb shown below the title.
   * Typically the section path, e.g. "Docs / Getting Started".
   */
  readonly breadcrumb?: string

  /** Which product surface is generating the image. Defaults to 'org'. */
  readonly variant?: OGVariant

  /**
   * Override the inbound Request for cache-header generation.
   * When omitted, no cache headers are added.
   */
  readonly request?: Request
}
