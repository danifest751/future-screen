import { expect, test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/led',
  '/support',
  '/rent',
  '/cases',
  '/prices',
  '/about',
  '/contacts',
  '/consult',
  '/check-supabase',
  '/test-supabase',
];

const adminRoutes = [
  '/admin',
  '/admin/content',
  '/admin/leads',
  '/admin/cases',
  '/admin/packages',
  '/admin/categories',
  '/admin/contacts',
];

test.describe('Public routes', () => {
  for (const route of publicRoutes) {
    test(`serves app shell: ${route}`, async ({ request, page }) => {
      const response = await request.get(route);
      expect(response.ok()).toBeTruthy();

      const html = await response.text();
      expect(html).toContain('<div id="root"></div>');

      await page.goto(route);
      await expect(page.locator('#root')).toBeAttached();
      await expect(page).toHaveTitle(/Future Screen/i);
    });
  }
});

test.describe('Admin routes', () => {
  for (const route of adminRoutes) {
    test(`serves app shell: ${route}`, async ({ request, page }) => {
      const response = await request.get(route);
      expect(response.ok()).toBeTruthy();

      const html = await response.text();
      expect(html).toContain('<div id="root"></div>');

      await page.goto(route);
      await expect(page.locator('#root')).toBeAttached();
    });
  }
});
