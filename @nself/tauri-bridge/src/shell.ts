/**
 * @nself/tauri-bridge — Shell helpers with URL allowlist enforcement.
 *
 * Purpose: openUrl() validates the target hostname against a caller-supplied
 *          allowlist before delegating to @tauri-apps/api/opener. This prevents
 *          Tauri apps from being used as open-redirect proxies.
 * Inputs:  url: string        — the URL to open in the system browser
 *          allowlist: string[] — permitted hostnames (e.g. ['nself.org', 'docs.nself.org'])
 * Outputs: Promise<Result<void, AppError>>
 *          - Ok<void> when the URL was opened
 *          - Err{code:'forbidden'} when hostname is not in the allowlist
 *          - Err{code:'validation_error'} when url cannot be parsed
 *          - Err{code:'internal'} on stub mode or runtime errors
 * Constraints: Allowlist is exact hostname match (no glob). Empty allowlist = all rejected.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/tauri-bridge
 */

import { type AppError, err, ok, type Result } from '@nself/errors';
import { isTauri, notTauriError } from './bridge.js';

/**
 * openUrl — open a URL in the system default browser with allowlist enforcement.
 *
 * The hostname of `url` must be present in `allowlist`; if not, returns
 * Result.err with code 'forbidden' before any shell.open call is made.
 *
 * @param url       - URL to open (must be parseable by the URL constructor)
 * @param allowlist - Array of permitted hostnames; empty = all rejected
 * @returns Ok<void> on success, Err<AppError> on rejection or failure
 */
export async function openUrl(
  url: string,
  allowlist: string[],
): Promise<Result<void, AppError>> {
  if (!isTauri()) return err(notTauriError());

  // Parse the URL — reject malformed inputs before touching the allowlist.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    const error: AppError = {
      code: 'validation_error',
      message: `shell:openUrl: invalid URL: ${url}`,
      status: 422,
    };
    return err(error);
  }

  // Allowlist enforcement — hostname only, exact match.
  if (!allowlist.includes(parsed.hostname)) {
    const error: AppError = {
      code: 'forbidden',
      message: `shell:openUrl: hostname '${parsed.hostname}' is not in the allowlist`,
      status: 403,
    };
    return err(error);
  }

  try {
    // @tauri-apps/api/opener is the Tauri 2 replacement for the legacy shell plugin.
    const { openUrl: tauriOpenUrl } = await import('@tauri-apps/plugin-opener');
    await tauriOpenUrl(url);
    return ok(undefined);
  } catch (raw: unknown) {
    const message =
      raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : 'unknown';
    const error: AppError = {
      code: 'internal',
      message: `shell:openUrl: ${message}`,
      status: 500,
    };
    return err(error);
  }
}
