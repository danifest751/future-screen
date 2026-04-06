export const caseMediaSelectorContent = {
  modal: {
    title: 'Выберите медиафайлы',
    selectedSummary: (total: number, images: number, videos: number) =>
      `Выбрано: ${total} (${images} фото, ${videos} видео)`,
    done: (total: number) => `Готово (${total})`,
  },
  preview: {
    selectedFiles: (total: number, images: number, videos: number) => {
      const parts = [`Выбрано: ${total} файлов`];
      if (images > 0) parts.push(`${images} фото`);
      if (videos > 0) parts.push(`${videos} видео`);
      return parts.join(' • ');
    },
    edit: 'Изменить',
    video: 'Видео',
    photo: 'Фото',
    add: 'Добавить',
    reorderHint: 'Перетащите файлы для изменения порядка отображения',
    emptyTitle: 'Выберите медиафайлы из библиотеки',
    emptyHint: 'Нажмите для выбора',
  },
} as const;
