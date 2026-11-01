import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/database',
  outputDir: '.tmp-analysis/database-test-results',
  workers: 1,
  timeout: 120000,
  expect: { timeout: 30000 },
  use: {
    baseURL: 'http://127.0.0.1:8788',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'node scripts/start-database-test.mjs',
    url: 'http://127.0.0.1:8788',
    timeout: 180000,
    reuseExistingServer: false,
  },
});
