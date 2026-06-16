/**
 * Native session getter stub — Expo SecureStore transport for RN + Expo surfaces.
 *
 * Purpose: Typed stub defining the getNativeSession() contract. Concrete implementation
 *          reads the refresh token from expo-secure-store (iOS Keychain / Android Keystore)
 *          and exchanges it for a short-lived access token via /api/auth/refresh.
 *
 * Inputs:  None — reads from platform keychain.
 * Outputs: Session | null — null means unauthenticated or token not found in secure store.
 *
 * Constraints:
 *   - MUST use expo-secure-store — NEVER AsyncStorage. AsyncStorage is unencrypted
 *     on-disk storage visible on rooted Android; it provides zero security guarantees.
 *     AsyncStorage fallback is BANNED even temporarily. See ADR: auth-transport-security.md.
 *   - This stub returns null (safe default). Do NOT replace null with AsyncStorage.getItem().
 *   - Full implementation: E3 mobile migration tickets (per-app, uses expo-secure-store).
 *
 * TODO (E3 mobile tickets): Replace this stub body with:
 *   ```typescript
 *   import * as SecureStore from 'expo-secure-store';
 *   const refreshToken = await SecureStore.getItemAsync('nself_refresh_token');
 *   if (!refreshToken) return null;
 *   const res = await fetch('/api/auth/refresh', {
 *     method: 'POST',
 *     headers: { Authorization: `Bearer ${refreshToken}` },
 *   });
 *   if (!res.ok) return null;
 *   return res.json() as Promise<Session>;
 *   ```
 *   Package: expo-secure-store ^14.0.0 (maps to iOS Keychain + Android Keystore)
 *
 * SPORT: F08-SERVICE-INVENTORY.md — auth_server service (dual-transport ADR authored)
 * ADR:   .claude/docs/decisions/auth-transport-security.md §Native Transport
 * Refs:  T-P3-E1-W3-S6-T11 (this ticket), T-P3-E1-W2-S4-T08 (@nself/gql getSession)
 */

import type { Session } from '@nself/types';

/**
 * Returns the current native session from Expo SecureStore.
 *
 * STUB: Returns null until implemented in the E3 mobile migration ticket.
 * The concrete implementation uses expo-secure-store — see TODO above.
 *
 * PROHIBITED: Do NOT implement with AsyncStorage. See ADR for why AsyncStorage
 * is banned on native surfaces (unencrypted, visible on rooted devices).
 */
export async function getNativeSession(): Promise<Session | null> {
  // TODO(E3-mobile): implement via expo-secure-store — see file header.
  // Safe stub: returns null (unauthenticated) until E3 mobile ticket implements this.
  // NEVER replace this with AsyncStorage.getItem() — AsyncStorage is banned.
  return null;
}
