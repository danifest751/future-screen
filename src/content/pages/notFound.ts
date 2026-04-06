import type { Locale } from '../../i18n/types';

const ru = {
  seoTitle: 'Страница не найдена | Фьючер Скрин',
  title: 'Страница не найдена',
  subtitle: 'Проверьте адрес или вернитесь на главную',
  description: 'Такой страницы нет. Возможно, она была перемещена или удалена.',
  homeLink: 'На главную',
  contactsLink: 'Контакты',
};

const en: typeof ru = {
  seoTitle: 'Page Not Found | Future Screen',
  title: 'Page not found',
  subtitle: 'Check the URL or return to the homepage',
  description: 'This page does not exist. It may have been moved or removed.',
  homeLink: 'Home',
  contactsLink: 'Contacts',
};

const notFoundPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getNotFoundPageContent = (locale: Locale) => notFoundPageContentByLocale[locale];

export const notFoundPageContent = ru;
