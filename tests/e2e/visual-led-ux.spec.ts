import { expect, test, type Page } from '@playwright/test';

/**
 * Coverage for the UX-polish batch:
 *   1. Inline rename in SelectionPanel (no native window.prompt).
 *   2. Inline two-step "Сброс сессии" confirm (no native window.confirm).
 *   3. Esc closes the ShareDialog.
 *   4. Trash buttons on background thumbnails are visible without hover
 *      on touch viewports (<lg) — previously gated behind group-hover.
 */

const dismissOnboarding = async (page: Page) => {
  const skip = page.getByRole('button', { name: /Свой вариант/ }).first();
  if (await skip.isVisible({ timeout: 1500 }).catch(() => false)) {
    await skip.click();
  }
};

/**
 * Shared setup: open the editor, dismiss onboarding, drop a screen via
 * QuickAddToolbar's "+ Экран" so SelectionPanel becomes interactive.
 * Accessible name of that button is just "Экран" (Plus icon is decorative,
 * tooltip is in the `title` attribute which doesn't enter accessible name).
 * On desktop the bottom-nav "Экраны" tab is hidden, so an exact match is safe.
 */
const openEditorWithScreen = async (page: Page) => {
  await page.goto('/visual-led/v2');
  await dismissOnboarding(page);
  await page.getByRole('button', { name: 'Экран', exact: true }).click();
};

test.describe('Visual LED UX — desktop (1440×900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('inline rename: pencil opens input, Enter commits, Esc cancels', async ({ page }) => {
    await openEditorWithScreen(page);

    // The selected screen lands as "Экран 1" in the SelectionPanel header.
    const selectionHeader = page.locator('text=Экран 1').first();
    await expect(selectionHeader).toBeVisible();

    // Pencil button → "Переименовать экран" aria-label.
    await page.getByRole('button', { name: 'Переименовать экран' }).click();

    // Input shows up with autoFocus and the current name pre-filled.
    const renameInput = page.getByRole('textbox', { name: 'Новое имя экрана' });
    await expect(renameInput).toBeFocused();
    await expect(renameInput).toHaveValue('Экран 1');

    // Type a new name and commit via Enter.
    await renameInput.fill('Главный экран');
    await renameInput.press('Enter');

    // Input gone, new name visible.
    await expect(renameInput).toHaveCount(0);
    await expect(page.locator('text=Главный экран').first()).toBeVisible();

    // Now test the Esc-cancels-flow.
    await page.getByRole('button', { name: 'Переименовать экран' }).click();
    const reopenedInput = page.getByRole('textbox', { name: 'Новое имя экрана' });
    await reopenedInput.fill('Не сохраняй меня');
    await reopenedInput.press('Escape');

    // Esc cancels — the previous name should still be there, NOT the draft.
    await expect(page.locator('text=Не сохраняй меня')).toHaveCount(0);
    await expect(page.locator('text=Главный экран').first()).toBeVisible();
  });

  test('two-step reset confirm: Сброс сессии shows inline panel, Отмена returns to menu', async ({
    page,
  }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    await page.getByRole('button', { name: 'Дополнительные действия' }).click();

    // First click on "Сброс сессии" replaces the menuitem with the inline
    // confirm panel — it should NOT trigger a native confirm() (which
    // would be uncatchable in Playwright by default and reload the page).
    const resetItem = page.getByRole('menuitem', { name: /Сброс сессии/ });
    await expect(resetItem).toBeVisible();
    await resetItem.click();

    // Confirm panel: explicit warning text + two distinct buttons.
    await expect(page.getByText(/Сбросить всё\?/)).toBeVisible();
    const confirmBtn = page.getByRole('button', { name: 'Сбросить', exact: true });
    const cancelBtn = page.getByRole('button', { name: 'Отмена', exact: true });
    await expect(confirmBtn).toBeVisible();
    await expect(cancelBtn).toBeVisible();

    // Cancel — should NOT reload, menu items should re-appear.
    await cancelBtn.click();
    await expect(page.getByText(/Сбросить всё\?/)).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: /Сброс сессии/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Сброс view/ })).toBeVisible();
  });

  test('reopening the menu after cancel never starts in armed confirm state', async ({
    page,
  }) => {
    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    const trigger = page.getByRole('button', { name: 'Дополнительные действия' });
    await trigger.click();
    await page.getByRole('menuitem', { name: /Сброс сессии/ }).click();
    await expect(page.getByText(/Сбросить всё\?/)).toBeVisible();

    // Close menu via Escape — confirm panel should be discarded.
    await page.keyboard.press('Escape');
    await expect(page.getByText(/Сбросить всё\?/)).toHaveCount(0);

    // Reopen the menu — should land on the normal menu items, not on
    // the leftover confirm panel.
    await trigger.click();
    await expect(page.getByRole('menuitem', { name: /Сброс сессии/ })).toBeVisible();
    await expect(page.getByText(/Сбросить всё\?/)).toHaveCount(0);
  });

  test('ShareDialog closes on Escape', async ({ page }) => {
    // Mock save endpoint so we don't hit Supabase.
    await page.route('**/api/visual-led/save', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'mock-share-id' }),
      });
    });

    await openEditorWithScreen(page);

    // Open the "Сохранить проект" panel (it's collapsed by default).
    const savePanelHeader = page.getByRole('button', { name: 'Сохранить проект' });
    if ((await savePanelHeader.getAttribute('aria-expanded')) !== 'true') {
      await savePanelHeader.click();
    }

    await page.getByRole('button', { name: /Получить ссылку/ }).click();

    // Dialog appears.
    const dialogTitle = page.getByRole('heading', { name: 'Ссылка на проект' });
    await expect(dialogTitle).toBeVisible();

    // Esc closes it.
    await page.keyboard.press('Escape');
    await expect(dialogTitle).toHaveCount(0);
  });
});

test.describe('Visual LED UX — phone (375×812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('background trash button is visible without hover on touch viewport', async ({
    page,
  }) => {
    // 1×1 transparent PNG. Smallest valid image that <img> + canvas
    // decode pipelines accept; enough to add a background to the scene.
    const tinyPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    // The upload-background endpoint runs in dev; mock it so the test
    // doesn't depend on Supabase. The dispatch path adds the bg to
    // state on success or marks failed otherwise — we only care that
    // the bg ends up in the scene either way.
    await page.route('**/api/visual-led/upload-background', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          storagePath: 'mock/path.png',
          storageBucket: 'mock-bucket',
        }),
      });
    });

    await page.goto('/visual-led/v2');
    await dismissOnboarding(page);

    // SidebarRight stacks below main on phone (flex-col), so the file
    // input lives in the DOM regardless of viewport. Target the image
    // input directly.
    const imageInput = page.locator('input[type="file"][accept="image/*"]');
    await imageInput.setInputFiles({
      name: 'fixture.png',
      mimeType: 'image/png',
      buffer: Buffer.from(tinyPngBase64, 'base64'),
    });

    // Trash button on the just-added thumbnail. Tooltip "Удалить фон"
    // identifies the right one (vs. video trash with "Удалить из библиотеки").
    const trashBtn = page.getByRole('button', { name: 'Удалить фон' }).first();

    // Without any hover/focus interaction, the button should be visible
    // because lg-breakpoint classes resolve to inline-block on <lg.
    await expect(trashBtn).toBeVisible();
  });
});
