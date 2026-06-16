/**
 * client.ts — NselfClient base SDK thin-client for @nself/sdk-core.
 *
 * Purpose: Provide the canonical HTTP client configuration and transport entry
 *          point for all nSelf SDK packages. Callers instantiate NselfClient
 *          with their config and pass the instance to higher-level packages
 *          (auth-core, graphql-client, etc.). No singleton — per-call instantiation.
 * Inputs:  NselfClientConfig — apiUrl, environment, timeout, retries.
 * Outputs: NselfClient instance with .fetch() and .config accessor.
 * Constraints: No framework imports (React/RN/Tauri); pure TS; no module-level instance.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/sdk-core (NselfClient)
 */

import type { AppError, Result } from '@nself/errors';
import { baseFetch, type BaseFetchOptions } from './fetch.js';
import { resolveApiUrl } from './urls.js';
import { detectEnvironment, type NselfEnvironment } from './env.js';

/** Configuration accepted by NselfClient constructor. */
export interface NselfClientConfig {
  /**
   * Base API URL for all requests.
   * Defaults to resolveApiUrl() (env-var aware, falls back to 'https://api.nself.org').
   */
  apiUrl?: string;
  /**
   * Runtime environment override. When omitted, detectEnvironment() is called once
   * at construction time.
   */
  environment?: NselfEnvironment;
  /**
   * Request timeout in milliseconds. Default: 10_000 (10 seconds).
   */
  timeout?: number;
  /**
   * Number of retry attempts on network-level failures (not 4xx/5xx).
   * Default: 1.
   */
  retries?: number;
}

/** Resolved, immutable config stored on each NselfClient instance. */
export interface ResolvedNselfClientConfig {
  readonly apiUrl: string;
  readonly environment: NselfEnvironment;
  readonly timeout: number;
  readonly retries: number;
}

/**
 * NselfClient — base SDK thin-client.
 *
 * Instantiate once per logical API session; do NOT use a module-level singleton.
 * All @nself/* packages accept an NselfClient rather than managing transport
 * independently, keeping transport config centralized.
 *
 * @example
 * ```ts
 * const client = new NselfClient({ retries: 2 });
 * const result = await client.fetch<User>('/v1/me');
 * if (result._tag === 'Ok') {
 *   console.log(result.value);
 * }
 * ```
 */
export class NselfClient {
  /** Resolved configuration for this instance. */
  readonly config: ResolvedNselfClientConfig;

  constructor(config: NselfClientConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl ?? resolveApiUrl(),
      environment: config.environment ?? detectEnvironment(),
      timeout: config.timeout ?? 10_000,
      retries: config.retries ?? 1,
    };
  }

  /**
   * Perform a typed HTTP request relative to this client's apiUrl.
   *
   * @param path    Path relative to apiUrl (must start with '/').
   * @param options Optional fetch options; retries/timeoutMs from config if not set.
   * @returns       Promise<Result<T, AppError>> — never throws.
   */
  fetch<T>(
    path: string,
    options: BaseFetchOptions = {},
  ): Promise<Result<T, AppError>> {
    const url = `${this.config.apiUrl}${path}`;
    return baseFetch<T>(url, {
      retries: options.retries ?? this.config.retries,
      timeoutMs: options.timeoutMs ?? this.config.timeout,
      ...options,
    });
  }
}
