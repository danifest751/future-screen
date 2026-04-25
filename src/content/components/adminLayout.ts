import type { Locale } from '../../i18n/types';

type AdminLayoutContent = {
  nav: {
    dashboard: string;
    leads: string;
    cases: string;
    packages: string;
    categories: string;
    rentalCategories: string;
    contacts: string;
    visualLed: string;
    visualLedLogs: string;
    contentHistory: string;
  };
  navGroups: {
    main: string;
    content: string;
    catalog: string;
    visualizers: string;
  };
  breadcrumbs: {
    admin: string;
  };
  menu: {
    open: string;
    close: string;
  };
  brand: {
    name: string;
    adminPanel: string;
  };
  actions: {
    logout: string;
  };
  quickLinks: {
    label: string;
  };
  profile: {
    role: string;
  };
  locale: {
    adminLabel: string;
    contentLabel: string;
  };
};

const ru: AdminLayoutContent = {
  nav: {
    dashboard: 'Дашборд',
    leads: 'Заявки',
    cases: 'Кейсы',
    packages: 'Пакеты',
    categories: 'Категории',
    rentalCategories: 'Аренда',
    contacts: 'Контакты',
    visualLed: 'Визуализатор экрана',
    visualLedLogs: 'Логи visual-led',
    contentHistory: 'История контента',
  },
  navGroups: {
    main: 'Основное',
    content: 'Контент',
    catalog: 'Каталог',
    visualizers: 'Визуализаторы',
  },
  breadcrumbs: {
    admin: 'Админ',
  },
  menu: {
    open: 'Открыть меню',
    close: 'Закрыть меню',
  },
  brand: {
    name: 'Фьючер Скрин',
    adminPanel: 'Панель управления',
  },
  actions: {
    logout: 'Выйти',
  },
  quickLinks: {
    label: 'Быстрый переход:',
  },
  profile: {
    role: 'Admin',
  },
  locale: {
    adminLabel: 'Язык админки',
    contentLabel: 'Локаль контента',
  },
};

const en: AdminLayoutContent = {
  nav: {
    dashboard: 'Dashboard',
    leads: 'Leads',
    cases: 'Cases',
    packages: 'Packages',
    categories: 'Categories',
    rentalCategories: 'Rental',
    contacts: 'Contacts',
    visualLed: 'Screen visualizer',
    visualLedLogs: 'Visual LED logs',
    contentHistory: 'Content history',
  },
  navGroups: {
    main: 'Main',
    content: 'Content',
    catalog: 'Catalog',
    visualizers: 'Visualizers',
  },
  breadcrumbs: {
    admin: 'Admin',
  },
  menu: {
    open: 'Open menu',
    close: 'Close menu',
  },
  brand: {
    name: 'Future Screen',
    adminPanel: 'Control panel',
  },
  actions: {
    logout: 'Sign out',
  },
  quickLinks: {
    label: 'Quick links:',
  },
  profile: {
    role: 'Admin',
  },
  locale: {
    adminLabel: 'Admin language',
    contentLabel: 'Content locale',
  },
};

const adminLayoutByLocale: Record<Locale, AdminLayoutContent> = { ru, en };

export const getAdminLayoutContent = (locale: Locale): AdminLayoutContent => adminLayoutByLocale[locale];
