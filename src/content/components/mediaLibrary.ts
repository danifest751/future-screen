export const mediaLibraryContent = {
  editModal: {
    title: 'Редактировать медиафайл',
    nameLabel: 'Название',
    tagsLabel: 'Теги (через запятую)',
    confirmText: 'Сохранить',
    cancelText: 'Отмена',
  },
  deleteModal: {
    title: 'Удалить файл?',
    description: (name: string) => `Файл "${name}" будет удален без возможности восстановления.`,
    confirmText: 'Удалить',
    cancelText: 'Отмена',
  },
  toolbar: {
    searchPlaceholder: 'Поиск по названию или тегам...',
    typeAll: 'Все',
    imagesOnlyTitle: 'Только изображения',
    videosOnlyTitle: 'Только видео',
    sortNewest: 'Новые сначала',
    sortOldest: 'Старые сначала',
    sortName: 'По названию',
    sortSize: 'По размеру',
    upload: 'Загрузить',
  },
  results: {
    loading: 'Загрузка...',
    found: (count: number) => `Найдено: ${count}`,
    totalTags: (count: number) => `Всего тегов: ${count}`,
  },
  empty: {
    title: 'Медиафайлы не найдены',
    filteredDescription: 'Попробуйте изменить параметры фильтра',
    initialDescription: 'Загрузите первые файлы, нажав кнопку выше',
  },
  list: {
    image: 'Изображение',
    video: 'Видео',
    separator: '•',
  },
  quickTags: {
    title: 'Быстрые категории',
    clear: 'Сбросить',
  },
  usage: {
    checking: 'Проверяю использование…',
    inUseSingular: (count: number) => `Используется в ${count} кейсе:`,
    inUsePlural: (count: number) =>
      count >= 5 ? `Используется в ${count} кейсах:` : `Используется в ${count} кейсах:`,
    notUsed: 'Файл не привязан к кейсам.',
    cascadeWarning: 'Связь с кейсом будет разорвана автоматически.',
  },
} as const;
