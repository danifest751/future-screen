import { expect, test } from '@playwright/test';

test('home route responds with app shell', async ({ page, request }) => {
  const response = await request.get('/');
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain('<div id="root"></div>');

  await page.goto('/');
  await expect(page).toHaveTitle(/Future Screen/i);
  await expect(page.locator('#root')).toBeAttached();
});

test('admin route responds with app shell', async ({ page, request }) => {
  const response = await request.get('/admin');
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain('<div id="root"></div>');

  await page.goto('/admin');
  await expect(page.locator('#root')).toBeAttached();
});

test('client bundle is served on home page', async ({ page }) => {
  const jsRequest = page.waitForRequest((req) => req.url().includes('/src/main.tsx') || req.url().includes('/assets/index-'));
  await page.goto('/');
  await jsRequest;
  await expect(page.locator('#root')).toBeAttached();
});
