import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/deployment',
  timeout: 120000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'https://agritrace-portal.ttmychau93.workers.dev',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
  },
  outputDir: 'test-results/public-deployment',
});
