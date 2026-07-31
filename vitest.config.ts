import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@/app', replacement: path.resolve(dirname, 'app') },
      { find: '@', replacement: path.resolve(dirname, 'src') },
    ],
  },
  test: {
    coverage: {
      provider: 'v8',
      include: [
        'src/utils/soroban.ts',
        'src/utils/contract-stats.ts',
        'src/utils/governance.ts',
        'src/lib/contract-events.ts',
        'src/lib/contract-event-stream-state.ts',
        'src/lib/contract/**/*.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        // soroban.ts has many internal XDR-parsing branches (transaction
        // result decoding, retry/error paths) that are only reachable with
        // deep Stellar SDK payload mocking. 74% is the current, verified
        // level; raise this incrementally as those paths get covered.
        branches: 74,
        statements: 90,
      },
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
    },
    projects: [
      {
        extends: true,
        test: {
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            // Only run Storybook browser tests when STORYBOOK_TESTS=1 is set
            // (requires: npx playwright install chromium)
            enabled: process.env.STORYBOOK_TESTS === '1',
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
        },
      },
    ],
  },
});
