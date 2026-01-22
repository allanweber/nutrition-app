import { defineConfig, devices } from '@playwright/test';

// Test server runs on port 3001 to avoid conflicts with dev server on 3000
const TEST_PORT = process.env.PORT || '3001';
const TEST_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${TEST_PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: TEST_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
  // When running via run-e2e.sh, the script manages the server
  // When running directly or in CI, start a server
  webServer: {
    command: `npx dotenv -e .env.test -o -- npm run dev -- --port ${TEST_PORT}`,
    url: TEST_URL,
    reuseExistingServer: true, // Reuse if script already started one
    timeout: 120 * 1000,
  },
});
