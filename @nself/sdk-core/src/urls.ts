/**
 * urls.ts — API base-URL resolver for @nself/sdk-core.
 *
 * Purpose: Provide a single canonical source of truth for nSelf API endpoint
 *          base URLs, reading from environment variables with a safe fallback.
 * Inputs:  VITE_NSELF_API_URL (Vite client) or NSELF_API_URL (Node/server) env vars.
 * Outputs: Resolved base URL string; staging URL constant.
 * Constraints: No fetch calls here; pure URL resolution; no framework deps.
 * SPORT: F11-SUBDOMAIN-MAP.md (api.nself.org)
 */

/** Production API base URL. */
export const PROD_API_URL = 'https://api.nself.org' as const;

/** Staging API base URL (Hetzner staging server). */
export const STAGING_API_URL = 'http://167.235.233.65' as const;

/** Read a Vite env var safely across bundler/non-bundler envs. */
const readViteEnv = (key: string): string | undefined => {
  try {
    // import.meta.env is only available in Vite-bundled contexts.
    // Cast via unknown to avoid TS2352 on ImportMeta index access.
    const meta = import.meta as unknown as Record<string, Record<string, unknown>>;
    const env = meta['env'];
    if (env == null || typeof env !== 'object') return undefined;
    const val = env[key];
    return typeof val === 'string' ? val : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Resolve the nSelf API base URL from environment variables, falling back
 * to the production endpoint.
 *
 * Resolution order:
 *  1. VITE_NSELF_API_URL — Vite client builds (browser/Tauri/RN via Vite)
 *  2. NSELF_API_URL      — Server-side / Node.js environments
 *  3. 'https://api.nself.org' — hardcoded production default
 *
 * @returns Base URL string without trailing slash.
 */
export const resolveApiUrl = (): string => {
  const viteUrl = readViteEnv('VITE_NSELF_API_URL');
  if (viteUrl && viteUrl.length > 0) return viteUrl.replace(/\/$/, '');

  // Node.js / server-side env var
  const nodeUrl =
    typeof process !== 'undefined' && process.env != null
      ? process.env['NSELF_API_URL']
      : undefined;

  if (nodeUrl && nodeUrl.length > 0) return nodeUrl.replace(/\/$/, '');

  return PROD_API_URL;
};

/**
 * Resolve the staging API URL from environment variables, falling back
 * to the canonical staging server IP.
 */
export const resolveStagingUrl = (): string => {
  const viteUrl = readViteEnv('VITE_NSELF_STAGING_URL');
  if (viteUrl && viteUrl.length > 0) return viteUrl.replace(/\/$/, '');

  return STAGING_API_URL;
};
