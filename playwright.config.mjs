import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './browser-tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://127.0.0.1:8083', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: 'node scripts/build.mjs --serve --port=8083',
    url: 'http://127.0.0.1:8083',
    reuseExistingServer: false,
    env: { SITE_OUTPUT_DIR: '.cache/browser-site', SITE_PATH_PREFIX: '/' },
    timeout: 60000,
  },
});
