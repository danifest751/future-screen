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
};

const en: typeof ru = {
  seo: {
    title: 'Contacts | Future Screen',
    description: 'Future Screen contacts: phone, email, and address. Reach us in any convenient way.',
  },
  hero: {
    title: 'Contacts',
    subtitle: 'Get in touch in any convenient way',
  },
  errors: {
    loadTitle: 'Failed to load contacts',
    emptyTitle: 'Contacts not found',
    emptyDescription: 'Please contact the site administrator',
  },
  labels: {
    phones: 'Phones',
    email: 'Email',
    address: 'Address',
    workingHours: 'Working hours',
    mapTitle: 'Map',
    openInMaps: 'Open in Yandex Maps',
  },
  form: {
    title: 'Leave a request',
    subtitle: 'Name, phone, and brief task description — we reply within 15 minutes',
    ctaText: 'Send',
  },
};

const contactsPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getContactsPageContent = (locale: Locale) => contactsPageContentByLocale[locale];

export const contactsPageContent = ru;
