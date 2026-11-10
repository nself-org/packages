/**
 * Storybook 10 main config for @nself/ui.
 *
 * Purpose: Configure Storybook to build stories for AsyncScreen (7 states),
 *          Button, and Input, with the a11y addon for WCAG verification.
 *          Essentials (controls, actions, backgrounds, docs) live in core
 *          since Storybook 9, so no addon-essentials entry is needed.
 *          Autodocs is driven by the `tags: ['autodocs']` field on each story.
 */
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.{ts,tsx}'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
