import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.fn();
vi.mock('../lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

import { loadMediaUsage, totalUsageCount } from './mediaUsage';

interface ChainCall { name: string; args: unknown[] }
function makeChain(response: { data?: unknown; error?: unknown }) {
  const calls: ChainCall[] = [];
  const builder = new Proxy({}, {
    get(_, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown, reject?: (r: unknown) => unknown) =>
          Promise.resolve(response).then(resolve, reject);
      }
      return (...args: unknown[]) => { calls.push({ name: prop, args }); return builder; };
    },
  }) as Record<string, (...a: unknown[]) => unknown> & PromiseLike<unknown>;
  return { builder, calls };
}

beforeEach(() => fromMock.mockReset());

describe('loadMediaUsage', () => {
  it('пустой ввод → пустая Map без обращения к supabase', async () => {
    const result = await loadMediaUsage([]);
    expect(result.size).toBe(0);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('дедуплицирует id и группирует по media_id', async () => {
    const data = [
      { media_id: 'm-1', case_id: 10, cases: { slug: 'event-a', title: 'Event A' } },
      { media_id: 'm-1', case_id: 11, cases: { slug: 'event-b', title: 'Event B' } },
      { media_id: 'm-2', case_id: 10, cases: { slug: 'event-a', title: 'Event A' } },
    ];
    const { builder, calls } = makeChain({ data, error: null });
    fromMock.mockReturnValue(builder);

    const result = await loadMediaUsage(['m-1', 'm-1', 'm-2', '']);
    expect(calls).toContainEqual({ name: 'in', args: ['media_id', ['m-1', 'm-2']] });

    expect(result.get('m-1')).toEqual([
      { caseId: 10, caseSlug: 'event-a', caseTitle: 'Event A' },
      { caseId: 11, caseSlug: 'event-b', caseTitle: 'Event B' },
    ]);
    expect(result.get('m-2')?.length).toBe(1);
    expect(result.size).toBe(2);
  });

  it('пропускает строки с null cases', async () => {
    const data = [
      { media_id: 'm-1', case_id: 10, cases: null },
    ];
    const { builder } = makeChain({ data, error: null });
    fromMock.mockReturnValue(builder);

    const result = await loadMediaUsage(['m-1']);
    expect(result.get('m-1')).toEqual([
      { caseId: 10, caseSlug: null, caseTitle: null },
    ]);
  });

  it('пробрасывает ошибку supabase', async () => {
    const { builder } = makeChain({ data: null, error: { message: 'rls' } });
    fromMock.mockReturnValue(builder);
    await expect(loadMediaUsage(['m-1'])).rejects.toThrow('rls');
  });
});

describe('totalUsageCount', () => {
  it('суммирует длины списков', () => {
    const map = new Map<string, ReturnType<typeof Array.from>>([
      ['a', [1, 2]],
      ['b', [3]],
    ]) as Parameters<typeof totalUsageCount>[0];
    expect(totalUsageCount(map)).toBe(3);
  });

  it('пустая Map → 0', () => {
    expect(totalUsageCount(new Map())).toBe(0);
  });
});
