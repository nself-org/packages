/**
 * Tauri session getter stub — tauri-plugin-store transport for Tauri 2 desktop surfaces.
 *
 * Purpose: Typed stub defining the getTauriSession() contract. Concrete implementation
 *          reads the refresh token from tauri-plugin-store with OS keychain encryption
 *          and exchanges it for a short-lived access token via /api/auth/refresh.
 *
 * Inputs:  None — reads from tauri-plugin-store (OS keychain backed).
 * Outputs: Session | null — null means unauthenticated or token not found in store.
 *
 * Constraints:
 *   - MUST use tauri-plugin-store with encryption — NEVER unencrypted stores or
 *     localStorage (even though Tauri wraps a webview, the web localStorage is NOT used
 *     for auth; the Tauri backend process owns the store via OS keychain).
 *   - The Tauri backend process reads the keychain — not the webview — so httpOnly
 *     cookies are NOT used for desktop. This matches the native transport pattern.
 *   - This stub returns null (safe default). Do NOT replace null with localStorage.
 *   - Full implementation: E3 desktop migration tickets (per-app, uses tauri-plugin-store).
 *
 * TODO (E3 desktop tickets): Replace this stub body with Tauri invoke calls:
 *   ```typescript
 *   import { invoke } from '@tauri-apps/api/core';
 *   // Tauri backend command reads tauri-plugin-store (OS keychain encrypted)
 *   const refreshToken = await invoke<string | null>('get_refresh_token');
 *   if (!refreshToken) return null;
 *   const res = await fetch('/api/auth/refresh', {
 *     method: 'POST',
 *     headers: { Authorization: `Bearer ${refreshToken}` },
 *   });
 *   if (!res.ok) return null;
 *   return res.json() as Promise<Session>;
 *   ```
 *   Crate: tauri-plugin-store v2 with `stronghold` feature for OS keychain backing.
 *   macOS: Keychain Access · Windows: DPAPI · Linux: Secret Service (libsecret)
 *
 * SPORT: F08-SERVICE-INVENTORY.md — auth_server service (dual-transport ADR authored)
 * ADR:   .claude/docs/decisions/auth-transport-security.md §Desktop Transport
 * Refs:  T-P3-E1-W3-S6-T11 (this ticket), T-P3-E1-W2-S4-T08 (@nself/gql getSession)
 */

import type { Session } from '@nself/types';

/**
 * Returns the current Tauri desktop session from tauri-plugin-store (OS keychain).
 *
 * STUB: Returns null until implemented in the E3 desktop migration ticket.
 * The concrete implementation uses tauri-plugin-store — see TODO above.
 *
 * PROHIBITED: Do NOT implement with localStorage or sessionStorage — Tauri wraps
 * a webview but auth tokens must live in the Tauri backend process store (OS keychain),
 * not in the webview's JS-accessible storage. See ADR for the full rationale.
 */
export async function getTauriSession(): Promise<Session | null> {
  // TODO(E3-desktop): implement via tauri-plugin-store + OS keychain — see file header.
  // Safe stub: returns null (unauthenticated) until E3 desktop ticket implements this.
  // NEVER replace this with localStorage or sessionStorage.
  return null;
}
