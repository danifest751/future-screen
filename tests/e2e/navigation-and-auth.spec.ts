import { expect, test } from '@playwright/test';
import { installSupabaseMock } from './helpers/supabaseMock';

test.describe('Public navigation', () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page, { authenticated: false });
  });

  test('moves through main public routes and opens the admin login modal', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Future Screen/i);
    await expect(page.getByRole('heading', { name: /LED, свет, звук, сцены/i })).toBeVisible();

    await page.getByRole('link', { name: 'Пакеты «под ключ»' }).click();
    await expect(page).toHaveURL(/\/support$/);
    await expect(page.getByRole('heading', { name: /Техсопровождение под ключ/i })).toBeVisible();

    await page.getByRole('link', { name: 'Кейсы' }).click();
    await expect(page).toHaveURL(/\/cases$/);
    await expect(page.getByRole('heading', { name: /Кейсы/i })).toBeVisible();

    await page.getByRole('link', { name: 'Аренда' }).click();
    await expect(page).toHaveURL(/\/rent$/);
    await expect(page.getByRole('heading', { name: /Аренда оборудования/i })).toBeVisible();

    await page.getByRole('link', { name: 'Контакты' }).click();
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.getByRole('heading', { name: /Контакты/i })).toBeVisible();

    await page.getByRole('link', { name: 'Главная' }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByTitle('Войти').click();
    await expect(page.getByText('Вход в админку')).toBeVisible();
    await page.getByPlaceholder('Email').fill('admin@example.com');
    await page.getByPlaceholder('Пароль').fill('password');
    await page.locator('form').getByRole('button', { name: 'Войти', exact: true }).click();

    await expect(page).toHaveURL(/\/admin\/content$/);
    await expect(page.getByRole('heading', { name: 'Все настройки' })).toBeVisible();
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
    await expect(page.getByTitle('Войти')).toBeVisible();
  });

  test('allows authenticated users to open admin dashboard and use quick links', async ({ page }) => {
    await page.goto('/');
    await page.getByTitle('Войти').click();
    await page.getByPlaceholder('Email').fill('admin@example.com');
    await page.getByPlaceholder('Пароль').fill('password');
    await page.locator('form').getByRole('button', { name: 'Войти', exact: true }).click();

    await expect(page).toHaveURL(/\/admin\/content$/);

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible();
    await expect(page.locator('main').getByRole('link', { name: 'Пакеты', exact: true })).toBeVisible();

    await page.locator('main').getByRole('link', { name: 'Заявки', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/leads$/);
    await expect(page.getByRole('heading', { name: 'Лента заявок' })).toBeVisible();

    await page.locator('main').getByRole('link', { name: 'Все настройки', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/content$/);
    await expect(page.getByRole('heading', { name: 'Все настройки' })).toBeVisible();
  });
});
