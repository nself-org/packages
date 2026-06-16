/**
 * @nself/ui — package smoke tests.
 *
 * Purpose: Verify that all public exports are present and have the correct types.
 *          These are structural smoke tests — they don't render components (no DOM
 *          available in vitest without jsdom), but ensure the module graph is correct
 *          and TypeScript types are sound.
 *
 * Constraints: No DOM/jsdom — vitest default environment is 'node'.
 *              Component render tests belong in consuming app test suites with jsdom.
 * SPORT: F-NSELF-UI-01 (package smoke)
 */

import { describe, it, expect } from 'vitest';
import * as ui from '../index.js';

describe('@nself/ui exports', () => {
  it('exports AsyncScreen', () => {
    expect(ui.AsyncScreen).toBeDefined();
    expect(typeof ui.AsyncScreen).toBe('function');
  });

  it('exports ErrorBoundary', () => {
    expect(ui.ErrorBoundary).toBeDefined();
    expect(typeof ui.ErrorBoundary).toBe('function');
  });

  it('exports Button', () => {
    expect(ui.Button).toBeDefined();
    expect(typeof ui.Button).toBe('object'); // React.forwardRef returns object
  });

  it('exports Input', () => {
    expect(ui.Input).toBeDefined();
    expect(typeof ui.Input).toBe('object'); // React.forwardRef returns object
  });

  it('exports Card', () => {
    expect(ui.Card).toBeDefined();
    expect(typeof ui.Card).toBe('function');
  });

  it('has exactly the expected named exports', () => {
    const exportedKeys = Object.keys(ui).sort();
    expect(exportedKeys).toEqual([
      'AsyncScreen',
      'Button',
      'Card',
      'ErrorBoundary',
      'Input',
    ]);
  });
});
