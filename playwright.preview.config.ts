import { defineConfig, devices } from '@playwright/test';

// Preview-config: runs existing E2E tests against an already-deployed Preview URL.
// No webServer — Vercel hosts it. BASE_URL is injected by verify-deploy.yml.

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error('BASE_URL env var is required for playwright.preview.config.ts');
}

export default defineConfig({
  testDir: './tests/e2e',
  // Скипаем сценарии, которые требуют залогиненного админа или локальной БД.
  // Пока активны только smoke- и routes-тесты.
  testMatch: ['smoke.spec.ts', 'routes.spec.ts'],
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
