/**
 * admin/browser.ts — browser-condition stub for `@nself/graphql-client/admin`.
 *
 * Purpose: package.json maps the "browser" export condition of `./admin` to this
 *          file, so a bundler targeting a browser never includes the real admin
 *          client. createAdminClient here always throws.
 * Inputs:  Anything (ignored; the argument is never read or stored).
 * Outputs: The same names as index.ts, so imports still type-check and resolve.
 * Constraints:
 *   - Imports no urql and no redaction code, only the error classes and a type.
 *   - Throws at call time, not import time, to match index.ts.
 * SPORT: cap:packages.admin-graphql-client (P7-ADOPT-09, EPIC ADOPT D14)
 */

import type { Client } from '@urql/core';
import { AdminClientInBrowserError } from './errors.js';
import type { AdminClientConfig } from './types.js';

export { AdminClientInBrowserError, AdminClientConfigError } from './errors.js';
export type { AdminClientConfig } from './types.js';

/**
 * createAdminClient — browser stub. Always throws AdminClientInBrowserError.
 */
export function createAdminClient(_config: AdminClientConfig): Client {
  throw new AdminClientInBrowserError();
}
