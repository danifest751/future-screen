import { expect, type Page, type Route } from '@playwright/test';

type LeadRow = {
  id: string;
  created_at: string;
  source: string;
  name: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  city: string | null;
  date: string | null;
  format: string | null;
  comment: string | null;
  extra: Record<string, string> | null;
  page_path: string | null;
  referrer: string | null;
  status: string | null;
};

export const supabaseUrl = 'https://pyframwlnqrzeynqcvle.supabase.co';
export const supabaseAuthStorageKey = 'sb-pyframwlnqrzeynqcvle-auth-token';

export const buildAuthSession = (email = 'admin@example.com') => ({
  access_token: 'token',
  refresh_token: 'refresh',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: 'user-1', email, app_metadata: { role: 'admin' } },
});

export const seedAuthSession = async (page: Page, email = 'admin@example.com') => {
  await page.addInitScript(
    ([storageKey, session]) => {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    },
    [supabaseAuthStorageKey, buildAuthSession(email)] as const
  );
};

export const fixtures = {
  session: { session: null },
  packages: [
    {
      id: 101,
      name: 'Лайт',
      for_formats: ['Выставка', 'Презентация'],
      includes: ['Экран 4x3', 'Монтаж'],
      options: ['Режиссер эфира'],
      price_hint: 'от 120 000 ₽',
    },
    {
      id: 102,
      name: 'Медиум',
      for_formats: ['Форум', 'Конференция'],
      includes: ['Экран 8x4', 'Свет'],
      options: ['Техник'],
      price_hint: 'от 260 000 ₽',
    },
  ],
  categories: [
    {
      id: 7,
      title: 'Свет',
      short_description: 'Световое оборудование и сценический свет',
      bullets: ['LED', 'Пульты', 'Монтаж'],
      page_path: '/rent/light',
    },
    {
      id: 8,
      title: 'Звук',
      short_description: 'Акустика, микрофоны и пульты',
      bullets: ['Line array', 'Бэклайн', 'Монтаж'],
      page_path: '/rent/sound',
    },
  ],
  contacts: [
    {
      id: 1,
      phones: ['+7 (912) 246-65-66'],
      emails: ['gr@future-screen.ru'],
      address: 'Екатеринбург, Большой Конный полуостров, 5а',
      working_hours: '09:00–18:00',
    },
  ],
  leads: [
    {
      id: 'lead-1',
      created_at: '2026-03-18T10:00:00.000Z',
      source: 'calc form',
      name: 'Иван Петров',
      phone: '+79990000001',
      email: 'ivan@example.com',
      telegram: null,
      city: 'Москва',
      date: '25 мая',
      format: 'Форум',
      comment: 'Нужен экран',
      extra: { width: '8', height: '4' },
      page_path: '/led',
      referrer: null,
      status: 'new',
    },
    {
      id: 'lead-2',
      created_at: '2026-03-17T09:00:00.000Z',
      source: 'form-home',
      name: 'Анна Смирнова',
      phone: '+79990000002',
      email: null,
      telegram: '@anna',
      city: 'Казань',
      date: null,
      format: null,
      comment: 'Срочно',
      extra: null,
      page_path: '/support',
      referrer: null,
      status: 'new',
    },
  ] as LeadRow[],
};

const json = (body: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

const parseUrl = (route: Route) => new URL(route.request().url());

const matchesTable = (url: URL, table: string) => url.pathname.includes(`/rest/v1/${table}`);

const selectParams = (url: URL) => ({
  select: url.searchParams.get('select'),
  limit: url.searchParams.get('limit'),
  order: url.searchParams.get('order'),
});

export const installSupabaseMock = async (page: Page, options?: { authenticated?: boolean }) => {
  const authenticated = options?.authenticated ?? false;
  const authPayload = {
    access_token: 'token',
    refresh_token: 'refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: 'user-1', email: 'admin@example.com', app_metadata: { role: 'admin' } },
    session: {
      access_token: 'token',
      refresh_token: 'refresh',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'user-1', email: 'admin@example.com', app_metadata: { role: 'admin' } },
    },
  };

  await page.route('**/auth/v1/**', async (route) => {
    const url = parseUrl(route);
    const method = route.request().method();

    if (url.pathname.endsWith('/session')) {
      await route.fulfill(json(authenticated ? authPayload : { session: null }));
      return;
    }

    if (url.pathname.endsWith('/user')) {
      await route.fulfill(
        authenticated
          ? json({ id: 'user-1', email: 'admin@example.com', app_metadata: { role: 'admin' } })
          : json({ error: 'not authenticated' }, 401)
      );
      return;
    }

    if (url.pathname.endsWith('/token') && method === 'POST') {
      const payload = route.request().postDataJSON?.() ?? {};
      const email = payload.email ?? 'admin@example.com';
      const password = payload.password ?? 'password';

      if (email === 'admin@example.com' && password === 'password') {
        await route.fulfill(
          json({
            ...authPayload,
            user: { id: 'user-1', email, app_metadata: { role: 'admin' } },
            session: {
              ...authPayload.session,
              user: { id: 'user-1', email, app_metadata: { role: 'admin' } },
            },
          })
        );
        return;
      }

      await route.fulfill(json({ error: 'invalid login' }, 400));
      return;
    }

    if (url.pathname.endsWith('/logout') || url.pathname.endsWith('/signout')) {
      await route.fulfill(json({}, 200));
      return;
    }

    await route.fulfill(json({}, 200));
  });

  await page.route('**/rest/v1/**', async (route) => {
    const url = parseUrl(route);
    const method = route.request().method();

    if (matchesTable(url, 'packages')) {
      if (method === 'GET') {
        await route.fulfill(json(fixtures.packages));
        return;
      }
      if (method === 'POST' || method === 'PATCH') {
        const body = route.request().postDataJSON?.() ?? {};
        await route.fulfill(json([{ id: body.id ?? 999, ...body }]));
        return;
      }
      if (method === 'DELETE') {
        await route.fulfill(json([]));
        return;
      }
    }

    if (matchesTable(url, 'categories')) {
      if (method === 'GET') {
        await route.fulfill(json(fixtures.categories));
        return;
      }
      if (method === 'POST' || method === 'PATCH') {
        const body = route.request().postDataJSON?.() ?? {};
        await route.fulfill(json([{ id: body.id ?? 999, ...body }]));
        return;
      }
      if (method === 'DELETE') {
        await route.fulfill(json([]));
        return;
      }
    }

    if (matchesTable(url, 'contacts')) {
      if (method === 'GET') {
        await route.fulfill(json(fixtures.contacts));
        return;
      }
      if (method === 'POST' || method === 'PATCH') {
        const body = route.request().postDataJSON?.() ?? {};
        await route.fulfill(json([{ id: body.id ?? 1, ...body }]));
        return;
      }
      if (method === 'DELETE') {
        await route.fulfill(json([]));
        return;
      }
    }

    if (matchesTable(url, 'leads')) {
      if (method === 'GET') {
        await route.fulfill(json(fixtures.leads));
        return;
      }
      if (method === 'DELETE') {
        await route.fulfill(json([]));
        return;
      }
    }

    if (matchesTable(url, 'cases')) {
      if (method === 'GET') {
        await route.fulfill(
          json([
            {
              slug: 'forum-ekb-2024',
              title: 'Форум в Екатеринбурге',
              city: 'Екатеринбург',
              date: '2024',
              format: 'Форум',
              summary: 'Короткое описание проекта',
              metrics: '800 гостей',
              services: ['led', 'sound'],
              images: ['https://images.example.com/case-1.jpg'],
            },
          ])
        );
        return;
      }
      if (method === 'POST' || method === 'PATCH') {
        const body = route.request().postDataJSON?.() ?? {};
        await route.fulfill(json([{ slug: body.slug ?? 'new-case', ...body }]));
        return;
      }
      if (method === 'DELETE') {
        await route.fulfill(json([]));
        return;
      }
    }

    if (matchesTable(url, 'test')) {
      await route.fulfill(json([]));
      return;
    }

    await route.fulfill(json([]));
  });
};

export const assertVisible = async (page: Page, text: string) => {
  await expect(page.getByText(text, { exact: false })).toBeVisible();
};
