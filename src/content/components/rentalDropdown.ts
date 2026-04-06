import type { Locale } from '../../i18n/types';

const ru = {
  headerTitle: 'Категории аренды',
  allLink: 'Все →',
  emptyState: 'Категории не найдены',
  footerCta: 'Вся аренда оборудования',
};

const en: typeof ru = {
  headerTitle: 'Rental categories',
  allLink: 'All →',
  emptyState: 'No categories found',
  footerCta: 'All rental equipment',
};

const rentalDropdownContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getRentalDropdownContent = (locale: Locale) => rentalDropdownContentByLocale[locale];

export const rentalDropdownContent = ru;
