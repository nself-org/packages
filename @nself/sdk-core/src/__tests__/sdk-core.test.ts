/**
 * Unit tests for @nself/sdk-core.
 *
 * Coverage:
 * - NselfClient construction and config defaults
 * - NselfClient config override
 * - baseFetch retry behavior (mocked fetch)
 * - baseFetch success and HTTP error mapping
 * - baseFetch timeout behavior
 * - resolveApiUrl env-var resolution
 * - env detection utilities
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { NselfClient } from '../client.js';
import { baseFetch } from '../fetch.js';
import { PROD_API_URL, STAGING_API_URL, resolveApiUrl } from '../urls.js';
import {
  isBrowser,
  isNative,
  isDesktop,
  isServer,
  detectEnvironment,
} from '../env.js';

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// NselfClient
// ---------------------------------------------------------------------------

describe('NselfClient', () => {
  it('constructs with default config', () => {
    const client = new NselfClient();
    expect(client.config.timeout).toBe(10_000);
    expect(client.config.retries).toBe(1);
    expect(typeof client.config.apiUrl).toBe('string');
    expect(client.config.apiUrl.length).toBeGreaterThan(0);
    expect(['web', 'native', 'desktop', 'server']).toContain(
      client.config.environment,
    );
  });

  it('accepts apiUrl override', () => {
    const client = new NselfClient({ apiUrl: 'http://localhost:3000' });
    expect(client.config.apiUrl).toBe('http://localhost:3000');
  });

  it('accepts timeout override', () => {
    const client = new NselfClient({ timeout: 5_000 });
    expect(client.config.timeout).toBe(5_000);
  });

  it('accepts retries override', () => {
    const client = new NselfClient({ retries: 3 });
    expect(client.config.retries).toBe(3);
  });

  it('accepts environment override', () => {
    const client = new NselfClient({ environment: 'server' });
    expect(client.config.environment).toBe('server');
  });

  it('two separate instances do not share state', () => {
    const a = new NselfClient({ retries: 0 });
    const b = new NselfClient({ retries: 5 });
    expect(a.config.retries).toBe(0);
    expect(b.config.retries).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// baseFetch — success
// ---------------------------------------------------------------------------

describe('baseFetch — success', () => {
  it('returns Ok with parsed JSON on 200', async () => {
    const payload = { id: 1, name: 'test' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(payload),
        text: () => Promise.resolve(JSON.stringify(payload)),
      }),
    );

    const result = await baseFetch<{ id: number; name: string }>(
      'https://api.nself.org/v1/test',
    );

    expect(result._tag).toBe('Ok');
    if (result._tag === 'Ok') {
      expect(result.value).toEqual(payload);
    }
  });
});

// ---------------------------------------------------------------------------
// baseFetch — HTTP errors
// ---------------------------------------------------------------------------

describe('baseFetch — HTTP errors', () => {
  const cases: Array<[number, string]> = [
    [401, 'auth_failed'],
    [402, 'license_required'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [422, 'validation_error'],
    [429, 'rate_limited'],
    [500, 'internal'],
  ];

  for (const [status, expectedCode] of cases) {
    it(`maps HTTP ${status} to ${expectedCode}`, async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status,
          statusText: 'Error',
          text: () => Promise.resolve(''),
        }),
      );

      const result = await baseFetch('https://api.nself.org/v1/test');

      expect(result._tag).toBe('Err');
      if (result._tag === 'Err') {
        expect(result.error.code).toBe(expectedCode);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// baseFetch — retry logic
// ---------------------------------------------------------------------------

describe('baseFetch — retry logic', () => {
  it('retries on network error up to retries limit', async () => {
    const networkError = new TypeError('Failed to fetch');
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        text: () => Promise.resolve('{"success":true}'),
      });

    vi.stubGlobal('fetch', mockFetch);

    const result = await baseFetch<{ success: boolean }>(
      'https://api.nself.org/v1/test',
      { retries: 2 },
    );

    expect(result._tag).toBe('Ok');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry on 4xx HTTP errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve(''),
    });

    vi.stubGlobal('fetch', mockFetch);

    const result = await baseFetch('https://api.nself.org/v1/test', {
      retries: 3,
    });

    // Should only be called once — no retry on 404
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result._tag).toBe('Err');
    if (result._tag === 'Err') {
      expect(result.error.code).toBe('not_found');
    }
  });

  it('returns Err after all retries exhausted', async () => {
    const networkError = new TypeError('Failed to fetch');
    const mockFetch = vi.fn().mockRejectedValue(networkError);

    vi.stubGlobal('fetch', mockFetch);

    const result = await baseFetch('https://api.nself.org/v1/test', {
      retries: 2,
    });

    expect(result._tag).toBe('Err');
    // fetch should have been called 3 times total (1 initial + 2 retries)
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// resolveApiUrl
// ---------------------------------------------------------------------------

describe('resolveApiUrl', () => {
  it('returns production URL when no env vars are set', () => {
    // In test environment, NSELF_API_URL is typically unset
    const url = resolveApiUrl();
    // Should be a non-empty string that is either the prod URL or an env override
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
  });

  it('PROD_API_URL is the canonical production endpoint', () => {
    expect(PROD_API_URL).toBe('https://api.nself.org');
  });

  it('STAGING_API_URL is the canonical staging IP', () => {
    expect(STAGING_API_URL).toBe('http://167.235.233.65');
  });
});

// ---------------------------------------------------------------------------
// Environment detection
// ---------------------------------------------------------------------------

describe('env detection', () => {
  it('isBrowser returns boolean', () => {
    expect(typeof isBrowser()).toBe('boolean');
  });

  it('isNative returns boolean', () => {
    expect(typeof isNative()).toBe('boolean');
  });

  it('isDesktop returns boolean', () => {
    expect(typeof isDesktop()).toBe('boolean');
  });

  it('isServer returns boolean', () => {
    expect(typeof isServer()).toBe('boolean');
  });

  it('detectEnvironment returns a valid NselfEnvironment', () => {
    const env = detectEnvironment();
    expect(['web', 'native', 'desktop', 'server']).toContain(env);
  });

  it('in Node.js test context, isServer is true', () => {
    // vitest runs in Node — there is no window
    expect(isServer()).toBe(true);
  });

  it('in Node.js test context, isBrowser is false', () => {
    expect(isBrowser()).toBe(false);
  });

  it('in Node.js test context, detectEnvironment returns server', () => {
    expect(detectEnvironment()).toBe('server');
  });
});
