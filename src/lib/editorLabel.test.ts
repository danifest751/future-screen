import { describe, expect, it } from 'vitest';
import { formatEditorLabel, formatEditorTooltip, indexProfiles } from './editorLabel';

describe('formatEditorLabel', () => {
  it('возвращает прочерк для null id', () => {
    expect(formatEditorLabel(null, undefined)).toBe('—');
  });

  it('предпочитает displayName', () => {
    expect(
      formatEditorLabel('00000000-0000-0000-0000-000000000001', {
        email: 'alice@example.com',
        displayName: 'Алиса',
      })
    ).toBe('Алиса');
  });

  it('берёт локальную часть email если нет displayName', () => {
    expect(
      formatEditorLabel('00000000-0000-0000-0000-000000000001', {
        email: 'alice@example.com',
        displayName: null,
      })
    ).toBe('alice');
  });

  it('возвращает email целиком если в нём нет @', () => {
    expect(
      formatEditorLabel('00000000-0000-0000-0000-000000000001', {
        email: 'no-at-sign',
        displayName: null,
      })
    ).toBe('no-at-sign');
  });

  it('фолбэк на префикс uuid если профиль не найден', () => {
    expect(formatEditorLabel('123e4567-e89b-12d3-a456-426614174000', undefined)).toBe('123e4567…');
  });

  it('короткие id (короче 8) возвращает целиком', () => {
    expect(formatEditorLabel('abc', undefined)).toBe('abc');
  });
});

describe('formatEditorTooltip', () => {
  it('склеивает доступные поля через перевод строки', () => {
    expect(
      formatEditorTooltip('uid-1', { email: 'a@b.c', displayName: 'Алиса' })
    ).toBe('Алиса\na@b.c\nuid-1');
  });

  it('опускает отсутствующие поля', () => {
    expect(formatEditorTooltip('uid-1', undefined)).toBe('uid-1');
  });

  it('null id даёт пустую строку', () => {
    expect(formatEditorTooltip(null, undefined)).toBe('');
  });
});

describe('indexProfiles', () => {
  it('строит Map по id', () => {
    const map = indexProfiles([
      { id: 'a', email: 'a@x', displayName: null },
      { id: 'b', email: null, displayName: 'B' },
    ]);
    expect(map.size).toBe(2);
    expect(map.get('a')?.email).toBe('a@x');
    expect(map.get('b')?.displayName).toBe('B');
  });

  it('последний дубликат перетирает первый', () => {
    const map = indexProfiles([
      { id: 'a', email: 'first@x', displayName: null },
      { id: 'a', email: 'second@x', displayName: null },
    ]);
    expect(map.get('a')?.email).toBe('second@x');
  });
});
