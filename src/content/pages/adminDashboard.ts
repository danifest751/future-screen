import type { Locale } from '../../i18n/types';

const ru = {
  layout: {
    title: 'Дашборд',
    subtitle: 'Операционный обзор заявок, источников и быстрых разделов админки',
  },
  state: {
    loading: 'Загружаем аналитику',
    errorTitle: 'Не удалось загрузить заявки',
    errorPrefix: 'Ошибка загрузки заявок:',
  },
  stats: {
    total: 'Всего заявок',
    week: 'За неделю',
    month: 'За 30 дней',
    conversion: 'С контактами',
    noNew: 'Нет новых сегодня',
    todaySuffix: 'сегодня',
    withContactsSuffix: 'с контактами',
    fromTotal: (withContacts: number, total: number) => `${withContacts} из ${total}`,
  },
  sections: {
    sources: 'Источники заявок',
    cities: 'Города',
    recentLeads: 'Последние заявки',
    allLeads: 'Все заявки',
    contentHub: 'Быстрые разделы',
    noData: 'Пока нет данных',
    emptyRecentTitle: 'Заявок пока нет',
    emptyRecentDescription: 'Когда клиент отправит форму на сайте, запись появится в этой ленте.',
  },
  lead: {
    separator: '·',
    noContact: 'Контакт не указан',
  },
  deleteModal: {
    title: 'Скрыть заявку?',
    description: (name: string) => `Заявка «${name}» будет скрыта из активного списка.`,
    action: 'Скрыть',
    cancel: 'Отмена',
    success: 'Заявка скрыта',
    error: 'Не удалось удалить заявку',
  },
};

const en: typeof ru = {
  layout: {
    title: 'Dashboard',
    subtitle: 'Operational view of leads, sources, and fast admin sections',
  },
  state: {
    loading: 'Loading analytics',
    errorTitle: 'Could not load leads',
    errorPrefix: 'Leads loading error:',
  },
  stats: {
    total: 'Total leads',
    week: 'This week',
    month: 'Last 30 days',
    conversion: 'With contacts',
    noNew: 'No new leads today',
    todaySuffix: 'today',
    withContactsSuffix: 'with contacts',
    fromTotal: (withContacts: number, total: number) => `${withContacts} of ${total}`,
  },
  sections: {
    sources: 'Lead sources',
    cities: 'Cities',
    recentLeads: 'Recent leads',
    allLeads: 'All leads',
    contentHub: 'Fast sections',
    noData: 'No data yet',
    emptyRecentTitle: 'No leads yet',
    emptyRecentDescription: 'When a client submits the site form, the record will appear in this feed.',
  },
  lead: {
    separator: '·',
    noContact: 'No contact provided',
  },
  deleteModal: {
    title: 'Hide lead?',
    description: (name: string) => `Lead "${name}" will be hidden from the active list.`,
    action: 'Hide',
    cancel: 'Cancel',
    success: 'Lead hidden',
    error: 'Failed to delete lead',
  },
};

const adminDashboardContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminDashboardContent = (locale: Locale) => adminDashboardContentByLocale[locale];

export const adminDashboardContent = ru;
