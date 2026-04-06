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
};

const en: typeof ru = {
  errorTitle: 'Loading error',
  notFoundTitle: 'Category not found',
  fallbackDescription: 'Check the URL or return to the rental page',
  seoTitleSuffix: 'rental | Future Screen',
  factsTitle: 'Facts',
  itemsTitle: 'Available for rent',
  tipsTitle: 'Tips',
  tipsSubtitle: 'What is important to consider',
  requestTitle: 'Get a selection',
  requestSubtitle: 'Describe format and venue, and we will build a setup',
  requestCtaText: 'Select equipment',
  alternativeTitle: 'Need something else?',
  alternativeDescription: 'Browse other rental categories.',
  backLink: 'Back to rental',
  formCtaText: 'Request help',
};

const rentalCategoryPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getRentalCategoryPageContent = (locale: Locale) => rentalCategoryPageContentByLocale[locale];

export const rentalCategoryPageContent = ru;
