import type { Locale } from '../../i18n/types';

const ru = {
  seo: {
    title: 'Пакеты и цены | Фьючер Скрин',
    description:
      'Пакеты техсопровождения: Лайт, Медиум, Биг. Прозрачные цены на LED, звук, свет, сцены.',
  },
  hero: {
    title: 'Пакеты и ориентиры',
    subtitle: 'Лайт · Медиум · Биг, подберите базовый комплект',
    loading: 'Загрузка...',
    fallbackFormat: 'Универсальный',
    optionsLabel: 'Опции:',
    detailsLink: 'Подробнее',
  },
  pricing: {
    title: 'Как формируем цену',
    items: [
      'Формат и длительность мероприятия',
      'Площадка: зал/улица, габариты, подвес',
      'Состав оборудования и резерв',
      'Логистика и окна на монтаж/демонтаж',
    ],
  },
  form: {
    title: 'Получить ориентир',
    subtitle: 'Опишите формат, вышлем примерные вилки',
    ctaText: 'Запросить вилку',
  },
} as const;

const en: typeof ru = ru;

const pricesPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getPricesPageContent = (locale: Locale) => pricesPageContentByLocale[locale];

export const pricesPageContent = ru;
