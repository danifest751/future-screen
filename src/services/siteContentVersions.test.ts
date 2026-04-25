import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

import {
  loadCurrentSiteContentSnapshot,
  loadEditorProfiles,
  loadPreviousSiteContentVersion,
  loadSiteContentKeys,
  loadSiteContentVersions,
  restoreSiteContentVersion,
} from './siteContentVersions';

interface ChainCall {
  name: string;
  args: unknown[];
}

function makeChain(response: { data?: unknown; error?: unknown }) {
  const calls: ChainCall[] = [];
  const builder = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (prop === 'then') {
          return (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
            Promise.resolve(response).then(resolve, reject);
        }
        return (...args: unknown[]) => {
          calls.push({ name: prop, args });
          return builder;
        };
      },
    }
  ) as Record<string, (...a: unknown[]) => unknown> & PromiseLike<unknown>;
  return { builder, calls };
}

const buildVersionRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'v-1',
  site_content_id: 'content-1',
  key: 'home_hero',
  operation: 'UPDATE',
  edited_by: 'user-1',
  edited_at: '2026-04-25T10:00:00.000Z',
  title: 'Title RU',
  content: '{"badge":"old"}',
  content_html: null,
  meta_title: null,
  meta_description: null,
  font_size: null,
  title_en: null,
  content_en: null,
  content_html_en: null,
  meta_title_en: null,
  meta_description_en: null,
  font_size_en: null,
  is_published: true,
  ...overrides,
});

beforeEach(() => {
  fromMock.mockReset();
  rpcMock.mockReset();
});

describe('loadSiteContentVersions', () => {
  it('по умолчанию ставит limit=200, сортирует edited_at desc и не фильтрует', async () => {
    const row = buildVersionRow();
    const { builder, calls } = makeChain({ data: [row], error: null });
    fromMock.mockReturnValue(builder);

    const result = await loadSiteContentVersions();

    expect(fromMock).toHaveBeenCalledWith('site_content_versions');
    expect(calls).toEqual([
      { name: 'select', args: ['*'] },
      { name: 'order', args: ['edited_at', { ascending: false }] },
      { name: 'limit', args: [200] },
    ]);
    expect(result).toEqual([
      {
        id: 'v-1',
        siteContentId: 'content-1',
        key: 'home_hero',
        operation: 'UPDATE',
        editedBy: 'user-1',
        editedAt: '2026-04-25T10:00:00.000Z',
        title: 'Title RU',
        content: '{"badge":"old"}',
        contentHtml: null,
        metaTitle: null,
        metaDescription: null,
        fontSize: null,
        titleEn: null,
        contentEn: null,
        contentHtmlEn: null,
        metaTitleEn: null,
        metaDescriptionEn: null,
        fontSizeEn: null,
        isPublished: true,
      },
    ]);
  });

  it('фильтрует по key и применяет before для keyset-пагинации', async () => {
    const { builder, calls } = makeChain({ data: [], error: null });
    fromMock.mockReturnValue(builder);

    await loadSiteContentVersions({ key: 'home_hero', limit: 50, before: '2026-04-25T09:00:00.000Z' });

    expect(calls).toContainEqual({ name: 'limit', args: [50] });
    expect(calls).toContainEqual({ name: 'eq', args: ['key', 'home_hero'] });
    expect(calls).toContainEqual({ name: 'lt', args: ['edited_at', '2026-04-25T09:00:00.000Z'] });
  });

  it('пробрасывает ошибку supabase как Error', async () => {
    const { builder } = makeChain({ data: null, error: { message: 'boom' } });
    fromMock.mockReturnValue(builder);

    await expect(loadSiteContentVersions()).rejects.toThrow('boom');
  });
});

describe('loadSiteContentKeys', () => {
  it('дедуплицирует по key, сохраняя самую свежую правку', async () => {
    const data = [
      { key: 'home_hero', edited_at: '2026-04-25T10:00:00.000Z', operation: 'UPDATE' },
      { key: 'home_hero', edited_at: '2026-04-24T10:00:00.000Z', operation: 'INSERT' },
      { key: 'home_cta', edited_at: '2026-04-23T10:00:00.000Z', operation: 'INSERT' },
    ];
    const { builder } = makeChain({ data, error: null });
    fromMock.mockReturnValue(builder);

    const result = await loadSiteContentKeys();

    expect(result).toEqual([
      { key: 'home_hero', lastEditedAt: '2026-04-25T10:00:00.000Z', lastOperation: 'UPDATE' },
      { key: 'home_cta', lastEditedAt: '2026-04-23T10:00:00.000Z', lastOperation: 'INSERT' },
    ]);
  });

  it('пробрасывает ошибку', async () => {
    const { builder } = makeChain({ data: null, error: { message: 'rls' } });
    fromMock.mockReturnValue(builder);
    await expect(loadSiteContentKeys()).rejects.toThrow('rls');
  });
});

describe('loadCurrentSiteContentSnapshot', () => {
  it('возвращает null если запись не найдена', async () => {
    const { builder } = makeChain({ data: null, error: null });
    fromMock.mockReturnValue(builder);
    const result = await loadCurrentSiteContentSnapshot('home_hero');
    expect(result).toBeNull();
  });

  it('маппит snake_case в camelCase', async () => {
    const row = {
      id: 'content-1',
      key: 'home_hero',
      title: 'T',
      content: 'C',
      content_html: '<p/>',
      meta_title: 'MT',
      meta_description: 'MD',
      font_size: '14',
      title_en: 'T-EN',
      content_en: 'C-EN',
      content_html_en: null,
      meta_title_en: null,
      meta_description_en: null,
      font_size_en: null,
      is_published: false,
    };
    const { builder } = makeChain({ data: row, error: null });
    fromMock.mockReturnValue(builder);

    const result = await loadCurrentSiteContentSnapshot('home_hero');
    expect(result).toMatchObject({
      id: 'content-1',
      contentHtml: '<p/>',
      metaTitle: 'MT',
      isPublished: false,
      titleEn: 'T-EN',
    });
  });
});

describe('loadPreviousSiteContentVersion', () => {
  it('возвращает null если предыдущей версии нет', async () => {
    const { builder } = makeChain({ data: null, error: null });
    fromMock.mockReturnValue(builder);
    const target = {
      id: 'v-2',
      siteContentId: 'content-1',
      key: 'home_hero',
      operation: 'UPDATE' as const,
      editedBy: null,
      editedAt: '2026-04-25T10:00:00.000Z',
      title: null, content: null, contentHtml: null, metaTitle: null, metaDescription: null, fontSize: null,
      titleEn: null, contentEn: null, contentHtmlEn: null, metaTitleEn: null, metaDescriptionEn: null, fontSizeEn: null,
      isPublished: null,
    };
    expect(await loadPreviousSiteContentVersion(target)).toBeNull();
  });
});

describe('restoreSiteContentVersion', () => {
  it('upsert вызывается с onConflict=key и всеми полями версии', async () => {
    const { builder, calls } = makeChain({ data: null, error: null });
    fromMock.mockReturnValue(builder);

    await restoreSiteContentVersion({
      id: 'v-1',
      siteContentId: 'content-1',
      key: 'home_hero',
      operation: 'UPDATE',
      editedBy: 'u',
      editedAt: '2026-04-25T10:00:00.000Z',
      title: 'T', content: 'C', contentHtml: null, metaTitle: null, metaDescription: null, fontSize: null,
      titleEn: null, contentEn: null, contentHtmlEn: null, metaTitleEn: null, metaDescriptionEn: null, fontSizeEn: null,
      isPublished: true,
    });

    const upsertCall = calls.find((c) => c.name === 'upsert');
    expect(upsertCall).toBeDefined();
    expect(upsertCall?.args[1]).toEqual({ onConflict: 'key' });
    const payload = upsertCall?.args[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      id: 'content-1',
      key: 'home_hero',
      title: 'T',
      content: 'C',
      is_published: true,
    });
  });

  it('пробрасывает ошибку upsert', async () => {
    const { builder } = makeChain({ data: null, error: { message: 'denied' } });
    fromMock.mockReturnValue(builder);

    await expect(
      restoreSiteContentVersion({
        id: 'v-1', siteContentId: 'content-1', key: 'home_hero', operation: 'UPDATE',
        editedBy: null, editedAt: '2026-04-25T10:00:00.000Z',
        title: null, content: null, contentHtml: null, metaTitle: null, metaDescription: null, fontSize: null,
        titleEn: null, contentEn: null, contentHtmlEn: null, metaTitleEn: null, metaDescriptionEn: null, fontSizeEn: null,
        isPublished: null,
      })
    ).rejects.toThrow('denied');
  });
});

describe('loadEditorProfiles', () => {
  it('возвращает [] для пустого ввода без обращения к RPC', async () => {
    const result = await loadEditorProfiles([]);
    expect(result).toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('дедуплицирует id и фильтрует falsy', async () => {
    rpcMock.mockResolvedValue({
      data: [
        { id: 'u-1', email: 'a@x', display_name: 'Alice' },
        { id: 'u-2', email: null, display_name: null },
      ],
      error: null,
    });

    const result = await loadEditorProfiles(['u-1', 'u-1', '', 'u-2']);
    expect(rpcMock).toHaveBeenCalledWith('editor_profiles', { ids: ['u-1', 'u-2'] });
    expect(result).toEqual([
      { id: 'u-1', email: 'a@x', displayName: 'Alice' },
      { id: 'u-2', email: null, displayName: null },
    ]);
  });

  it('пробрасывает ошибку RPC', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'forbidden' } });
    await expect(loadEditorProfiles(['u-1'])).rejects.toThrow('forbidden');
  });
});
