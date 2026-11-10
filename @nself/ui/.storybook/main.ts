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

/**
 * Browser target for the preview bundle.
 *
 * Vite 6 defaults to its 'modules' list, which includes safari14. The root
 * `esbuild >=0.28.1` override gives Vite an esbuild whose table puts
 * destructuring at Safari 14.1, so every build fails with "Transforming
 * destructuring ... is not supported yet". This is the list Vite 7 uses by
 * default ('baseline-widely-available'). Storybook's own code already
 * needs chrome 100 or newer, and this is a dev-only bundle.
 */
const PREVIEW_TARGET = ['chrome107', 'edge107', 'firefox104', 'safari16'];

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.{ts,tsx}'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    build: { ...viteConfig.build, target: PREVIEW_TARGET },
    optimizeDeps: {
      ...viteConfig.optimizeDeps,
      esbuildOptions: {
        ...viteConfig.optimizeDeps?.esbuildOptions,
        target: PREVIEW_TARGET,
      },
    },
  }),
};

export default config;
