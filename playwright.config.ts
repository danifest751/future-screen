import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Visual regression defaults. Snapshots live alongside the spec at
  // <spec>-snapshots/<test>-<browser>-<platform>.png. Re-baseline after
  // intentional UI changes via `npm run test:e2e:update-snapshots`.
  // Tests that don't call toHaveScreenshot are unaffected by these.
  expect: {
    toHaveScreenshot: {
      // Per-pixel colour tolerance (0..1). Lets through anti-aliasing /
      // sub-pixel font hinting noise without masking real regressions.
      threshold: 0.2,
      // Bound on how much of the image is allowed to differ. 0.5% is a
      // pragmatic ceiling for a stable layout — anything bigger likely
      // means a real change worth reviewing.
      maxDiffPixelRatio: 0.005,
      // Pause CSS transitions / animations and freeze the caret so the
      // capture is deterministic.
      animations: 'disabled',
      caret: 'hide',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      VITE_SUPABASE_URL: 'https://pyframwlnqrzeynqcvle.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
    },
  },
});
