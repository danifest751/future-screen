import type { Locale } from '../../i18n/types';

const ru = {
  layout: {
    title: 'Все настройки',
    subtitle: 'Центр управления',
  },
  sections: [
    {
      to: '/admin/packages',
      title: 'Пакеты',
      desc: 'Тарифы, состав, ценовые подсказки',
      icon: 'package',
    },
    {
      to: '/admin/categories',
      title: 'Категории',
      desc: 'Категории аренды и контент страниц',
      icon: 'tag',
    },
    {
      to: '/admin/contacts',
      title: 'Контакты',
      desc: 'Телефоны, email, адрес, график',
      icon: 'phone',
    },
    {
      to: '/admin/cases',
      title: 'Кейсы',
      desc: 'Портфолио, метрики и изображения',
      icon: 'folderOpen',
    },
    {
      to: '/admin/backgrounds',
      title: 'Фоны',
      desc: 'Глобальный фон и все параметры анимаций',
      icon: 'palette',
    },
    {
      to: '/admin/privacy-policy',
      title: 'Политика',
      desc: 'Текст политики конфиденциальности',
      icon: 'fileText',
    },
    {
      to: '/admin/leads',
      title: 'Заявки',
      desc: 'Лента заявок и экспорт',
      icon: 'inbox',
    },
  ],
};

const en: typeof ru = {
  layout: {
    title: 'All settings',
    subtitle: 'Control center',
  },
  sections: [
    {
      to: '/admin/packages',
      title: 'Packages',
      desc: 'Plans, composition, pricing hints',
      icon: 'package',
    },
    {
      to: '/admin/categories',
      title: 'Categories',
      desc: 'Rental categories and page content',
      icon: 'tag',
    },
    {
      to: '/admin/contacts',
      title: 'Contacts',
      desc: 'Phones, email, address, schedule',
      icon: 'phone',
    },
    {
      to: '/admin/cases',
      title: 'Cases',
      desc: 'Portfolio, metrics, and images',
      icon: 'folderOpen',
    },
    {
      to: '/admin/backgrounds',
      title: 'Backgrounds',
      desc: 'Global background and animation parameters',
      icon: 'palette',
    },
    {
      to: '/admin/privacy-policy',
      title: 'Privacy Policy',
      desc: 'Privacy policy page content',
      icon: 'fileText',
    },
    {
      to: '/admin/leads',
      title: 'Leads',
      desc: 'Lead feed and export',
      icon: 'inbox',
    },
  ],
};

const adminContentIndexContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminContentIndexContent = (locale: Locale) => adminContentIndexContentByLocale[locale];

export const adminContentIndexContent = ru;
