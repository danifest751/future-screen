export const adminRentalCategoriesContent = {
  layout: {
    title: 'Категории аренды',
    subtitle: 'Управление разделами оборудования в аренду',
  },
  toasts: {
    saveSuccess: 'Настройка сохранена',
    saveError: 'Ошибка сохранения',
  },
  actions: {
    refresh: 'Обновить',
    add: 'Добавить',
  },
  state: {
    count: (value: number) => `${value} категорий`,
    loading: 'Загрузка...',
    errorPrefix: 'Ошибка:',
    empty: 'Нет категорий аренды. Создайте первую.',
  },
  table: {
    name: 'Название',
    slug: 'Slug',
    order: 'Порядок',
    status: 'Статус',
    actions: 'Действия',
    published: 'Опубликовано',
    draft: 'Черновик',
    blurEnabled: 'Blur-эффект включен',
    blurDisabled: 'Blur-эффект выключен',
    openPage: 'Открыть страницу',
    edit: 'Редактировать',
  },
} as const;
