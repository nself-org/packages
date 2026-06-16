/**
 * @nself/ui — canonical shared design system for all nSelf web surfaces.
 *
 * Purpose: Single import source for shared UI primitives, async state management,
 *          and the 7-state AsyncScreen wrapper across all nSelf Vite SPA and Astro surfaces.
 * Inputs:  React 19 peer dependency required.
 * Outputs: AsyncScreen + 7 state sub-components, useAsyncState hook,
 *          shadcn/Radix primitives (Button/Input/Card/Badge/Dialog/Toast),
 *          ErrorBoundary, Tailwind theme preset.
 * Constraints:
 *   - No data fetching — purely presentational + state management hooks.
 *   - No Tailwind utility import in JS — apps wire up the preset via tailwind.config.ts.
 *   - React 19 minimum. JSX transform assumed (no React import needed in consumers).
 *   - WCAG 2.1 AA on all exported components.
 * Usage:
 *   import { AsyncScreen, useAsyncState, Button } from '@nself/ui';
 *   import { nSelfPreset } from '@nself/ui/theme';
 * SOT: F-NSELF-UI-01
 */

// ─── AsyncScreen — 7-state wrapper (mandatory on every data surface) ──────────
export { AsyncScreen } from './async-screen/index.js';
export type { AsyncScreenProps, AsyncScreenSlots } from './async-screen/index.js';

// All 7 state sub-components (use for custom slot overrides)
export {
  LoadingState,
  EmptyState,
  ErrorState,
  OfflineState,
  PermissionDeniedState,
  RateLimitedState,
} from './async-screen/index.js';
export type {
  LoadingStateProps,
  EmptyStateProps,
  ErrorStateProps,
  OfflineStateProps,
  PermissionDeniedStateProps,
  RateLimitedStateProps,
} from './async-screen/index.js';

// ─── useAsyncState hook ───────────────────────────────────────────────────────
export { useAsyncState } from './hooks/useAsyncState.js';
export type { UseAsyncStateResult } from './hooks/useAsyncState.js';

// ─── Route-level error boundary ───────────────────────────────────────────────
export { ErrorBoundary } from './ErrorBoundary.js';
export type { ErrorBoundaryProps } from './ErrorBoundary.js';

// ─── Base primitives (shadcn/Radix thin wrappers) ────────────────────────────
export { Button } from './Button.js';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.js';

export { Input } from './Input.js';
export type { InputProps } from './Input.js';

export { Card } from './Card.js';
export type { CardProps } from './Card.js';
