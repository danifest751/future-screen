import { getSupabaseClient } from './supabaseClient.js';
import type { MediaItem } from './types.js';

export const formatSelectedTags = (tags: string[]): string =>
  tags.length > 0 ? tags.join(', ') : '<code>untitled</code>';

export const buildTagKeyboard = (allTags: string[], selectedTags: string[]) => {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];

  if (allTags.length > 0) {
    rows.push(
      allTags.slice(0, 4).map((tag) => ({
        text: `${selectedTags.includes(tag) ? '✅ ' : ''}${tag}`,
        callback_data: `tag:${tag}`,
      })),
    );
    if (allTags.length > 4) {
      rows.push(
        allTags.slice(4, 8).map((tag) => ({
          text: `${selectedTags.includes(tag) ? '✅ ' : ''}${tag}`,
          callback_data: `tag:${tag}`,
        })),
      );
    }
  }

  rows.push([{ text: '🏷️ Добавить новый тег', callback_data: 'newtag' }]);
  rows.push([{ text: '⏭️ Без тега (будет untitled)', callback_data: 'skip' }]);
  rows.push([{ text: '✅ Теги выбраны, перейти к загрузке', callback_data: 'done' }]);
  rows.push([{ text: '❌ Отменить', callback_data: 'cancel' }]);

  return { inline_keyboard: rows };
};

export const getAllTags = async (): Promise<string[]> => {
  try {
    const { data } = (await getSupabaseClient().from('media_items').select('tags')) as {
      data: Pick<MediaItem, 'tags'>[] | null;
    };

    const tags = new Set<string>();
    data?.forEach((item) => {
      item.tags?.forEach((tag) => {
        const normalized = String(tag || '').trim().toLowerCase();
        if (normalized) tags.add(normalized);
      });
    });

    return Array.from(tags).sort().slice(0, 20);
  } catch {
    return [];
  }
};
