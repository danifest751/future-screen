import { describe, it, expect } from 'vitest';
import { buildTagKeyboard, formatSelectedTags } from './tags.js';

describe('telegramWebhook/tags', () => {
  describe('formatSelectedTags', () => {
    it('returns <code>untitled</code> for an empty list', () => {
      expect(formatSelectedTags([])).toBe('<code>untitled</code>');
    });

    it('joins tags with comma-space', () => {
      expect(formatSelectedTags(['a'])).toBe('a');
      expect(formatSelectedTags(['a', 'b', 'c'])).toBe('a, b, c');
    });
  });

  describe('buildTagKeyboard', () => {
    const controlRows = [
      [{ text: '🏷️ Добавить новый тег', callback_data: 'newtag' }],
      [{ text: '⏭️ Без тега (будет untitled)', callback_data: 'skip' }],
      [{ text: '✅ Теги выбраны, перейти к загрузке', callback_data: 'done' }],
      [{ text: '❌ Отменить', callback_data: 'cancel' }],
    ];

    it('returns only control rows when there are no tags', () => {
      const keyboard = buildTagKeyboard([], []);
      expect(keyboard).toEqual({ inline_keyboard: controlRows });
    });

    it('puts up to four tags into the first row', () => {
      const keyboard = buildTagKeyboard(['a', 'b', 'c', 'd'], []);
      expect(keyboard.inline_keyboard[0]).toEqual([
        { text: 'a', callback_data: 'tag:a' },
        { text: 'b', callback_data: 'tag:b' },
        { text: 'c', callback_data: 'tag:c' },
        { text: 'd', callback_data: 'tag:d' },
      ]);
      expect(keyboard.inline_keyboard).toHaveLength(1 + controlRows.length);
    });

    it('splits 5–8 tags into two rows and drops the rest', () => {
      const keyboard = buildTagKeyboard(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], []);
      expect(keyboard.inline_keyboard[0].map((b) => b.callback_data)).toEqual([
        'tag:a',
        'tag:b',
        'tag:c',
        'tag:d',
      ]);
      expect(keyboard.inline_keyboard[1].map((b) => b.callback_data)).toEqual([
        'tag:e',
        'tag:f',
        'tag:g',
        'tag:h',
      ]);
      expect(keyboard.inline_keyboard).toHaveLength(2 + controlRows.length);
    });

    it('prefixes selected tags with a checkmark', () => {
      const keyboard = buildTagKeyboard(['a', 'b'], ['b']);
      expect(keyboard.inline_keyboard[0]).toEqual([
        { text: 'a', callback_data: 'tag:a' },
        { text: '✅ b', callback_data: 'tag:b' },
      ]);
    });

    it('always appends the four control rows last', () => {
      const keyboard = buildTagKeyboard(['a'], []);
      expect(keyboard.inline_keyboard.slice(-4)).toEqual(controlRows);
    });
  });
});
