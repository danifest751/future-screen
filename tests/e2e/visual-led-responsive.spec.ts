import { expect, test, type Page } from '@playwright/test';

/**
 * Onboarding gate (PresetPicker) shows on the editor route when there's
 * no preset, no URL `?project=` and no scenes with content. Responsive
 * tests want the editor shell, so they dismiss the gate by clicking
 * "Свой вариант" — a sentinel preset that just clears the gate.
 */
const dismissOnboarding = async (page: Page) => {
  const skip = page.getByRole('button', { name: /Свой вариант/ }).first();
  try {
    await skip.scrollIntoViewIfNeeded({ timeout: 2000 });
    await skip.click({ timeout: 2000 });
  } catch {
    // Onboarding gate not present — already in editor.
  }
};

test.describe('Visual LED responsive — phone (375×812, iPhone X)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('shows the bottom tab bar and hides SidebarLeft', async ({ page }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    const tabBar = page.getByRole('navigation', { name: 'Инструменты' });
    await expect(tabBar).toBeVisible();

    // SidebarLeft panel headers should NOT be visible on phone (they're
    // rendered with `hidden lg:flex`). Drawer is closed, so the only
    // accessible "Масштаб" button should be the tab bar one.
    const visibleScaleButtons = page.getByRole('button', { name: 'Масштаб' });
    await expect(visibleScaleButtons).toHaveCount(1);
  });

  test('opens the tools drawer on tab tap and closes via the X button', async ({ page }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    const tabBar = page.getByRole('navigation', { name: 'Инструменты' });
    await tabBar.getByRole('button', { name: 'Масштаб' }).click();

    const drawer = page.getByRole('dialog', { name: 'Масштаб' });
    await expect(drawer).toBeVisible();

    await drawer.getByRole('button', { name: 'Закрыть' }).click();
    await expect(drawer).not.toBeVisible();
  });

  test('toggles drawer off when the same tab is tapped twice', async ({ page }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    const screensTab = page
      .getByRole('navigation', { name: 'Инструменты' })
      .getByRole('button', { name: 'Экраны' });
    await screensTab.click();
    await expect(page.getByRole('dialog', { name: 'Экраны' })).toBeVisible();

    await screensTab.click();
    await expect(page.getByRole('dialog', { name: 'Экраны' })).not.toBeVisible();
  });
});

test.describe('Visual LED responsive — tablet portrait (768×1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('still shows the bottom tab bar (drawer drives the toolset below lg)', async ({
    page,
  }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    await expect(page.getByRole('navigation', { name: 'Инструменты' })).toBeVisible();
  });

  test('keeps SidebarRight (Фоны/Видео) visible inline', async ({ page }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    // SidebarRight renders Фоны and Видео cards. Both should be visible
    // on tablet without opening any drawer.
    await expect(page.locator('text=Фоны').first()).toBeVisible();
    await expect(page.locator('text=Видео').first()).toBeVisible();
  });
});

test.describe('Visual LED responsive — desktop (1440×900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('hides the bottom tab bar and shows SidebarLeft inline', async ({ page }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    const tabBar = page.getByRole('navigation', { name: 'Инструменты' });
    await expect(tabBar).not.toBeVisible();

    // The SidebarLeft "Масштаб" collapsible header should be the only
    // visible "Масштаб" button now.
    await expect(page.getByRole('button', { name: 'Масштаб' })).toHaveCount(1);
  });

  test('collapses a panel via the header toggle and persists in localStorage', async ({
    page,
  }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    const scaleHeader = page.getByRole('button', { name: 'Масштаб' });
    await expect(scaleHeader).toHaveAttribute('aria-expanded', 'true');

    await scaleHeader.click();
    await expect(scaleHeader).toHaveAttribute('aria-expanded', 'false');

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('vled-panel:scale'),
    );
    expect(stored).toBe('closed');

    // Wait past the 800ms autosave debounce so the preset choice from
    // dismissOnboarding sticks across reload — otherwise onboarding can
    // re-show and the panel header doesn't render.
    await page.waitForTimeout(900);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Масштаб' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  test('opens StageHeader «⋯» menu and closes it via Escape', async ({ page }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    const trigger = page.getByRole('button', { name: 'Дополнительные действия' });
    await trigger.click();

    const resetView = page.getByRole('menuitem', { name: /Сброс view/ });
    await expect(resetView).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Сброс сессии/ })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(resetView).not.toBeVisible();
  });
});
