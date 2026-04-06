import type { Locale } from '../../i18n/types';

const ru = {
  seoTitle: 'Страница не найдена | Фьючер Скрин',
  title: 'Страница не найдена',
  subtitle: 'Проверьте адрес или вернитесь на главную',
  description: 'Такой страницы нет. Возможно, она была перемещена или удалена.',
  homeLink: 'На главную',
  contactsLink: 'Контакты',
} as const;

const en: typeof ru = ru;

const notFoundPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getNotFoundPageContent = (locale: Locale) => notFoundPageContentByLocale[locale];

export const notFoundPageContent = ru;
