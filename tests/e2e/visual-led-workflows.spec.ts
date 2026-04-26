import { expect, test, type Page } from '@playwright/test';

const PROJECT_ID = '123e4567-e89b-12d3-a456-426614174000';

const loadedProjectPayload = {
  state: {
    scenes: [
      {
        id: 'scene-loaded',
        name: 'Loaded Scene',
        backgrounds: [],
        activeBackgroundId: null,
        elements: [],
        selectedElementId: null,
        scaleCalib: null,
        assist: null,
        view: { scale: 1, minScale: 0.35, maxScale: 6, offsetX: 0, offsetY: 0 },
        canvasWidth: 1280,
        canvasHeight: 720,
      },
    ],
    activeSceneId: 'scene-loaded',
    videos: [],
    // The onboarding gate skips when a preset is selected; the share-link
    // flow is "user already onboarded somewhere else", so a sentinel
    // __custom__ slug is the right marker. Without it, the hydrate test
    // races with the URL-strip and falls into the onboarding gate.
    selectedPresetSlug: '__custom__',
    ui: {
      showCabinetGrid: true,
      showAssistGuides: true,
      showStatsOverlay: true,
    },
  },
};

/**
 * The editor is gated by PresetPicker on a fresh visit (no preset, no
 * `?project=`, no scene content). Tests that want the editor shell skip
 * the gate by clicking "Свой вариант".
 */
const dismissOnboarding = async (page: Page) => {
  const skip = page.getByRole('button', { name: /Свой вариант/ }).first();
  if (await skip.isVisible({ timeout: 1500 }).catch(() => false)) {
    await skip.click();
  }
};

test.describe('Visual LED v2 workflows', () => {
  test('supports scene history shortcuts and restores autosaved state', async ({ page }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    const root = page.locator('[data-vled-root="true"]');
    const canvas = page.locator('canvas[data-vled-canvas="true"]');
    await expect(root).toBeVisible();
    await expect(canvas).toBeVisible();
    await expect(page.getByText('default', { exact: true })).toBeVisible();

    // Add a scene via top tabs "+" control.
    await page.locator('header button.h-6.w-6').click();
    await expect(page.getByText('scene 2', { exact: true })).toBeVisible();

    // Undo and redo via global shortcuts handled by StageHeader.
    await page.keyboard.press('ControlOrMeta+z');
    await expect(page.getByText('scene 2', { exact: true })).toHaveCount(0);

    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(page.getByText('scene 2', { exact: true })).toBeVisible();

    // Debounced autosave should persist scenes in localStorage.
    await page.waitForTimeout(900);
    const persistedScenes = await page.evaluate(() => {
      const raw = window.localStorage.getItem('vled-v2-state');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        state?: { scenes?: unknown[]; tool?: unknown; drag?: unknown };
      };
      return {
        sceneCount: parsed.state?.scenes?.length ?? 0,
        tool: parsed.state?.tool ?? null,
        drag: parsed.state?.drag ?? null,
      };
    });
    expect(persistedScenes).toEqual({
      sceneCount: 2,
      tool: null,
      drag: null,
    });

    await page.reload();
    await expect(page.getByText('scene 2', { exact: true })).toBeVisible();
  });

  test('hydrates project by ?project= id and cleans query parameter', async ({ page }) => {
    let loadCalls = 0;
    await page.route('**/api/visual-led/load**', async (route) => {
      loadCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(loadedProjectPayload),
      });
    });

    await page.goto(`/visual-led?project=${PROJECT_ID}`);

    await expect(page).toHaveURL(/\/visual-led$/);
    await expect(page.getByText('Loaded Scene', { exact: true })).toBeVisible();
    expect(loadCalls).toBe(1);
  });
});

