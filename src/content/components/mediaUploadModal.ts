export const mediaUploadModalContent = {
  header: {
    title: 'Загрузка файлов',
  },
  tags: {
    label: 'Теги для файлов',
    placeholder: 'Введите теги через запятую...',
    hint: 'Нажмите Enter, запятую или пробел для добавления тега',
  },
  dropZone: {
    prompt: 'Перетащите файлы сюда или нажмите для выбора',
    formats: 'JPG, PNG, GIF, WEBP, MP4, WEBM, MOV',
  },
  list: {
    selectedFiles: (count: number) => `Выбранные файлы (${count})`,
    clear: 'Очистить',
    completed: 'Готово',
    error: 'Ошибка',
    originalSize: (size: string) => `Исходный размер: ${size}`,
  },
  progress: {
    uploading: 'Загрузка...',
  },
  actions: {
    close: 'Закрыть',
    cancel: 'Отмена',
    done: (count: number) => `Готово (${count})`,
    upload: 'Загрузить',
    uploading: 'Загрузка...',
  },
} as const;
