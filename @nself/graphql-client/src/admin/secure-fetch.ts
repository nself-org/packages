/**
 * admin/secure-fetch.ts — the private fetch that carries the admin headers.
 *
 * Purpose: Keep the admin secret out of every urql channel (client options,
 *          operation context, fetchOptions, debug events). urql gets only this
 *          closure as its `fetch`; the headers are added here, at the last step.
 * Inputs:  Validated endpoint, secret, optional role and source account id,
 *          extra headers, and a Redactor bound to the secret.
 * Outputs: makeSecureFetch(...) returning a `typeof fetch` replacement.
 * Constraints:
 *   - Headers are attached only when the request URL has the configured endpoint's
 *     origin and path (query string allowed). Any other URL, or a call with no
 *     URL, throws AdminClientRequestRefusedError before any network I/O.
 *   - The three reserved headers are force-set last: per-operation fetchOptions
 *     cannot change or drop them. Role and source account are deleted when unset.
 *   - Redirects are refused (`redirect: 'error'`) so headers never follow one.
 *   - Only method, body, signal, headers and redirect reach fetch (allowlist), so a
 *     caller dispatcher or agent never sees the secret.
 *   - A fetch rejection is rethrown redacted. Successful responses are returned
 *     untouched. Error responses get headers scrubbed always and a JSON body
 *     scrubbed per parsed value (see scrubError).
 * SPORT: cap:packages.admin-graphql-client (P7-ADOPT-09, EPIC ADOPT D14)
 */

import { AdminClientRequestRefusedError } from './errors.js';
import type { Redactor } from './redact.js';

/** Reserved header names, lower case. Shared with config validation. */
export const SECRET_HEADER = 'x-hasura-admin-secret';
export const ROLE_HEADER = 'x-hasura-role';
export const SOURCE_ACCOUNT_HEADER = 'x-hasura-source-account-id';

/** Inputs for makeSecureFetch. */
export interface SecureFetchOptions {
  readonly url: string;
  readonly secret: string;
  readonly role: string | undefined;
  readonly sourceAccountId: string | undefined;
  readonly extra: Readonly<Record<string, string>>;
  readonly redact: Redactor;
}

const NULL_BODY_STATUS = new Set([101, 204, 205, 304]);

/**
 * makeSecureFetch — build the private fetch handed to urql as `ClientOptions.fetch`.
 */
export function makeSecureFetch(o: SecureFetchOptions): typeof fetch {
  const endpoint = new URL(o.url);

  const matchesEndpoint = (input: unknown): boolean => {
    let target: URL;
    try {
      if (typeof input === 'string') target = new URL(input);
      else if (input instanceof URL) target = input;
      else return false;
    } catch {
      return false;
    }
    return (
      target.origin === endpoint.origin &&
      target.pathname === endpoint.pathname &&
      target.username === '' &&
      target.password === ''
    );
  };

  const scrubHeaders = (source: Headers): Headers => {
    const out = new Headers();
    source.forEach((value, name) => {
      if (name !== 'content-length') out.append(name, o.redact.text(value));
    });
    return out;
  };

  // Error responses only (!ok). A successful response is returned untouched: the
  // server never echoes the admin secret, and rewriting data would corrupt it.
  // Headers are scrubbed whatever the content type. A JSON body is parsed and
  // scrubbed value by value, then re-serialised; it is never rewritten as raw text
  // unless it is not valid JSON. Streaming or binary bodies pass through.
  const scrubError = async (res: Response): Promise<Response> => {
    const head = { status: res.status, statusText: o.redact.text(res.statusText), headers: scrubHeaders(res.headers) };
    if (NULL_BODY_STATUS.has(res.status)) return new Response(null, head);
    const type = res.headers.get('content-type') ?? '';
    if (/json/i.test(type)) {
      const text = await res.text();
      try {
        return new Response(JSON.stringify(o.redact.value(JSON.parse(text) as unknown)), head);
      } catch {
        return new Response(o.redact.text(text), head);
      }
    }
    if (/^text\//i.test(type)) return new Response(o.redact.text(await res.text()), head);
    return new Response(res.body, head);
  };

  const secureFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (!matchesEndpoint(input)) throw new AdminClientRequestRefusedError();

    const headers = new Headers(o.extra);
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    headers.set(SECRET_HEADER, o.secret);
    if (o.role !== undefined) headers.set(ROLE_HEADER, o.role);
    else headers.delete(ROLE_HEADER);
    if (o.sourceAccountId !== undefined) headers.set(SOURCE_ACCOUNT_HEADER, o.sourceAccountId);
    else headers.delete(SOURCE_ACCOUNT_HEADER);

    let res: Response;
    try {
      // Allowlist, not a spread: a caller-supplied dispatcher, agent or keepalive
      // option must never receive the request that carries the secret.
      const safe: RequestInit = { headers, redirect: 'error' };
      if (init?.method !== undefined) safe.method = init.method;
      if (init?.body !== undefined) safe.body = init.body;
      if (init?.signal !== undefined) safe.signal = init.signal;
      res = await globalThis.fetch(input, safe);
    } catch (e) {
      throw o.redact.value(e);
    }
    return res.ok ? res : scrubError(res);
  };
  return secureFetch as typeof fetch;
}
