/**
 * Storybook preview: global parameters for @nself/ui stories.
 * Storybook 9+ API: backgrounds use `options` plus `initialGlobals`.
 * Actions: `actions.argTypesRegex` still exists but is not recommended, and
 * react-docgen does not infer the handlers that Button and Input inherit
 * from the HTML attribute types. The stories assign `fn()` from
 * `storybook/test` to their handlers instead, so the Actions panel logs them.
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
