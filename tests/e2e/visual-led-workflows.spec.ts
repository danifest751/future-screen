import { expect, test } from '@playwright/test';

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
    ui: {
      showCabinetGrid: true,
      showAssistGuides: true,
      showStatsOverlay: true,
    },
  },
};

test.describe('Visual LED v2 workflows', () => {
  test('supports scene history shortcuts and restores autosaved state', async ({ page }) => {
    await page.goto('/visual-led/v2');

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

