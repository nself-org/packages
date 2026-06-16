/**
 * Bundle and pricing types — aligned with SPORT F06 + F07.
 *
 * Purpose: Canonical TypeScript types for all nSelf product bundles and
 *          pricing tiers so that license checks, billing flows, and marketing
 *          components share a single compile-time-checked source of truth.
 * Inputs:  None — pure type definitions.
 * Outputs: BundleId, PricingTier, Bundle, BundlePrice, SubscriptionInterval types.
 * Constraints: BundleId slug strings MUST mirror cli/internal/bundle/bundles.go
 *              and docs/sport/F06-BUNDLE-INVENTORY.md (nself project) verbatim.
 *              Any new bundle requires a PCI that updates F06 + bundles.go + this file.
 * SPORT: F06-BUNDLE-INVENTORY.md (canonical) · F07-PRICING-TIERS.md (pricing)
 *        F13-CROSS-REPO-DEPS.md row @nself/types (implementation)
 */

/**
 * BundleId — canonical bundle slug union.
 *
 * Values are the CLI-arg lowercase identifiers from bundles.go DisplayOrder:
 *   nclaw · nchat · nfamily · ntv · clawde · nsentry · ntask · nself-plus
 *
 * Source of truth: cli/internal/bundle/bundles.go canonicalBundles map keys
 *                  docs/sport/F06-BUNDLE-INVENTORY.md (nself project)
 */
export type BundleId =
  | 'nclaw'      // ɳClaw — AI assistant (email, calendar, news, budget)
  | 'nchat'      // ɳChat — team chat + live video
  | 'nfamily'    // ɳFamily — family social (PLANNED v1.1.0)
  | 'ntv'        // ɳTV — media downloading, streaming, metadata
  | 'clawde'     // ClawDE — AI dev environment cloud sync
  | 'nsentry'    // ɳSentry — observability & incident management (PLANNED v1.1.0)
  | 'ntask'      // ɳTask — free bundle (free plugins only, $0)
  | 'nself-plus' // ɳSelf+ — all 6 paid bundles + all apps + support

/**
 * Subscription billing interval.
 * 'annual' triggers the ~16% savings (~2 months free) pricing.
 */
export type SubscriptionInterval = 'monthly' | 'annual';

/**
 * PricingTier — canonical tiers from F07.
 * 'free'       → $0, CLI + 29 free plugins + MIT app repos
 * 'bundle'     → $0.99/mo or $9.99/yr per individual bundle
 * 'nself-plus' → $3.99/mo or $39.99/yr (all 6 paid bundles + apps + support)
 */
export type PricingTier = 'free' | 'bundle' | 'nself-plus';

/** Price point for a bundle at a given billing interval. */
export interface BundlePrice {
  readonly monthly: number;  // USD per month
  readonly annual: number;   // USD per year (pre-discounted)
  readonly currency: 'USD';
}

/**
 * Bundle metadata — display-safe information about a product bundle.
 * Runtime instances of this type are owned by the CLI (bundles.go) and the
 * web pricing page; this type is the contract that shared components rely on.
 */
export interface Bundle {
  /** Canonical slug — matches BundleId. */
  readonly id: BundleId;
  /** Display name using ɳ glyph where appropriate (e.g. 'ɳClaw', 'ClawDE'). */
  readonly name: string;
  /** Short one-line description for cards and dropdowns. */
  readonly description: string;
  readonly price: BundlePrice;
  /**
   * Whether this bundle is currently purchasable.
   * PLANNED bundles (ɳFamily, ɳSentry as of v1.1.0) are not yet buyable.
   */
  readonly buyable: boolean;
}

/** Canonical per-bundle pricing (F07 authoritative). */
export const BUNDLE_PRICE: BundlePrice = {
  monthly: 0.99,
  annual: 9.99,
  currency: 'USD',
} as const;

/** ɳSelf+ pricing (F07 authoritative). */
export const NSELF_PLUS_PRICE: BundlePrice = {
  monthly: 3.99,
  annual: 39.99,
  currency: 'USD',
} as const;
