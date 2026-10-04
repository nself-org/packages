/**
 * admin/errors.ts — error classes for the server-only admin GraphQL client.
 *
 * Purpose: Typed errors thrown by createAdminClient before any request is made.
 * Inputs:  None.
 * Outputs: AdminClientInBrowserError, AdminClientConfigError.
 * Constraints:
 *   - Messages are static strings. They never interpolate a config value, so a
 *     secret (or a URL that embeds one) cannot appear in a message or stack.
 *   - Imports nothing, so the browser stub can share these classes.
 * SPORT: cap:packages.admin-graphql-client (P7-ADOPT-09, EPIC ADOPT D14)
 */

/**
 * AdminClientInBrowserError — thrown at call time when `window` or `document`
 * exists. The admin secret is full database access and must never run in, or be
 * bundled for, a browser.
 */
export class AdminClientInBrowserError extends Error {
  constructor() {
    super(
      'createAdminClient is server-only and cannot run in a browser context. ' +
        'The Hasura admin secret must never reach a browser.',
    );
    this.name = 'AdminClientInBrowserError';
  }
}

/**
 * AdminClientConfigError — thrown when the config is invalid. `field` names the
 * offending option; the value is never included.
 */
export class AdminClientConfigError extends Error {
  /** Name of the invalid config option, never its value. */
  readonly field: string;

  constructor(field: string, problem: string) {
    super(`Invalid admin client config: ${field} ${problem}.`);
    this.name = 'AdminClientConfigError';
    this.field = field;
  }
}

/**
 * AdminClientRequestRefusedError — thrown by the client's private fetch when a
 * request targets anything but the configured endpoint. The admin headers are
 * never attached to such a request. The message carries no URL and no secret.
 */
export class AdminClientRequestRefusedError extends Error {
  constructor() {
    super('Admin client refused a request: the URL does not match the configured endpoint.');
    this.name = 'AdminClientRequestRefusedError';
  }
}
