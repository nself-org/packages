/**
 * Storybook preview: global parameters for @nself/ui stories.
 * Storybook 9+ API: backgrounds use `options` plus `initialGlobals`, and the
 * actions `argTypesRegex` matcher is gone (use `fn()` from `storybook/test`).
 */
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        light: { name: 'light', value: '#ffffff' },
        dark: { name: 'dark', value: '#0f172a' },
        surface: { name: 'surface', value: '#f8fafc' },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'light' },
  },
};

export default preview;
