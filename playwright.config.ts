import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    }
  ],

  webServer: isCI
    ? [
        {
          command: 'node dist/apps/api/index.js',
          url: 'http://localhost:3001/health',
          reuseExistingServer: false,
          timeout: 30_000
        },
        {
          command: 'npx serve client/dist -l 5173 -s',
          url: 'http://localhost:5173',
          reuseExistingServer: false,
          timeout: 10_000
        }
      ]
    : {
        command: 'yarn dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true
      }
});
