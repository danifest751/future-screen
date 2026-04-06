import type { Locale } from '../../i18n/types';

const ru = {
  layout: {
    title: 'Лента заявок',
    subtitle: 'Все заявки с сайта и подробный журнал их доставки',
  },
  statusLabels: {
    queued: 'В очереди',
    processing: 'В обработке',
    delivered: 'Доставлено',
    partial: 'Частично',
    failed: 'Ошибка',
    newFallback: 'Новый',
  },
  entryStatusLabels: {
    pending: 'Ожидает',
    success: 'Успешно',
    warning: 'Предупреждение',
    error: 'Ошибка',
  },
  channelLabels: {
    system: 'Система',
    api: 'API',
    telegram: 'Telegram',
    email: 'Email',
    'client-email': 'Письмо клиенту',
    database: 'База',
  },
  requestId: {
    label: 'Request ID',
  },
  logModal: {
    title: 'Лог заявки',
    close: 'Закрыть',
    cards: {
      status: 'Статус',
      created: 'Создана',
      steps: 'Шагов',
    },
    empty: 'Подробный лог еще не записан.',
  },
  leadCard: {
    actions: {
      log: 'Лог',
      page: 'Страница',
    },
    fields: {
      phone: 'Телефон',
      email: 'Email',
      telegram: 'Telegram',
      city: 'Город',
      date: 'Дата',
      format: 'Формат',
      lastStep: 'Последний шаг',
      details: 'Детали расчета',
      comment: 'Комментарий',
    },
  },
  confirm: {
    clearTitle: 'Очистить все заявки?',
    clearDescription: 'Будут удалены все записи из таблицы leads. Действие необратимо.',
    clearConfirm: 'Очистить',
    cancel: 'Отмена',
  },
  loading: {
    title: 'Загрузка заявок',
    description: 'Подождите, данные подтягиваются из базы',
  },
  errors: {
    prefix: 'Ошибка',
  },
  summary: {
    shown: (filtered: number, total: number) => `Показано: ${filtered} из ${total}`,
  },
  actions: {
    exportCsv: 'Экспорт CSV',
    exportJson: 'Экспорт JSON',
    clearAll: 'Очистить все',
  },
  chips: {
    search: (value: string) => `Поиск: ${value}`,
    source: (value: string) => `Источник: ${value}`,
    reset: 'Сбросить фильтры',
  },
  filters: {
    searchLabel: 'Поиск',
    searchPlaceholder: 'Имя, телефон, email, город, request id',
    sourceLabel: 'Источник',
    sourceAll: 'Все источники',
  },
  empty: {
    noLeadsTitle: 'Заявок пока нет',
    noLeadsDescription: 'После первой отправки формы здесь появятся карточки заявок и журнал доставки.',
    notFoundTitle: 'Ничего не найдено',
    notFoundDescription: 'Измените поисковый запрос или сбросьте фильтры.',
  },
  toasts: {
    clearSuccess: 'Заявки удалены',
    clearError: 'Не удалось удалить заявки',
    exportJsonSuccess: 'JSON экспорт готов',
    exportJsonError: 'Ошибка экспорта JSON',
    exportCsvSuccess: 'CSV экспорт готов',
    exportCsvError: 'Ошибка экспорта CSV',
  },
  csvHeaders: [
    'ID',
    'Request ID',
    'Дата',
    'Время',
    'Источник',
    'Статус',
    'Имя',
    'Телефон',
    'Email',
    'Telegram',
    'Город',
    'Дата события',
    'Формат',
    'Комментарий',
  ],
};

const en: typeof ru = {
  layout: {
    title: 'Leads feed',
    subtitle: 'All website leads and detailed delivery logs',
  },
  statusLabels: {
    queued: 'Queued',
    processing: 'Processing',
    delivered: 'Delivered',
    partial: 'Partial',
    failed: 'Failed',
    newFallback: 'New',
  },
  entryStatusLabels: {
    pending: 'Pending',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
  },
  channelLabels: {
    system: 'System',
    api: 'API',
    telegram: 'Telegram',
    email: 'Email',
    'client-email': 'Client email',
    database: 'Database',
  },
  requestId: {
    label: 'Request ID',
  },
  logModal: {
    title: 'Lead log',
    close: 'Close',
    cards: {
      status: 'Status',
      created: 'Created',
      steps: 'Steps',
    },
    empty: 'Detailed log has not been recorded yet.',
  },
  leadCard: {
    actions: {
      log: 'Log',
      page: 'Page',
    },
    fields: {
      phone: 'Phone',
      email: 'Email',
      telegram: 'Telegram',
      city: 'City',
      date: 'Date',
      format: 'Format',
      lastStep: 'Last step',
      details: 'Estimate details',
      comment: 'Comment',
    },
  },
  confirm: {
    clearTitle: 'Clear all leads?',
    clearDescription: 'All records from the leads table will be deleted. This action is irreversible.',
    clearConfirm: 'Clear',
    cancel: 'Cancel',
  },
  loading: {
    title: 'Loading leads',
    description: 'Please wait while data is fetched from the database',
  },
  errors: {
    prefix: 'Error',
  },
  summary: {
    shown: (filtered: number, total: number) => `Shown: ${filtered} of ${total}`,
  },
  actions: {
    exportCsv: 'Export CSV',
    exportJson: 'Export JSON',
    clearAll: 'Clear all',
  },
  chips: {
    search: (value: string) => `Search: ${value}`,
    source: (value: string) => `Source: ${value}`,
    reset: 'Reset filters',
  },
  filters: {
    searchLabel: 'Search',
    searchPlaceholder: 'Name, phone, email, city, request id',
    sourceLabel: 'Source',
    sourceAll: 'All sources',
  },
  empty: {
    noLeadsTitle: 'No leads yet',
    noLeadsDescription: 'After the first form submission, lead cards and delivery logs will appear here.',
    notFoundTitle: 'Nothing found',
    notFoundDescription: 'Change your search query or reset filters.',
  },
  toasts: {
    clearSuccess: 'Leads deleted',
    clearError: 'Failed to delete leads',
    exportJsonSuccess: 'JSON export is ready',
    exportJsonError: 'JSON export failed',
    exportCsvSuccess: 'CSV export is ready',
    exportCsvError: 'CSV export failed',
  },
  csvHeaders: [
    'ID',
    'Request ID',
    'Date',
    'Time',
    'Source',
    'Status',
    'Name',
    'Phone',
    'Email',
    'Telegram',
    'City',
    'Event date',
    'Format',
    'Comment',
  ],
};

const adminLeadsContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminLeadsContent = (locale: Locale) => adminLeadsContentByLocale[locale];

export const adminLeadsContent = ru;
