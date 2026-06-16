/**
 * provider.tsx — React context + hooks for @nself/auth-core.
 *
 * Purpose: Provide NselfAuthProvider (wraps urql Client with auth exchange and
 *          subscribes to AuthState changes) and useAuth hook (returns current
 *          AuthState). Keeps auth state in React state, updated via strategy.subscribe().
 * Inputs:  AuthStrategy, NselfGraphqlClientConfig (optional), React children.
 * Outputs: NselfAuthProvider component, useAuth hook.
 * Constraints:
 *   - NEVER log jwt field or accessToken — AuthState.jwt must not appear in logs.
 *   - Provider subscribes to strategy on mount and unsubscribes on unmount.
 *   - urql Client is created once per strategy instance (memoised on strategy ref).
 *   - NselfGraphqlClient is optional — provider can be used without GraphQL client.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/auth-core (NselfAuthProvider, useAuth)
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthState, AuthStrategy } from './types.js';
import { createAuthExchange } from './exchange.js';

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  state: AuthState;
  strategy: AuthStrategy;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface NselfAuthProviderProps {
  /**
   * AuthStrategy instance — determines whether web (cookie) or native (Bearer)
   * transport is used. Create via createWebAuthStrategy() or createNativeAuthStrategy().
   */
  strategy: AuthStrategy;
  /** React children — access auth state via useAuth(). */
  children: ReactNode;
}

/**
 * NselfAuthProvider — top-level auth provider for nSelf apps.
 *
 * Initialises the strategy on mount, subscribes to state changes, and exposes
 * AuthState + strategy instance via React context.
 *
 * @example
 * ```tsx
 * const strategy = createWebAuthStrategy();
 * // or: const strategy = createNativeAuthStrategy(secureStore);
 *
 * function App() {
 *   return (
 *     <NselfAuthProvider strategy={strategy}>
 *       <YourApp />
 *     </NselfAuthProvider>
 *   );
 * }
 * ```
 */
export function NselfAuthProvider({
  strategy,
  children,
}: NselfAuthProviderProps): React.JSX.Element {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    // Initialise strategy and get the initial state.
    let mounted = true;
    void strategy.init().then((initialState) => {
      if (mounted) setState(initialState);
    });

    // Subscribe to future state changes.
    const unsubscribe = strategy.subscribe((newState) => {
      if (mounted) setState(newState);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [strategy]);

  const value = useMemo<AuthContextValue>(
    () => ({ state, strategy }),
    [state, strategy],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * useAuth — return the current AuthState from the nearest NselfAuthProvider.
 *
 * @throws Error if called outside of NselfAuthProvider.
 *
 * @example
 * ```tsx
 * function ProfileButton() {
 *   const auth = useAuth();
 *   if (auth.status === 'loading') return <Spinner />;
 *   if (auth.status !== 'authenticated') return <SignInButton />;
 *   return <span>{auth.user.displayName}</span>;
 * }
 * ```
 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be called inside <NselfAuthProvider>');
  }
  return ctx.state;
}

/**
 * useAuthStrategy — return the raw AuthStrategy from the nearest NselfAuthProvider.
 *
 * Use when you need to imperatively call login() or logout().
 *
 * @throws Error if called outside of NselfAuthProvider.
 */
export function useAuthStrategy(): AuthStrategy {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthStrategy must be called inside <NselfAuthProvider>');
  }
  return ctx.strategy;
}

// ─── createAuthExchange re-export for convenience ─────────────────────────────

/**
 * createAuthExchangeForStrategy — convenience wrapper that creates a urql authExchange
 * from an AuthStrategy, ready to pass to NselfGraphqlClient.authExchangeFn.
 *
 * @param strategy  The AuthStrategy instance from the provider.
 * @returns         Exchange for NselfGraphqlClient authExchangeFn slot.
 */
export { createAuthExchange as createAuthExchangeForStrategy } from './exchange.js';
