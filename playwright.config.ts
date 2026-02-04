import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 120_000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  projects: [
    {
      name: 'chromium',
      // Use Playwright's bundled Chromium (works in CI/headless environments)
      use: { browserName: 'chromium' }
    }
  ]
});

