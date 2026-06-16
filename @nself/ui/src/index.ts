/**
 * @nself/ui — shared component library for all nSelf web surfaces.
 *
 * Purpose: Single import source for all shared UI primitives across nSelf.
 *          AsyncScreen is the mandatory data-fetching wrapper (canonical-patterns.md §4).
 *          ErrorBoundary is the mandatory route-level error isolator (canonical-patterns.md §5).
 *          Button, Input, Card are base primitives — never hand-rolled in apps.
 *
 * Inputs:  React 19 peer dependency required.
 * Outputs: UI primitives + async state management wrapper.
 *
 * Constraints:
 *   - No data fetching in this package — purely presentational.
 *   - No Tailwind utility import — apps apply Tailwind via className props.
 *   - React 19 minimum. JSX transform assumed (no React import needed in consumers).
 *
 * Usage:
 *   import { AsyncScreen, ErrorBoundary, Button, Input, Card } from '@nself/ui';
 *
 * SOT: F-NSELF-UI-01
 */

// 7-state async data wrapper (mandatory on every data surface)
export { AsyncScreen } from './AsyncScreen.js';
export type { AsyncScreenProps, AsyncScreenSlots } from './AsyncScreen.js';

// Route-level error boundary (mandatory on every route component)
export { ErrorBoundary } from './ErrorBoundary.js';
export type { ErrorBoundaryProps } from './ErrorBoundary.js';

// Base primitives
export { Button } from './Button.js';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.js';

export { Input } from './Input.js';
export type { InputProps } from './Input.js';

export { Card } from './Card.js';
export type { CardProps } from './Card.js';
