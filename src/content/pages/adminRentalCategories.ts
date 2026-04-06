import type { Locale } from '../../i18n/types';

const ru = {
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
};

const en: typeof ru = {
  layout: {
    title: 'Rental categories',
    subtitle: 'Manage rental equipment sections',
  },
  toasts: {
    saveSuccess: 'Setting saved',
    saveError: 'Save error',
  },
  actions: {
    refresh: 'Refresh',
    add: 'Add',
  },
  state: {
    count: (value: number) => `${value} categories`,
    loading: 'Loading...',
    errorPrefix: 'Error:',
    empty: 'No rental categories yet. Create the first one.',
  },
  table: {
    name: 'Name',
    slug: 'Slug',
    order: 'Order',
    status: 'Status',
    actions: 'Actions',
    published: 'Published',
    draft: 'Draft',
    blurEnabled: 'Blur effect enabled',
    blurDisabled: 'Blur effect disabled',
    openPage: 'Open page',
    edit: 'Edit',
  },
};

const adminRentalCategoriesContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminRentalCategoriesContent = (locale: Locale) => adminRentalCategoriesContentByLocale[locale];

export const adminRentalCategoriesContent = ru;
