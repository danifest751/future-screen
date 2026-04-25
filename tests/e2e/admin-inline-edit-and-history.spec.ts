import { expect, test, type Page, type Route } from '@playwright/test';
import { installSupabaseMock, seedAuthSession } from './helpers/supabaseMock';

type VersionRow = {
  id: string;
  site_content_id: string;
  key: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  edited_by: string | null;
  edited_at: string;
  title: string | null;
  content: string | null;
  content_html: string | null;
  meta_title: string | null;
  meta_description: string | null;
  font_size: string | null;
  title_en: string | null;
  content_en: string | null;
  content_html_en: string | null;
  meta_title_en: string | null;
  meta_description_en: string | null;
  font_size_en: string | null;
  is_published: boolean | null;
};

const versionsFixture: VersionRow[] = [
  {
    id: 'v-1',
    site_content_id: 'home-hero',
    key: 'home_hero',
    operation: 'UPDATE',
    edited_by: 'user-admin-1',
    edited_at: '2026-04-23T08:00:00.000Z',
    title: 'Hero title RU',
    content: 'Hero body RU',
    content_html: null,
    meta_title: null,
    meta_description: null,
    font_size: null,
    title_en: 'Hero title EN',
    content_en: 'Hero body EN',
    content_html_en: null,
    meta_title_en: null,
    meta_description_en: null,
    font_size_en: null,
    is_published: true,
  },
  {
    id: 'v-2',
    site_content_id: 'home-cta',
    key: 'home_cta',
    operation: 'INSERT',
    edited_by: 'user-admin-2',
    edited_at: '2026-04-22T10:30:00.000Z',
    title: 'CTA title RU',
    content: 'CTA body RU',
    content_html: null,
    meta_title: null,
    meta_description: null,
    font_size: null,
    title_en: 'CTA title EN',
    content_en: 'CTA body EN',
    content_html_en: null,
    meta_title_en: null,
    meta_description_en: null,
    font_size_en: null,
    is_published: true,
  },
];

const json = (body: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

const editorProfilesFixture: Record<string, { email: string; display_name: string | null }> = {
  'user-admin-1': { email: 'alice@example.com', display_name: 'Алиса Админ' },
  'user-admin-2': { email: 'bob@example.com', display_name: null },
};

async function installSiteContentVersionsMock(page: Page) {
  await page.route('**/rest/v1/site_content_versions**', async (route: Route) => {
    const url = new URL(route.request().url());
    const keyEq = url.searchParams.get('key');
    const select = url.searchParams.get('select') ?? '';

    const filtered = keyEq?.startsWith('eq.')
      ? versionsFixture.filter((v) => v.key === keyEq.slice(3))
      : versionsFixture;

    // loadSiteContentKeys asks only for key/edited_at/operation.
    if (select.includes('key') && !select.includes('*')) {
      await route.fulfill(
        json(
          filtered.map((v) => ({
            key: v.key,
            edited_at: v.edited_at,
            operation: v.operation,
          })),
        ),
      );
      return;
    }

    await route.fulfill(json(filtered));
  });

  await page.route('**/rest/v1/rpc/editor_profiles**', async (route: Route) => {
    let ids: string[] = [];
    try {
      const body = JSON.parse(route.request().postData() ?? '{}') as { ids?: string[] };
      ids = body.ids ?? [];
    } catch {
      ids = [];
    }
    const rows = ids
      .map((id) => {
        const profile = editorProfilesFixture[id];
        return profile ? { id, email: profile.email, display_name: profile.display_name } : null;
      })
      .filter(Boolean);
    await route.fulfill(json(rows));
  });
}

test.describe('Admin inline edit and content history', () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page, { authenticated: true });
    await installSiteContentVersionsMock(page);
    await seedAuthSession(page);
  });

  test('toggles inline edit mode and switches RU/EN editor locale', async ({ page }) => {
    await page.goto('/');

    const editToggle = page.getByTitle('Enter inline edit mode');
    await expect(editToggle).toBeVisible();
    await editToggle.click();

    await expect(page.locator('body[data-edit-mode="on"]')).toBeVisible();
    await expect(page.getByRole('toolbar', { name: 'Inline edit toolbar' })).toBeVisible();
    await expect(page.locator('[data-editable="true"]').first()).toBeVisible();

    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.lang))
      .toBe('en');

    await page.getByRole('button', { name: 'RU', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.lang))
      .toBe('ru');

    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.getByRole('toolbar', { name: 'Inline edit toolbar' })).toHaveCount(0);
    await expect(page.locator('body[data-edit-mode="on"]')).toHaveCount(0);
  });

  test('shows audit trail rows and filters by selected content key', async ({ page }) => {
    await page.goto('/admin/content/history');
    await expect(page).toHaveURL(/\/admin\/content\/history$/);

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(versionsFixture.length);

    await page.locator('select').first().selectOption('home_hero');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('tbody tr td').nth(1)).toContainText('home_hero');

    // Editor display name resolved via editor_profiles RPC, not the raw uuid.
    await expect(page.locator('tbody tr').first()).toContainText('Алиса Админ');
  });
});

