import { expect, test } from '@playwright/test';
import { installSupabaseMock, seedAuthSession } from './helpers/supabaseMock';

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
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('filters leads and exports with the current dataset', async ({ page }) => {
    await page.goto('/admin/leads');

    await expect(page.getByRole('heading', { name: /лента заявок|leads feed/i })).toBeVisible();
    await expect(page.getByText(/(показано|shown).*2.*2/i)).toBeVisible();

    await page.getByRole('textbox').first().fill('79990000002');
    await page.locator('select').first().selectOption('form-home');

    await expect(page.getByText(/(показано|shown).*1.*2/i)).toBeVisible();
    await expect(page.getByText(/(источник|source):\s*form-home/i)).toBeVisible();
    await expect(page.getByText('+79990000002')).toBeVisible();

    await page.getByRole('button', { name: /сбросить фильтры|reset filters/i }).click();
    await expect(page.getByText(/(показано|shown).*2.*2/i)).toBeVisible();
  });

  test('shows the confirmation modal before clearing leads', async ({ page }) => {
    await page.goto('/admin/leads');

    await page.getByRole('button', { name: /очистить все|clear all/i }).click();
    await expect(page.getByText(/очистить все заявки|clear all leads/i)).toBeVisible();
    await page.getByRole('button', { name: /отмена|cancel/i }).click();
    await expect(page.getByText(/очистить все заявки|clear all leads/i)).toHaveCount(0);

    await page.getByRole('button', { name: /очистить все|clear all/i }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: /очистить|clear/i }).click();

    await expect(page.getByText(/заявки удалены|leads deleted/i)).toBeVisible();
  });

  test('navigates through the dashboard content cards', async ({ page }) => {
    // The standalone /admin/content hub was retired (the same cards live
    // inside the dashboard now); this test exercises the dashboard
    // section-card grid as the new home for those entry points.
    await page.goto('/admin');

    await page.locator('a[href="/admin/packages"]').first().click();
    await expect(page).toHaveURL(/\/admin\/packages$/);
    await expect(page.getByRole('heading', { name: /пакеты|packages/i })).toBeVisible();

    await page.goto('/admin');
    await page.locator('a[href="/admin/categories"]').first().click();
    await expect(page).toHaveURL(/\/admin\/categories$/);
    await expect(page.getByRole('heading', { name: /категории|categories/i })).toBeVisible();
  });

  test('legacy /admin/content URL redirects to dashboard', async ({ page }) => {
    await page.goto('/admin/content');
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('loads contacts form from data source and ignores stale draft', async ({ page }) => {
    await page.addInitScript(() => {
      const draft = {
        phonesText: '+79991112233\n+79994445566',
        emailsText: 'draft@example.com\nhello@example.com',
        address: 'Draft address',
        workingHours: '10:00-20:00',
      };
      window.localStorage.setItem('admin-contacts-draft-v2-ru', JSON.stringify(draft));
      window.localStorage.setItem('admin-contacts-draft-v2-en', JSON.stringify(draft));
    });

    await page.goto('/admin/contacts');

    await expect(page.getByText(/восстановлен черновик|draft restored/i)).toHaveCount(0);
    const contactsForm = page.locator('form').first();
    await expect(contactsForm.locator('textarea').nth(0)).not.toHaveValue('+79991112233\n+79994445566');
    await expect(contactsForm.locator('textarea').nth(1)).not.toHaveValue('draft@example.com\nhello@example.com');
    await expect(contactsForm.locator('input').nth(0)).not.toHaveValue('Draft address');
    await expect(contactsForm.locator('input').nth(1)).not.toHaveValue('10:00-20:00');
  });

  test('shows package draft marker and filters list', async ({ page }) => {
    await page.addInitScript(() => {
      const draft = {
        id: '202',
        name: 'Draft package',
        forFormatsText: 'Forum\nConcert',
        includesText: 'Screen 8x4\nSetup',
        optionsText: 'Operator',
        priceHint: 'from 250 000',
      };
      window.localStorage.setItem('admin-package-draft-v2-ru', JSON.stringify(draft));
      window.localStorage.setItem('admin-package-draft-v2-en', JSON.stringify(draft));
    });

    await page.goto('/admin/packages');

    await expect(page.getByText(/восстановлен черновик формы|form draft restored/i)).toBeVisible();

    await page.getByRole('textbox').last().fill('102');
    await expect(page.getByText(/(показано|shown).*1.*2/i)).toBeVisible();
    await expect(page.getByText('ID: 102')).toBeVisible();
  });

  test('opens the package edit form with the selected item populated', async ({ page }) => {
    await page.goto('/admin/packages');

    await page.getByRole('button', { name: /редактировать|edit/i }).first().click();
    await expect(page.getByText(/редактирование пакета|edit package/i)).toBeVisible();

    const packageForm = page.locator('form').first();
    await expect(packageForm.locator('input').nth(0)).toHaveValue('101');
    await expect(packageForm.locator('input').nth(1)).not.toHaveValue('');
    await expect(packageForm.locator('textarea').nth(0)).not.toHaveValue('');
    await expect(packageForm.locator('textarea').nth(1)).not.toHaveValue('');

    await page.getByRole('button', { name: /отмена|cancel/i }).click();
    await expect(page.getByRole('heading', { name: /новый пакет|new package/i })).toBeVisible();
  });

  test('fills category form from the list and blocks navigation when there are unsaved changes', async ({ page }) => {
    await page.goto('/admin/categories');

    await expect(page.getByRole('heading', { name: /категории|categories/i })).toBeVisible();
    await page.getByRole('textbox').first().fill('/rent/light');
    await expect(page.getByText(/(показано|shown).*1.*2/i)).toBeVisible();

    await page.getByRole('button', { name: /редактировать|edit/i }).first().click();
    await expect(page.getByText(/редактирование категории|edit category/i)).toBeVisible();
    const categoryForm = page.locator('form').first();
    await expect(categoryForm.locator('input').nth(0)).toHaveValue('7');
    await expect(categoryForm.locator('input').nth(1)).not.toHaveValue('');

    await setNativeValue(categoryForm.locator('input').nth(1), 'Light updated');
    await expect(page.getByText(/есть несохраненные изменения|you have unsaved changes/i)).toBeVisible();

    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });

    await page.locator('a[href="/admin/packages"]').first().click();
    await expect(page).toHaveURL(/\/admin\/categories$/);

    page.removeAllListeners('dialog');

    await page.getByRole('button', { name: /отмена|cancel/i }).click();
    await expect(page.getByText(/режим редактирования|edit mode/i)).toHaveCount(0);
  });

  test('edits a case and keeps the form populated in edit mode', async ({ page }) => {
    await page.goto('/admin/cases');

    await expect(page.getByRole('heading', { name: /кейсы|cases/i })).toBeVisible();
    await page.getByRole('button', { name: /ред|edit/i }).first().click();
    await expect(page.getByText(/редактирование кейса|edit case/i)).toBeVisible();
    const caseForm = page.locator('form').first();
    await expect(caseForm.locator('input').nth(0)).toHaveValue('forum-ekb-2024');
    await expect(caseForm.locator('input').nth(1)).not.toHaveValue('');

    await setNativeValue(caseForm.locator('input').nth(1), 'Forum in Yekaterinburg 2026');
    await page.getByRole('button', { name: /сохранить изменения|save changes/i }).click();

    await expect(caseForm.locator('input').nth(1)).toHaveValue('Forum in Yekaterinburg 2026');
  });
});
