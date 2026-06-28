import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 120000,
  fullyParallel: false,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10000,
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'off',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
