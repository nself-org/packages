/**
 * @nself-web/og — public API barrel.
 *
 * Primary import: generateOG (the edge-safe OG image generator).
 * Lower-level exports (buildOgResponse, OgTemplate, colors) are also
 * available for advanced use-cases (e.g. direct Cloudflare Worker usage).
 */

export { generateOG, OG_WIDTH, OG_HEIGHT, OG_CACHE_SECONDS } from './generate'
export { buildOgResponse, runtime } from './route'
export { OgTemplate } from './template'
export { getProductConfig, PRODUCT_COLORS } from './colors'
export type { ProductKey, ProductConfig } from './colors'
export type { OGVariant, OGOptions } from './types'
