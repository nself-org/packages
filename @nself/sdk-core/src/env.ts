/**
 * env.ts — Runtime environment detection for @nself/sdk-core.
 *
 * Purpose: Detect which JS runtime context code is executing in, so higher
 *          layers can choose the appropriate transport or feature path.
 * Inputs:  Global environment signals (typeof window, navigator, process, import.meta).
 * Outputs: Boolean predicates and NselfEnvironment literal type.
 * Constraints: No framework imports (React/RN/Tauri); pure TS; tree-shakeable.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/sdk-core (env detection)
 */

/** Literal union of all supported nSelf runtime environments. */
export type NselfEnvironment = 'web' | 'native' | 'desktop' | 'server';

/** True when running inside a browser context (window + document available). */
export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * True when running inside React Native.
 * React Native sets navigator.product to 'ReactNative'.
 */
export const isNative = (): boolean =>
  typeof navigator !== 'undefined' &&
  navigator.product === 'ReactNative';

/**
 * True when running inside a Tauri desktop shell.
 * Tauri injects __TAURI__ onto the window object.
 */
export const isDesktop = (): boolean =>
  isBrowser() &&
  typeof (window as unknown as Record<string, unknown>)['__TAURI__'] !== 'undefined';

/**
 * True when running in a Node.js / server-side context (no window).
 * Also matches SSR environments (Vite SSR, Astro, etc.).
 */
export const isServer = (): boolean =>
  !isBrowser() && !isNative();

/**
 * Detect the current runtime environment as a discriminated literal.
 * Evaluation order: native → desktop → server → web.
 */
export const detectEnvironment = (): NselfEnvironment => {
  if (isNative()) return 'native';
  if (isDesktop()) return 'desktop';
  if (isServer()) return 'server';
  return 'web';
};
