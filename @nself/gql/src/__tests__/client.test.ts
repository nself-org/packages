/**
 * Unit tests for @nself/gql — createNSelfClient session header injection and error handling.
 *
 * Purpose: Verify the four behavioural contracts of createNSelfClient:
 *   (a) x-hasura-* session headers are injected correctly on happy path
 *   (b) null session → AppError code='auth_failed' (no network call)
 *   (c) x-hasura-tenant-id injected ONLY when useTenantIsolation=true AND tenant_id present
 *   (d) GraphQL errors from graphql-request are wrapped into AppError (never thrown)
 *
 * Constraints:
 *   - graphql-request is mocked at the module level — no live network calls in tests.
 *   - All assertions use Result._tag to discriminate Ok/Err without casting.
 *   - Zero `any` — test variables are fully typed.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/gql (client-implemented)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNSelfClient } from '../client.js';
import type { NSelfClientConfig } from '../types.js';
import type { Session } from '@nself/types';

// ─── Mock graphql-request ────────────────────────────────────────────────────
// We mock the GraphQLClient constructor so we can inspect what headers were
// passed and control what the .request() method returns.

const mockRequest = vi.fn();

vi.mock('graphql-request', () => {
  return {
    GraphQLClient: vi.fn().mockImplementation((_url: string, _opts: unknown) => {
      return { request: mockRequest };
    }),
  };
});

// Import after mock is registered so we can inspect the constructor args.
const { GraphQLClient } = await import('graphql-request');
const MockGraphQLClient = vi.mocked(GraphQLClient);

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Minimal valid Session — all required fields present. */
const MOCK_SESSION: Session = {
  session_id: 'sess-001',
  user_id: 'user-uuid-001',
  source_account_id: 'primary',
  expires_at: '2026-12-31T00:00:00Z',
  user: {
    id: 'user-uuid-001',
    email: 'test@example.com',
    role: 'member',
  },
};

/** Session with optional tenant_id for Cloud SaaS scenarios. */
const MOCK_TENANT_SESSION: Session = {
  ...MOCK_SESSION,
  tenant_id: 'tenant-uuid-001',
};

/** A minimal fake TypedDocumentNode — we never actually execute it (graphql-request is mocked). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- vitest mock shim; not production code
const FAKE_DOCUMENT = { kind: 'Document', definitions: [] } as any;

const ENDPOINT = 'https://api.nself.test/v1/graphql';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<NSelfClientConfig> = {}): NSelfClientConfig {
  return {
    endpoint: ENDPOINT,
    getSession: vi.fn().mockResolvedValue(MOCK_SESSION),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('createNSelfClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest.mockResolvedValue({ __typename: 'Query' });
  });

  // ── (a) Happy path: correct session headers injected ─────────────────────
  describe('session header injection (happy path)', () => {
    it('injects x-hasura-role from session.user.role', async () => {
      const client = createNSelfClient(makeConfig());
      await client.query(FAKE_DOCUMENT);

      const firstCall = MockGraphQLClient.mock.calls[0];
      const opts = firstCall?.[1] as { headers: Record<string, string> } | undefined;
      expect(opts?.headers['x-hasura-role']).toBe('member');
    });

    it('injects x-hasura-user-id from session.user_id', async () => {
      const client = createNSelfClient(makeConfig());
      await client.query(FAKE_DOCUMENT);

      const firstCall2 = MockGraphQLClient.mock.calls[0];
      const opts2 = firstCall2?.[1] as { headers: Record<string, string> } | undefined;
      expect(opts2?.headers['x-hasura-user-id']).toBe('user-uuid-001');
    });

    it('injects x-hasura-source-account-id from session.source_account_id', async () => {
      const client = createNSelfClient(makeConfig());
      await client.query(FAKE_DOCUMENT);

      const firstCall3 = MockGraphQLClient.mock.calls[0];
      const opts3 = firstCall3?.[1] as { headers: Record<string, string> } | undefined;
      expect(opts3?.headers['x-hasura-source-account-id']).toBe('primary');
    });

    it('returns Ok result wrapping the response data', async () => {
      const responseData = { user: { id: '123' } };
      mockRequest.mockResolvedValueOnce(responseData);

      const client = createNSelfClient(makeConfig());
      const result = await client.query(FAKE_DOCUMENT);

      expect(result._tag).toBe('Ok');
      if (result._tag === 'Ok') {
        expect(result.value).toEqual(responseData);
      }
    });

    it('mutate() uses the same session header injection path', async () => {
      const client = createNSelfClient(makeConfig());
      await client.mutate(FAKE_DOCUMENT);

      const firstCallM = MockGraphQLClient.mock.calls[0];
      const optsM = firstCallM?.[1] as { headers: Record<string, string> } | undefined;
      expect(optsM?.headers['x-hasura-user-id']).toBe('user-uuid-001');
    });
  });

  // ── (b) Null session → auth_failed ────────────────────────────────────────
  describe('null session → auth_failed', () => {
    it('returns Err with code=auth_failed when getSession returns null', async () => {
      const client = createNSelfClient(makeConfig({
        getSession: vi.fn().mockResolvedValue(null),
      }));

      const result = await client.query(FAKE_DOCUMENT);

      expect(result._tag).toBe('Err');
      if (result._tag === 'Err') {
        expect(result.error.code).toBe('auth_failed');
        expect(result.error.status).toBe(401);
      }
    });

    it('makes NO network call when session is null', async () => {
      const client = createNSelfClient(makeConfig({
        getSession: vi.fn().mockResolvedValue(null),
      }));

      await client.query(FAKE_DOCUMENT);

      // GraphQLClient constructor must not have been called (no network attempt)
      expect(MockGraphQLClient).not.toHaveBeenCalled();
    });
  });

  // ── (c) tenant_id conditional injection ───────────────────────────────────
  describe('x-hasura-tenant-id conditional injection', () => {
    it('does NOT inject x-hasura-tenant-id when useTenantIsolation=false (default)', async () => {
      const client = createNSelfClient(makeConfig({
        getSession: vi.fn().mockResolvedValue(MOCK_TENANT_SESSION),
        useTenantIsolation: false,
      }));
      await client.query(FAKE_DOCUMENT);

      const callA = MockGraphQLClient.mock.calls[0];
      const optsA = callA?.[1] as { headers: Record<string, string> } | undefined;
      expect(optsA?.headers['x-hasura-tenant-id']).toBeUndefined();
    });

    it('does NOT inject x-hasura-tenant-id when useTenantIsolation=true but session has no tenant_id', async () => {
      const client = createNSelfClient(makeConfig({
        getSession: vi.fn().mockResolvedValue(MOCK_SESSION), // no tenant_id
        useTenantIsolation: true,
      }));
      await client.query(FAKE_DOCUMENT);

      const callB = MockGraphQLClient.mock.calls[0];
      const optsB = callB?.[1] as { headers: Record<string, string> } | undefined;
      expect(optsB?.headers['x-hasura-tenant-id']).toBeUndefined();
    });

    it('INJECTS x-hasura-tenant-id when useTenantIsolation=true AND session.tenant_id present', async () => {
      const client = createNSelfClient(makeConfig({
        getSession: vi.fn().mockResolvedValue(MOCK_TENANT_SESSION),
        useTenantIsolation: true,
      }));
      await client.query(FAKE_DOCUMENT);

      const callC = MockGraphQLClient.mock.calls[0];
      const optsC = callC?.[1] as { headers: Record<string, string> } | undefined;
      expect(optsC?.headers['x-hasura-tenant-id']).toBe('tenant-uuid-001');
    });
  });

  // ── (d) GraphQL / network error wrapping (never throws) ───────────────────
  describe('error wrapping — Result<T, AppError>, never throws', () => {
    it('wraps GraphQL error array into Err(AppError{code:internal})', async () => {
      const gqlError = {
        response: {
          errors: [{ message: 'field not found: fooBar' }],
        },
      };
      mockRequest.mockRejectedValueOnce(gqlError);

      const client = createNSelfClient(makeConfig());
      const result = await client.query(FAKE_DOCUMENT);

      expect(result._tag).toBe('Err');
      if (result._tag === 'Err') {
        expect(result.error.code).toBe('internal');
        expect(result.error.message).toContain('field not found');
        expect(result.error.status).toBe(500);
      }
    });

    it('wraps network / fetch failure into Err(AppError{code:internal})', async () => {
      mockRequest.mockRejectedValueOnce(new Error('fetch failed: ECONNREFUSED'));

      const client = createNSelfClient(makeConfig());
      const result = await client.query(FAKE_DOCUMENT);

      expect(result._tag).toBe('Err');
      if (result._tag === 'Err') {
        expect(result.error.code).toBe('internal');
        expect(result.error.message).toContain('ECONNREFUSED');
        expect(result.error.status).toBe(500);
      }
    });

    it('wraps getSession() throw into Err(AppError{code:internal})', async () => {
      const client = createNSelfClient(makeConfig({
        getSession: vi.fn().mockRejectedValue(new Error('SecureStore read failed')),
      }));

      const result = await client.query(FAKE_DOCUMENT);

      expect(result._tag).toBe('Err');
      if (result._tag === 'Err') {
        expect(result.error.code).toBe('internal');
        expect(result.error.message).toContain('SecureStore read failed');
      }
    });

    it('never throws — query() is always awaitable without try/catch', async () => {
      mockRequest.mockRejectedValueOnce(new Error('kaboom'));
      const client = createNSelfClient(makeConfig());

      // If this throws, the test fails — the test is the assertion
      const result = await client.query(FAKE_DOCUMENT);
      expect(result._tag).toBe('Err');
    });
  });

  // ── Security: x-hasura-admin-secret must never appear ────────────────────
  describe('security — admin-secret never injected', () => {
    it('does not include x-hasura-admin-secret in headers', async () => {
      const client = createNSelfClient(makeConfig());
      await client.query(FAKE_DOCUMENT);

      const callSec = MockGraphQLClient.mock.calls[0];
      const optsSec = callSec?.[1] as { headers: Record<string, string> } | undefined;
      const headers = optsSec?.headers ?? {};
      expect(Object.keys(headers)).not.toContain('x-hasura-admin-secret');
      // Belt-and-suspenders: check values too
      const headerValues = Object.values(headers).join(' ').toLowerCase();
      expect(headerValues).not.toContain('admin-secret');
      expect(headerValues).not.toContain('admin_secret');
    });
  });
});
