import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
    '@storybook/addon-mcp',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': path.resolve(dirname, '../src'),
          '@/app': path.resolve(dirname, '../app'),

          'storybook/highlight': path.resolve(dirname, '../node_modules/storybook/dist/highlight/index.js'),
          'storybook/internal/csf': path.resolve(dirname, '../node_modules/storybook/dist/csf/index.js'),
          '@storybook/global': path.resolve(dirname, '../node_modules/@storybook/global/dist/index.js'),
        },
      },
    });
  },
  managerVite: async (config) => {
    return mergeConfig(config, {
      build: {
        rollupOptions: {
          external: [
            'storybook/highlight',
            'storybook/internal/csf',
            '@storybook/global',
          ],
        },
      },
    });
  },
};

export default config;
