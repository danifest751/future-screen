import { defineConfig, devices } from '@playwright/test';

// Preview-config: runs existing E2E tests against an already-deployed Preview URL.
// No webServer — Vercel hosts it. BASE_URL is injected by verify-deploy.yml.

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error('BASE_URL env var is required for playwright.preview.config.ts');
}

// Vercel Deployment Protection: if the preview is private, browser requests
// get a 401 auth wall. The bypass header only works once per session;
// x-vercel-set-bypass-cookie=true persists it in a cookie so subsequent
// navigations pass through cleanly.
const BYPASS = process.env.VERCEL_PROTECTION_BYPASS || process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const extraHTTPHeaders = BYPASS
  ? {
      'x-vercel-protection-bypass': BYPASS,
      'x-vercel-set-bypass-cookie': 'true',
    }
  : undefined;

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
    extraHTTPHeaders,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
