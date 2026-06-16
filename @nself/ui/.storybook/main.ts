/**
 * Storybook 8 main config for @nself/ui.
 *
 * Purpose: Configure Storybook to build stories for AsyncScreen (7 states),
 *          Button, and Input — with a11y addon for WCAG verification.
 */
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.{ts,tsx}'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
