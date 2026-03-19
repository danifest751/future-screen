import { expect, test } from '@playwright/test';
import { installSupabaseMock } from './helpers/supabaseMock';
import { seedAuthSession } from './helpers/supabaseMock';

const setNativeValue = async (locator: import('@playwright/test').Locator, value: string) => {
  await locator.evaluate((el, nextValue) => {
    const element = el as HTMLInputElement | HTMLTextAreaElement;
    const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    valueSetter?.call(element, nextValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
};

test.describe('Admin workflows', () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page, { authenticated: true });
    await seedAuthSession(page);
    await page.goto('/admin/content');

    await expect(page).toHaveURL(/\/admin\/content$/);
  });

  test('filters leads and exports with the current dataset', async ({ page }) => {
    await page.goto('/admin/leads');

    await expect(page.getByRole('heading', { name: 'Лента заявок' })).toBeVisible();
    await expect(page.getByText('Показано: 2 из 2')).toBeVisible();

    await page.getByPlaceholder('Имя, телефон, email, город...').fill('Анна');
    await page.locator('select').first().selectOption('form-home');

    await expect(page.getByText('Показано: 1 из 2')).toBeVisible();
    await expect(page.getByText('Источник: form-home')).toBeVisible();
    await expect(page.getByText('Анна Смирнова')).toBeVisible();

    await page.getByRole('button', { name: 'Сбросить фильтры' }).click();
    await expect(page.getByText('Показано: 2 из 2')).toBeVisible();
  });

  test('shows the confirmation modal before clearing leads', async ({ page }) => {
    await page.goto('/admin/leads');

    await page.getByRole('button', { name: '🗑 Очистить всё' }).click();
    await expect(page.getByText('Очистить все заявки?')).toBeVisible();
    await page.getByRole('button', { name: 'Отмена' }).click();
    await expect(page.getByText('Очистить все заявки?')).toHaveCount(0);

    await page.getByRole('button', { name: '🗑 Очистить всё' }).click();
    await page.getByRole('button', { name: 'Очистить', exact: true }).click();

    await expect(page.getByText('Заявок пока нет')).toBeVisible();
  });

  test('navigates through the content hub cards', async ({ page }) => {
    await page.goto('/admin/content');

    await expect(page.getByRole('heading', { name: 'Все настройки' })).toBeVisible();
    await page.locator('a[href="/admin/packages"]').first().click();
    await expect(page).toHaveURL(/\/admin\/packages$/);
    await expect(page.getByRole('heading', { name: 'Пакеты' })).toBeVisible();

    await page.locator('a[href="/admin/content"]').first().click();
    await page.locator('a[href="/admin/categories"]').first().click();
    await expect(page).toHaveURL(/\/admin\/categories$/);
    await expect(page.getByRole('heading', { name: 'Категории' })).toBeVisible();
  });

  test('restores a contacts draft and does not overwrite it with server data', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'admin-contacts-draft',
        JSON.stringify({
          phonesText: '+79991112233\n+79994445566',
          emailsText: 'draft@example.com\nhello@example.com',
          address: 'Черновой адрес',
          workingHours: '10:00-20:00',
        })
      );
    });

    await page.goto('/admin/contacts');

    await expect(page.getByText('Восстановлен черновик')).toBeVisible();
    const contactsForm = page.locator('form').first();
    await expect(contactsForm.locator('textarea').nth(0)).toHaveValue('+79991112233\n+79994445566');
    await expect(contactsForm.locator('textarea').nth(1)).toHaveValue('draft@example.com\nhello@example.com');
    await expect(contactsForm.locator('input').nth(0)).toHaveValue('Черновой адрес');
    await expect(contactsForm.locator('input').nth(1)).toHaveValue('10:00-20:00');
  });

  test('restores package draft and filters list', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'admin-package-draft',
        JSON.stringify({
          id: '202',
          name: 'Черновик пакета',
          forFormatsText: 'Форум\nКонцерт',
          includesText: 'Экран 8x4\nМонтаж',
          optionsText: 'Режиссер эфира',
          priceHint: 'от 250 000 ₽',
        })
      );
    });

    await page.goto('/admin/packages');

    await expect(page.getByText('Восстановлен черновик формы')).toBeVisible();
    const packageForm = page.locator('form').first();
    await expect(packageForm.locator('input').nth(0)).toHaveValue('202');
    await expect(packageForm.locator('input').nth(1)).toHaveValue('Черновик пакета');

    await page.getByPlaceholder('Поиск по названию, ID, составу, опциям...').fill('Медиум');
    await expect(page.getByText('Показано 1 из 2')).toBeVisible();
    await expect(page.getByText('Медиум')).toBeVisible();
  });

  test('opens the package edit form with the selected item populated', async ({ page }) => {
    await page.goto('/admin/packages');

    await page.getByRole('button', { name: 'Редактировать' }).first().click();
    await expect(page.getByText('Редактирование пакета')).toBeVisible();

    const packageForm = page.locator('form').first();
    await expect(packageForm.locator('input').nth(0)).toHaveValue('101');
    await expect(packageForm.locator('input').nth(1)).toHaveValue('Лайт');
    await expect(packageForm.locator('textarea').nth(0)).toHaveValue('Выставка\nПрезентация');
    await expect(packageForm.locator('textarea').nth(1)).toHaveValue('Экран 4x3\nМонтаж');

    await page.getByRole('button', { name: 'Отмена' }).click();
    await expect(page.getByRole('heading', { name: 'Новый пакет' })).toBeVisible();
  });

  test('fills category form from the list and blocks navigation when there are unsaved changes', async ({ page }) => {
    await page.goto('/admin/categories');

    await expect(page.getByRole('heading', { name: 'Категории' })).toBeVisible();
    await page.getByPlaceholder('Поиск по названию, пути, описанию...').fill('Свет');
    await expect(page.getByText('Показано 1 из 2')).toBeVisible();

    await page.getByRole('button', { name: 'Редактировать' }).first().click();
    await expect(page.getByText('Редактирование категории')).toBeVisible();
    const categoryForm = page.locator('form').first();
    await expect(categoryForm.locator('input').nth(0)).toHaveValue('7');
    await expect(categoryForm.locator('input').nth(1)).toHaveValue('Свет');

    await setNativeValue(categoryForm.locator('input').nth(1), 'Свет обновлён');
    await expect(page.getByText('Есть несохраненные изменения')).toBeVisible();

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Есть несохраненные изменения');
      await dialog.dismiss();
    });

    await page.locator('a[href="/admin/packages"]').first().click();
    await expect(page).toHaveURL(/\/admin\/categories$/);

    page.removeAllListeners('dialog');

    await page.getByRole('button', { name: 'Отмена' }).click();
    await expect(page.getByText('Режим редактирования')).toHaveCount(0);
  });

  test('edits a case and keeps the form populated in edit mode', async ({ page }) => {
    await page.goto('/admin/cases');

    await expect(page.getByRole('heading', { name: 'Кейсы' })).toBeVisible();
    await page.getByRole('button', { name: 'Ред.' }).first().click();
    await expect(page.getByText('Редактирование кейса')).toBeVisible();
    const caseForm = page.locator('form').first();
    await expect(caseForm.locator('input').nth(0)).toHaveValue('forum-ekb-2024');
    await expect(caseForm.locator('input').nth(1)).toHaveValue('Форум в Екатеринбурге');

    await setNativeValue(caseForm.locator('input').nth(1), 'Форум в Екатеринбурге 2026');
    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await expect(page.getByText('Форум в Екатеринбурге 2026')).toBeVisible();
  });
});
