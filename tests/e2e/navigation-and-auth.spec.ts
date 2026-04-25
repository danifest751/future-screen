import { expect, test } from '@playwright/test';
import { installSupabaseMock } from './helpers/supabaseMock';

test.describe('Public navigation', () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page, { authenticated: false });
  });

  test('moves through main public routes and opens the admin login modal', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/(Future Screen|Фьючер Скрин)/i);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

    await page.goto('/support');
    await expect(page).toHaveURL(/\/support$/);
    await expect(page.getByRole('heading').first()).toBeVisible();

    await page.goto('/cases');
    await expect(page).toHaveURL(/\/cases$/);
    await expect(page.getByRole('heading').first()).toBeVisible();

    await page.goto('/rent');
    await expect(page).toHaveURL(/\/rent$/);
    await expect(page.getByRole('heading').first()).toBeVisible();

    await page.goto('/');
    await page.locator('header button[title]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.locator('#login-email').fill('admin@example.com');
    await page.locator('#login-password').fill('password');
    await page.locator('[role="dialog"] form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/admin\/content$/);
    await expect(page.getByRole('heading', { name: /все настройки|all settings/i })).toBeVisible();
  });
});

test.describe('Admin access control', () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page, { authenticated: false });
  });

  test('redirects anonymous users away from admin routes', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.goto('/admin/packages');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('header button[title]').first()).toBeVisible();
  });

  test('allows authenticated users to open admin dashboard and use quick links', async ({ page }) => {
    await page.goto('/');
    await page.locator('header button[title]').first().click();
    await page.locator('#login-email').fill('admin@example.com');
    await page.locator('#login-password').fill('password');
    await page.locator('[role="dialog"] form button[type="submit"]').click();

    // Login redirects to the dashboard now that the standalone /admin/content
    // hub was retired (its section cards moved into the dashboard itself).
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: /дашборд|dashboard/i })).toBeVisible();

    await page.locator('a[href="/admin/leads"]').first().click();
    await expect(page).toHaveURL(/\/admin\/leads$/);
    await expect(page.getByRole('heading', { name: /лента заявок|leads feed/i })).toBeVisible();

    // Content history still has its own nav item under "Контент" group.
    await page.locator('a[href="/admin/content/history"]').first().click();
    await expect(page).toHaveURL(/\/admin\/content\/history$/);
  });
});
