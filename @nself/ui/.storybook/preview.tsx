/**
 * Storybook preview — global decorators and parameters for @nself/ui stories.
 */
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark',  value: '#0f172a' },
        { name: 'surface', value: '#f8fafc' },
      ],
    },
  },
};

export default preview;
