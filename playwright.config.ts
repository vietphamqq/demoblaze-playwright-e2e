import { defineConfig, devices } from '@playwright/test';
import { config } from './src/config/env';

const launchOptions = { executablePath: config.chromiumPath };
const uiTests = /tests\/ui\/.*\.spec\.ts/;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: config.isCI,
  retries: config.retries,
  workers: config.workers ?? (config.isCI ? 4 : undefined),
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: config.isCI
    ? [['list'], ['blob'], ['github']]
    : [['list'], ['html', { outputFolder: process.env.HTML_REPORT_DIR || 'reports/html', open: 'never' }]],

  use: {
    baseURL: config.baseUrl,
    headless: config.headless,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: config.video,
  },

  projects: [
    { name: 'chromium', testMatch: uiTests, use: { ...devices['Desktop Chrome'], launchOptions } },
    { name: 'firefox', testMatch: uiTests, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: uiTests, use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', testMatch: uiTests, use: { ...devices['Pixel 7'], launchOptions } },
    { name: 'api', testMatch: /tests\/api\/.*\.spec\.ts/ },
    { name: 'perf', testMatch: /tests\/perf\/.*\.spec\.ts/, retries: 0, timeout: 180_000 },
  ],
});
