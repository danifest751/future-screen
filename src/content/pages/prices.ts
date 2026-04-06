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
};

const en: typeof ru = {
  seo: {
    title: 'Packages and Pricing | Future Screen',
    description:
      'Technical production packages: Lite, Medium, and Big. Transparent pricing for LED, sound, lighting, and stage.',
  },
  hero: {
    title: 'Packages and Price Ranges',
    subtitle: 'Lite · Medium · Big — choose a baseline setup',
    loading: 'Loading...',
    fallbackFormat: 'Universal',
    optionsLabel: 'Options:',
    detailsLink: 'Details',
  },
  pricing: {
    title: 'How we build pricing',
    items: [
      'Event format and duration',
      'Venue specifics: indoor/outdoor, dimensions, rigging',
      'Equipment scope and backup level',
      'Logistics and installation/dismantling windows',
    ],
  },
  form: {
    title: 'Get a rough estimate',
    subtitle: 'Describe the event format and we will send expected ranges',
    ctaText: 'Request estimate',
  },
};

const pricesPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getPricesPageContent = (locale: Locale) => pricesPageContentByLocale[locale];

export const pricesPageContent = ru;
