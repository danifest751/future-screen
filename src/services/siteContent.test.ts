import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

import { loadSiteContent, saveSiteContent } from './siteContent';

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
          return (resolve: (v: unknown) => unknown, reject?: (r: unknown) => unknown) =>
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

const rowFull = {
  id: 'home_hero',
  key: 'home_hero',
  title: 'Заголовок RU',
  content: 'Контент RU',
  content_html: '<p>RU</p>',
  meta_title: 'Meta RU',
  meta_description: 'Desc RU',
  font_size: '14',
  title_en: 'Title EN',
  content_en: 'Content EN',
  content_html_en: '<p>EN</p>',
  meta_title_en: 'Meta EN',
  meta_description_en: 'Desc EN',
  font_size_en: '15',
  is_published: true,
  created_at: '2026-04-25T00:00:00.000Z',
  updated_at: '2026-04-25T01:00:00.000Z',
};

beforeEach(() => fromMock.mockReset());

describe('loadSiteContent', () => {
  it('возвращает RU поля при locale=ru', async () => {
    const { builder } = makeChain({ data: rowFull, error: null });
    fromMock.mockReturnValue(builder);

    const result = await loadSiteContent('home_hero', 'ru');
    expect(result).toMatchObject({
      title: 'Заголовок RU',
      content: 'Контент RU',
      metaTitle: 'Meta RU',
      fontSize: '14',
      isPublished: true,
      fallbackUsed: false,
    });
  });

  it('возвращает EN поля для locale=en', async () => {
    const { builder } = makeChain({ data: rowFull, error: null });
    fromMock.mockReturnValue(builder);

    const result = await loadSiteContent('home_hero', 'en');
    expect(result).toMatchObject({
      title: 'Title EN',
      content: 'Content EN',
      metaTitle: 'Meta EN',
      fontSize: '15',
      fallbackUsed: false,
    });
  });

  it('фолбэчит на RU для пустых EN полей и помечает fallbackUsed=true', async () => {
    const partial = { ...rowFull, title_en: null, content_en: null, font_size_en: null };
    const { builder } = makeChain({ data: partial, error: null });
    fromMock.mockReturnValue(builder);

    const result = await loadSiteContent('home_hero', 'en');
    expect(result?.title).toBe('Заголовок RU');
    expect(result?.content).toBe('Контент RU');
    expect(result?.fontSize).toBe('14');
    expect(result?.fallbackUsed).toBe(true);
  });

  it('не фолбэчит на RU когда fallbackToRu=false', async () => {
    const partial = { ...rowFull, title_en: null, content_en: null };
    const { builder } = makeChain({ data: partial, error: null });
    fromMock.mockReturnValue(builder);

    const result = await loadSiteContent('home_hero', 'en', false);
    expect(result?.title).toBeNull();
    expect(result?.content).toBeNull();
  });

  it('null если запись не найдена', async () => {
    const { builder } = makeChain({ data: null, error: null });
    fromMock.mockReturnValue(builder);

    expect(await loadSiteContent('missing', 'ru')).toBeNull();
  });

  it('пробрасывает ошибку supabase', async () => {
    const { builder } = makeChain({ data: null, error: { message: 'rls denied' } });
    fromMock.mockReturnValue(builder);
    await expect(loadSiteContent('home_hero', 'ru')).rejects.toThrow('rls denied');
  });
});

describe('saveSiteContent', () => {
  it('upsert с onConflict=key, поля RU маппятся в snake_case', async () => {
    const { builder, calls } = makeChain({ data: rowFull, error: null });
    fromMock.mockReturnValue(builder);

    await saveSiteContent('home_hero', {
      title: 'New title',
      content: '{"badge":"new"}',
      isPublished: true,
      fontSize: '16',
    }, 'ru');

    const upsertCall = calls.find((c) => c.name === 'upsert');
    expect(upsertCall?.args[1]).toEqual({ onConflict: 'key' });
    expect(upsertCall?.args[0]).toMatchObject({
      key: 'home_hero',
      title: 'New title',
      content: '{"badge":"new"}',
      is_published: true,
      font_size: '16',
    });
  });

  it('для locale=en пишет в *_en поля и не трогает RU', async () => {
    const { builder, calls } = makeChain({ data: rowFull, error: null });
    fromMock.mockReturnValue(builder);

    await saveSiteContent('home_hero', { title: 'Hello', metaTitle: 'M' }, 'en');

    const payload = calls.find((c) => c.name === 'upsert')?.args[0] as Record<string, unknown>;
    expect(payload).toMatchObject({ key: 'home_hero', title_en: 'Hello', meta_title_en: 'M' });
    expect(payload.title).toBeUndefined();
    expect(payload.meta_title).toBeUndefined();
  });

  it('пробрасывает ошибку upsert', async () => {
    const { builder } = makeChain({ data: null, error: { message: 'unique violation' } });
    fromMock.mockReturnValue(builder);

    await expect(saveSiteContent('home_hero', { title: 'x' }, 'ru')).rejects.toThrow('unique violation');
  });

  it('бросает если data пустой после upsert', async () => {
    const { builder } = makeChain({ data: null, error: null });
    fromMock.mockReturnValue(builder);

    await expect(saveSiteContent('home_hero', { title: 'x' }, 'ru')).rejects.toThrow(
      'Content was not returned after upsert'
    );
  });
});
