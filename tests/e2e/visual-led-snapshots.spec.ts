import { expect, test, type Page } from '@playwright/test';

/**
 * Visual regression baseline for the Visual LED editor. Each test
 * captures one canonical view as a PNG snapshot under
 * `visual-led-snapshots.spec.ts-snapshots/`. Playwright suffixes the
 * file with browser + platform, so Windows / Linux / macOS get their
 * own baselines and CI on a different OS will not blow up — it'll just
 * need its own first-run baseline.
 *
 * Re-baseline after an intentional UI change with:
 *   `npm run test:e2e:update-snapshots`
 *
 * Defaults (threshold, maxDiffPixelRatio, animations) come from
 * playwright.config.ts → `expect.toHaveScreenshot`.
 */

const dismissOnboarding = async (page: Page) => {
  const skip = page.getByRole('button', { name: /Свой вариант/ }).first();
  if (await skip.isVisible({ timeout: 1500 }).catch(() => false)) {
    await skip.click();
  }
};

/**
 * Settle the page before snapshotting:
 *   - wait for fonts so glyph metrics are stable;
 *   - wait for the canvas to render at least once (renderScene runs in
 *     a useEffect that depends on the active scene).
 * Without this, captures intermittently land mid-paint and produce
 * threshold-blowing diffs that look like real regressions.
 */
const settle = async (page: Page) => {
  await page.evaluate(() => document.fonts?.ready);
  await page
    .locator('canvas[data-vled-canvas="true"]')
    .waitFor({ state: 'visible' });
  // One animation frame so the canvas finishes its first imperative draw.
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => r())),
  );
};

test.describe('Visual LED snapshots — desktop (1440×900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('editor shell with one screen placed', async ({ page }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    // Drop a default screen via QuickAddToolbar so SelectionPanel /
    // SceneMetricsBar render with content (the empty states would
    // hide too much of the layout from the snapshot).
    await page.getByRole('button', { name: 'Экран', exact: true }).click();

    await settle(page);

    // Mask every canvas — the main planner canvas paints whatever the
    // current scene contains, and the DemoThumbnail canvases in the
    // video library run their own rAF loops that ignore CSS
    // `animations: disabled`. Both are pixel-level dynamic and would
    // diff each run; the surrounding chrome is what we actually want
    // to lock down.
    const canvasMask = page.locator('canvas');

    await expect(page).toHaveScreenshot('editor-desktop.png', {
      fullPage: false,
      mask: [canvasMask],
    });
  });
});

test.describe('Visual LED snapshots — phone (375×812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('mobile shell with bottom tab bar (drawer closed)', async ({ page }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);
    await settle(page);

    const canvasMask = page.locator('canvas');

    await expect(page).toHaveScreenshot('shell-phone.png', {
      fullPage: false,
      mask: [canvasMask],
    });
  });
});
