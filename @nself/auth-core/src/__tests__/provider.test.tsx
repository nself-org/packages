/**
 * provider.test.tsx — Unit tests for NselfAuthProvider + useAuth + useAuthStrategy.
 *
 * Purpose: Verify React context wiring, subscription lifecycle, and hook error boundaries.
 * Inputs:  Mock AuthStrategy, React testing utilities.
 * Outputs: Passing tests; coverage of provider.tsx >= 85%.
 * Constraints:
 *   - Uses @testing-library/react renderHook + render.
 *   - Never inspects accessToken or jwt in assertions.
 *   - Fake strategy — no real network calls.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/auth-core (NselfAuthProvider, useAuth)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import type { AuthState, AuthStrategy, TokenPair } from '../types.js';
import { NselfAuthProvider, useAuth, useAuthStrategy } from '../provider.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Subscriber = (state: AuthState) => void;

function makeMockStrategy(initialState: AuthState = { status: 'unauthenticated' }): AuthStrategy & {
  _emit: (state: AuthState) => void;
} {
  let subscribers: Subscriber[] = [];
  let currentToken: string | null = null;

  const strategy = {
    getAccessToken: vi.fn(() => currentToken),
    init: vi.fn(async () => initialState),
    login: vi.fn(async () => initialState),
    logout: vi.fn(async () => ({ status: 'unauthenticated' as const })),
    refresh: vi.fn(async (): Promise<AuthState> => ({ status: 'unauthenticated' as const })),
    subscribe: vi.fn((cb: Subscriber) => {
      subscribers.push(cb);
      return () => {
        subscribers = subscribers.filter((s) => s !== cb);
      };
    }),
    _emit: (state: AuthState) => {
      subscribers.forEach((cb) => cb(state));
    },
  };
  return strategy;
}

function Wrapper({ strategy, children }: { strategy: AuthStrategy; children: React.ReactNode }) {
  return <NselfAuthProvider strategy={strategy}>{children}</NselfAuthProvider>;
}

// ─── NselfAuthProvider ────────────────────────────────────────────────────────

describe('NselfAuthProvider', () => {
  it('renders children without crashing', () => {
    const strategy = makeMockStrategy();
    const { getByText } = render(
      <NselfAuthProvider strategy={strategy}>
        <span>Hello</span>
      </NselfAuthProvider>,
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('calls strategy.init() on mount', async () => {
    const strategy = makeMockStrategy();
    render(
      <NselfAuthProvider strategy={strategy}>
        <span />
      </NselfAuthProvider>,
    );
    await waitFor(() => {
      expect(strategy.init).toHaveBeenCalledTimes(1);
    });
  });

  it('calls strategy.subscribe() on mount', async () => {
    const strategy = makeMockStrategy();
    render(
      <NselfAuthProvider strategy={strategy}>
        <span />
      </NselfAuthProvider>,
    );
    await waitFor(() => {
      expect(strategy.subscribe).toHaveBeenCalledTimes(1);
    });
  });

  it('provides initial state from strategy.init()', async () => {
    const strategy = makeMockStrategy({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.com', displayName: 'Alice', roles: ['user'], defaultRole: 'user' },
      jwt: 'tok',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <Wrapper strategy={strategy}>{children}</Wrapper>,
    });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });
  });

  it('updates state when subscriber fires', async () => {
    const strategy = makeMockStrategy({ status: 'unauthenticated' });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <Wrapper strategy={strategy}>{children}</Wrapper>,
    });

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    act(() => {
      strategy._emit({
        status: 'authenticated',
        user: { id: 'u2', email: 'b@c.com', displayName: 'Bob', roles: ['user'], defaultRole: 'user' },
        jwt: 'tok2',
      });
    });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });
  });
});

// ─── useAuth ──────────────────────────────────────────────────────────────────

describe('useAuth', () => {
  it('throws when called outside NselfAuthProvider', () => {
    // renderHook without a wrapper — should throw
    const { result } = renderHook(() => {
      try {
        return useAuth();
      } catch (e) {
        return e as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toMatch(/NselfAuthProvider/);
  });

  it('returns loading state initially (before init resolves)', async () => {
    let resolveInit!: (s: AuthState) => void;
    const strategy = makeMockStrategy();
    strategy.init = vi.fn(
      () => new Promise<AuthState>((res) => { resolveInit = res; }),
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <Wrapper strategy={strategy}>{children}</Wrapper>,
    });

    // Before init resolves, state should be 'loading'
    expect(result.current.status).toBe('loading');

    act(() => {
      resolveInit({ status: 'unauthenticated' });
    });

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });
  });
});

// ─── useAuthStrategy ─────────────────────────────────────────────────────────

describe('useAuthStrategy', () => {
  it('throws when called outside NselfAuthProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useAuthStrategy();
      } catch (e) {
        return e as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toMatch(/NselfAuthProvider/);
  });

  it('returns the strategy instance provided to the provider', async () => {
    const strategy = makeMockStrategy();

    const { result } = renderHook(() => useAuthStrategy(), {
      wrapper: ({ children }) => <Wrapper strategy={strategy}>{children}</Wrapper>,
    });

    await waitFor(() => {
      expect(result.current).toBe(strategy);
    });
  });

  it('strategy.logout() can be called imperatively via the hook', async () => {
    const strategy = makeMockStrategy({
      status: 'authenticated',
      user: { id: 'u1', email: 'a@b.com', displayName: 'Alice', roles: ['user'], defaultRole: 'user' },
      jwt: 'tok',
    });

    const { result } = renderHook(() => useAuthStrategy(), {
      wrapper: ({ children }) => <Wrapper strategy={strategy}>{children}</Wrapper>,
    });

    await waitFor(() => {
      expect(result.current).toBe(strategy);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(strategy.logout).toHaveBeenCalledTimes(1);
  });
});
