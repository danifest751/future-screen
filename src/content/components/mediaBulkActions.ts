export const mediaBulkActionsContent = {
  tagModal: {
    existingPrompt: 'Выберите из существующих:',
    addPrompt: 'Или добавьте новые (через запятую):',
    removePrompt: 'Или укажите теги для удаления:',
    inputPlaceholder: 'тег1, тег2, тег3',
    addTitle: 'Добавить теги',
    removeTitle: 'Удалить теги',
    addConfirm: 'Добавить',
    removeConfirm: 'Удалить',
    cancel: 'Отмена',
  },
  deleteModal: {
    title: 'Удалить выбранные файлы?',
    description: (count: number) => `${count} файл(ов) будет удалено без возможности восстановления.`,
    confirmText: 'Удалить',
    cancelText: 'Отмена',
  },
  toolbar: {
    selected: (selectedCount: number, totalCount: number) => `Выбрано: ${selectedCount} из ${totalCount}`,
    deselect: 'Снять выбор',
    selectAll: 'Выбрать все',
    addTag: 'Добавить тег',
    removeTag: 'Удалить тег',
    deleting: 'Удаление...',
    delete: 'Удалить',
  },
} as const;
