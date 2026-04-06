export const adminDashboardContent = {
  layout: {
    title: 'Дашборд',
    subtitle: 'Обзор активности и статистика',
  },
  state: {
    loading: 'Загрузка аналитики...',
    errorPrefix: 'Ошибка загрузки заявок:',
  },
  stats: {
    total: 'Всего заявок',
    week: 'За неделю',
    month: 'За месяц',
    conversion: 'Конверсия',
    noNew: 'Нет новых',
    todaySuffix: 'сегодня',
    withContactsSuffix: 'с контактами',
    fromTotal: (withContacts: number, total: number) => `${withContacts} из ${total}`,
  },
  sections: {
    sources: 'Источники заявок',
    cities: 'Города',
    recentLeads: 'Последние заявки',
    allLeads: 'Все заявки ->',
    noData: 'Пока нет данных',
    emptyRecent:
      'Заявок пока нет. Заполните форму на сайте, чтобы увидеть первую запись.',
  },
  lead: {
    separator: '·',
  },
} as const;
