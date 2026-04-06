export const mediaTagFilterContent = {
  placeholder: 'Фильтр по тегам',
  selected: (count: number) => `Выбрано: ${count}`,
  clear: 'Очистить',
  searchPlaceholder: 'Поиск тегов...',
  notFound: 'Теги не найдены',
  empty: 'Нет доступных тегов',
  total: (count: number) => `Всего тегов: ${count}`,
} as const;
