import { describe, expect, it } from 'vitest';
import { diffJsonStrings, diffJsonValues, formatJsonValue } from './jsonDiff';

describe('diffJsonValues', () => {
  it('возвращает пусто для эквивалентных объектов', () => {
    expect(diffJsonValues({ a: 1, b: 2 }, { b: 2, a: 1 })).toEqual([]);
  });

  it('детектит изменение скалярного поля', () => {
    expect(diffJsonValues({ badge: 'old' }, { badge: 'new' })).toEqual([
      { path: 'badge', kind: 'changed', before: 'old', after: 'new' },
    ]);
  });

  it('детектит added и removed ключи', () => {
    expect(
      diffJsonValues({ a: 1, b: 2 }, { a: 1, c: 3 })
    ).toEqual([
      { path: 'b', kind: 'removed', before: 2 },
      { path: 'c', kind: 'added', after: 3 },
    ]);
  });

  it('строит путь до элемента массива через индекс', () => {
    const before = { titleLines: ['Hello', 'World'] };
    const after = { titleLines: ['Hello', 'Earth'] };
    expect(diffJsonValues(before, after)).toEqual([
      { path: 'titleLines[1]', kind: 'changed', before: 'World', after: 'Earth' },
    ]);
  });

  it('фиксирует удлинение и укорочение массива', () => {
    expect(diffJsonValues({ list: [1, 2] }, { list: [1, 2, 3] })).toEqual([
      { path: 'list[2]', kind: 'added', after: 3 },
    ]);
    expect(diffJsonValues({ list: [1, 2, 3] }, { list: [1, 2] })).toEqual([
      { path: 'list[2]', kind: 'removed', before: 3 },
    ]);
  });

  it('идёт глубоко в массивы объектов', () => {
    const before = { stats: [{ value: '10', label: 'A' }, { value: '20', label: 'B' }] };
    const after = { stats: [{ value: '10', label: 'A' }, { value: '21', label: 'B' }] };
    expect(diffJsonValues(before, after)).toEqual([
      { path: 'stats[1].value', kind: 'changed', before: '20', after: '21' },
    ]);
  });

  it('рассматривает изменение типа корня как одно изменение пути ""', () => {
    expect(diffJsonValues({ a: 1 }, [1, 2])).toEqual([
      { path: '', kind: 'changed', before: { a: 1 }, after: [1, 2] },
    ]);
  });

  it('экранирует ключи с не-идентификаторными символами', () => {
    expect(diffJsonValues({ 'weird key': 1 }, { 'weird key': 2 })).toEqual([
      { path: '["weird key"]', kind: 'changed', before: 1, after: 2 },
    ]);
  });

  it('null vs значение — это changed, а не added', () => {
    expect(diffJsonValues({ x: null }, { x: 'value' })).toEqual([
      { path: 'x', kind: 'changed', before: null, after: 'value' },
    ]);
  });
});

describe('diffJsonStrings', () => {
  it('парсит обе стороны и возвращает diff', () => {
    const before = JSON.stringify({ badge: 'старый', titleLines: ['А', 'Б'] });
    const after = JSON.stringify({ badge: 'новый', titleLines: ['А', 'В'] });
    const result = diffJsonStrings(before, after);
    expect(result.ok).toBe(true);
    expect(result.entries).toEqual([
      { path: 'badge', kind: 'changed', before: 'старый', after: 'новый' },
      { path: 'titleLines[1]', kind: 'changed', before: 'Б', after: 'В' },
    ]);
  });

  it('возвращает ok=false если хотя бы одна сторона не JSON', () => {
    expect(diffJsonStrings('plain text', '{"a":1}').ok).toBe(false);
    expect(diffJsonStrings('{"a":1}', 'plain text').ok).toBe(false);
    expect(diffJsonStrings('not json', 'also not').ok).toBe(false);
  });

  it('возвращает ok=false для битого JSON', () => {
    expect(diffJsonStrings('{"a":', '{"a":1}').ok).toBe(false);
  });

  it('null/undefined/пустые строки обрабатываются как null без падения', () => {
    expect(diffJsonStrings(null, null)).toEqual({ ok: true, entries: [] });
    expect(diffJsonStrings(undefined, null)).toEqual({ ok: true, entries: [] });
    expect(diffJsonStrings('   ', null)).toEqual({ ok: true, entries: [] });
  });

  it('null до и JSON после — это added на корне', () => {
    const result = diffJsonStrings(null, JSON.stringify({ a: 1 }));
    expect(result.ok).toBe(true);
    expect(result.entries).toEqual([
      { path: '', kind: 'changed', before: null, after: { a: 1 } },
    ]);
  });
});

describe('formatJsonValue', () => {
  it('кавычит строки', () => {
    expect(formatJsonValue('hi')).toBe('"hi"');
  });

  it('null рендерит как null, undefined как —', () => {
    expect(formatJsonValue(null)).toBe('null');
    expect(formatJsonValue(undefined)).toBe('—');
  });

  it('числа и булевы — как есть', () => {
    expect(formatJsonValue(0)).toBe('0');
    expect(formatJsonValue(false)).toBe('false');
  });

  it('сложные значения сериализует JSON.stringify', () => {
    expect(formatJsonValue({ a: 1 })).toBe('{"a":1}');
    expect(formatJsonValue([1, 2])).toBe('[1,2]');
  });
});
