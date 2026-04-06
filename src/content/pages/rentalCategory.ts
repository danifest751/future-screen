import type { Locale } from '../../i18n/types';

const ru = {
  errorTitle: 'Ошибка загрузки',
  notFoundTitle: 'Категория не найдена',
  fallbackDescription: 'Проверьте URL или вернитесь на страницу аренды',
  seoTitleSuffix: 'аренда | Фьючер Скрин',
  factsTitle: 'Факты',
  itemsTitle: 'Что можно арендовать',
  tipsTitle: 'Советы',
  tipsSubtitle: 'Что важно учесть',
  requestTitle: 'Получить подбор',
  requestSubtitle: 'Опишите формат и площадку, соберём комплект',
  requestCtaText: 'Подобрать оборудование',
  alternativeTitle: 'Нужно другое?',
  alternativeDescription: 'Посмотрите остальные категории аренды.',
  backLink: 'Вернуться к аренде',
  formCtaText: 'Запросить помощь',
} as const;

const en: typeof ru = ru;

const rentalCategoryPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getRentalCategoryPageContent = (locale: Locale) => rentalCategoryPageContentByLocale[locale];

export const rentalCategoryPageContent = ru;
