import type { Locale } from '../../i18n/types';

const ru = {
  seo: {
    title: 'Контакты | Фьючер Скрин',
    description: 'Контакты Фьючер Скрин: телефон, email, адрес. Свяжитесь любым удобным способом.',
  },
  hero: {
    title: 'Контакты',
    subtitle: 'Свяжитесь любым удобным способом',
  },
  errors: {
    loadTitle: 'Не удалось загрузить контакты',
    emptyTitle: 'Контакты не найдены',
    emptyDescription: 'Обратитесь к администратору сайта',
  },
  labels: {
    phones: 'Телефоны',
    email: 'Email',
    address: 'Адрес',
    workingHours: 'Режим работы',
    mapTitle: 'Карта',
    openInMaps: 'Открыть в Яндекс.Картах',
  },
  form: {
    title: 'Оставить заявку',
    subtitle: 'Имя, телефон и кратко о задаче — ответим в течение 15 минут',
    ctaText: 'Отправить',
  },
} as const;

const en: typeof ru = ru;

const contactsPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getContactsPageContent = (locale: Locale) => contactsPageContentByLocale[locale];

export const contactsPageContent = ru;
