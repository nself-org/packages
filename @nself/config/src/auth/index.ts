/**
 * Auth session getters — dual-transport pattern for all nSelf surfaces.
 *
 * Purpose: Re-exports all surface-specific session getters. Each getter
 *          implements the same Session | null contract but reads from the
 *          transport appropriate for its runtime environment.
 *
 * Surface routing:
 *   Web (Astro + Vite SPA) → getWebSession()   — httpOnly cookie + /api/auth/session
 *   Native (RN + Expo)     → getNativeSession() — Expo SecureStore + /api/auth/refresh
 *   Desktop (Tauri 2)      → getTauriSession()  — tauri-plugin-store + /api/auth/refresh
 *
 * Usage with @nself/gql (T08):
 *   ```typescript
 *   // Web app:
 *   import { getWebSession } from '@nself/config/auth';
 *   const client = createGqlClient({ getSession: getWebSession });
 *
 *   // RN app:
 *   import { getNativeSession } from '@nself/config/auth';
 *   const client = createGqlClient({ getSession: getNativeSession });
 *   ```
 *
 * ADR: .claude/docs/decisions/auth-transport-security.md
 * SPORT: F08-SERVICE-INVENTORY.md — auth_server (dual-transport ADR authored)
 */

export { getWebSession } from './web-session.js';
export { getNativeSession } from './native-session.js';
export { getTauriSession } from './tauri-session.js';
