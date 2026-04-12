import type { Locale } from '../i18n/types';

type GlobalContent = {
  brandContent: {
    namePrimary: string;
    nameSecondary: string;
    subtitle: string;
    phoneDisplay: string;
    phoneHref: string;
  };
  appContent: {
    title: string;
    description: string;
  };
  headerContent: {
    navLinks: Array<{ to: string; label: string; hash: boolean }>;
    rentLabel: string;
    casesLabel: string;
    contactsLabel: string;
    signOutTitle: string;
    signInTitle: string;
    menuAriaLabel: string;
  };
  footerContent: {
    navLinks: Array<{ to: string; label: string }>;
    rentLinks: Array<{ to: string; label: string }>;
    description: string;
    legal: string;
    navigationTitle: string;
    rentTitle: string;
    contactsTitle: string;
    location: string;
    workHours: string;
    supportHours: string;
    copyright: string;
    privacyPolicy: string;
    visualLedLink: string;
  };
  requestFormContent: {
    defaults: { title: string; ctaText: string };
    sourcePrefix: string;
    validation: { nameRequired: string; phoneRequired: string; invalidEmail: string };
    submitError: string;
    fields: {
      emailLabel: string;
      emailPlaceholder: string;
      nameLabel: string;
      namePlaceholder: string;
      phoneLabel: string;
      phonePlaceholder: string;
      moreFieldsShow: string;
      moreFieldsHide: string;
      telegramLabel: string;
      telegramPlaceholder: string;
      cityLabel: string;
      cityPlaceholder: string;
      dateLabel: string;
      datePlaceholder: string;
      formatLabel: string;
      formatPlaceholder: string;
      commentLabel: string;
      commentPlaceholder: string;
    };
    submitPending: string;
    submitSuccess: string;
  };
  consentContent: {
    prefix: string;
    linkLabel: string;
  };
  loginModalContent: {
    invalidCredentials: string;
    title: string;
    description: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submitting: string;
    submit: string;
    cancel: string;
  };
  adminGearContent: {
    title: string;
    editContent: string;
    signOut: string;
  };
  protectedRouteContent: {
    accessDeniedTitle: string;
    accessDeniedDescription: string;
    currentRolePrefix: string;
    currentRoleUnknown: string;
    backButton: string;
  };
};

const ru: GlobalContent = {
  brandContent: {
    namePrimary: 'Фьючер',
    nameSecondary: 'Скрин',
    subtitle: 'Техсопровождение мероприятий',
    phoneDisplay: '8 (912) 246-65-66',
    phoneHref: '+79122466566',
  },
  appContent: {
    title: 'Фьючер Скрин — LED, звук, свет, сцены',
    description: 'Техсопровождение мероприятий: LED-экраны, звук, свет, сцены. КП за 15 минут. Работаем по РФ с 2007 года.',
  },
  headerContent: {
    navLinks: [
      { to: '/#about', label: 'О нас', hash: true },
      { to: '/#equipment', label: 'Оборудование', hash: true },
      { to: '/#services', label: 'Услуги', hash: true },
    ],
    rentLabel: 'Аренда',
    casesLabel: 'Кейсы',
    contactsLabel: 'Контакты',
    signOutTitle: 'Выйти',
    signInTitle: 'Войти',
    menuAriaLabel: 'Меню',
  },
  footerContent: {
    navLinks: [
      { to: '/#about', label: 'О нас' },
      { to: '/#equipment', label: 'Оборудование' },
      { to: '/#services', label: 'Услуги' },
      { to: '/cases', label: 'Кейсы' },
      { to: '/#contacts', label: 'Контакты' },
    ],
    rentLinks: [
      { to: '/rent', label: 'Вся аренда' },
      { to: '/rent/video', label: 'Видеоэкраны' },
      { to: '/rent/sound', label: 'Звук' },
      { to: '/rent/light', label: 'Свет' },
      { to: '/rent/stage', label: 'Сцены' },
      { to: '/rent/instruments', label: 'Инструменты' },
      { to: '/visual-led', label: '▦ Визуализатор экрана' },
    ],
    description: 'Техническое оснащение мероприятий любой сложности. LED-экраны, свет, звук, сцены.',
    legal: 'ООО «Фьючер Скрин» · ИНН/КПП по запросу',
    navigationTitle: 'Навигация',
    rentTitle: 'Аренда',
    contactsTitle: 'Контакты',
    location: 'Екатеринбург, работаем по всей России',
    workHours: 'Ежедневно: 9:00 — 22:00',
    supportHours: 'Техподдержка: 24/7',
    copyright: '© 2007–2026 Фьючер Скрин. Все права защищены.',
    privacyPolicy: 'Политика конфиденциальности',
    visualLedLink: 'visual-led',
  },
  requestFormContent: {
    defaults: {
      title: 'Запросить КП',
      ctaText: 'Отправить',
    },
    sourcePrefix: 'Форма КП',
    validation: {
      nameRequired: 'Укажите имя',
      phoneRequired: 'Укажите телефон',
      invalidEmail: 'Некорректный email',
    },
    submitError: 'Не удалось отправить заявку. Проверьте соединение или попробуйте позже.',
    fields: {
      emailLabel: 'Email',
      emailPlaceholder: 'example@mail.ru',
      nameLabel: 'Имя*',
      namePlaceholder: 'Имя',
      phoneLabel: 'Телефон*',
      phonePlaceholder: '+7',
      moreFieldsShow: 'Ещё поля',
      moreFieldsHide: 'Скрыть дополнительные поля',
      telegramLabel: 'Telegram',
      telegramPlaceholder: '@username',
      cityLabel: 'Город',
      cityPlaceholder: 'Екатеринбург',
      dateLabel: 'Дата/период',
      datePlaceholder: '25–27 мая',
      formatLabel: 'Формат',
      formatPlaceholder: 'Форум, концерт, выставка...',
      commentLabel: 'Комментарий',
      commentPlaceholder: 'Кратко опишите задачу',
    },
    submitPending: 'Отправляем...',
    submitSuccess: 'Спасибо! Мы свяжемся в течение 15 минут.',
  },
  consentContent: {
    prefix: 'Нажимая кнопку «Отправить», я даю согласие на обработку персональных данных в соответствии с',
    linkLabel: 'Политикой конфиденциальности',
  },
  loginModalContent: {
    invalidCredentials: 'Неверный email или пароль',
    title: 'Вход в админку',
    description: 'Введите логин и пароль',
    emailLabel: 'Email',
    emailPlaceholder: 'Email',
    passwordLabel: 'Пароль',
    passwordPlaceholder: 'Пароль',
    submitting: 'Входим...',
    submit: 'Войти',
    cancel: 'Отмена',
  },
  adminGearContent: {
    title: 'Админка',
    editContent: 'Редактировать контент',
    signOut: 'Выйти',
  },
  protectedRouteContent: {
    accessDeniedTitle: 'Доступ запрещён',
    accessDeniedDescription: 'У вас недостаточно прав для доступа к этому разделу.',
    currentRolePrefix: 'Ваша роль:',
    currentRoleUnknown: 'не определена',
    backButton: 'Вернуться назад',
  },
};

const en: GlobalContent = {
  brandContent: {
    namePrimary: 'Future',
    nameSecondary: 'Screen',
    subtitle: 'Event technical production',
    phoneDisplay: '+7 (912) 246-65-66',
    phoneHref: '+79122466566',
  },
  appContent: {
    title: 'Future Screen — LED, sound, lighting, stage',
    description: 'Technical production for events: LED screens, sound, lighting, and stage systems. Proposal in 15 minutes.',
  },
  headerContent: {
    navLinks: [
      { to: '/#about', label: 'About', hash: true },
      { to: '/#equipment', label: 'Equipment', hash: true },
      { to: '/#services', label: 'Services', hash: true },
    ],
    rentLabel: 'Rental',
    casesLabel: 'Cases',
    contactsLabel: 'Contacts',
    signOutTitle: 'Sign out',
    signInTitle: 'Sign in',
    menuAriaLabel: 'Menu',
  },
  footerContent: {
    navLinks: [
      { to: '/#about', label: 'About' },
      { to: '/#equipment', label: 'Equipment' },
      { to: '/#services', label: 'Services' },
      { to: '/cases', label: 'Cases' },
      { to: '/#contacts', label: 'Contacts' },
    ],
    rentLinks: [
      { to: '/rent', label: 'All rental' },
      { to: '/rent/video', label: 'Video screens' },
      { to: '/rent/sound', label: 'Sound' },
      { to: '/rent/light', label: 'Lighting' },
      { to: '/rent/stage', label: 'Stages' },
      { to: '/rent/instruments', label: 'Instruments' },
      { to: '/visual-led', label: '▦ Screen visualizer' },
    ],
    description: 'Technical event production of any scale. LED screens, lighting, sound, and stage solutions.',
    legal: 'Future Screen LLC · Tax details on request',
    navigationTitle: 'Navigation',
    rentTitle: 'Rental',
    contactsTitle: 'Contacts',
    location: 'Yekaterinburg, working across Russia',
    workHours: 'Daily: 9:00 — 22:00',
    supportHours: 'Tech support: 24/7',
    copyright: '© 2007–2026 Future Screen. All rights reserved.',
    privacyPolicy: 'Privacy policy',
    visualLedLink: 'visual-led',
  },
  requestFormContent: {
    defaults: {
      title: 'Request a quote',
      ctaText: 'Send',
    },
    sourcePrefix: 'Quote form',
    validation: {
      nameRequired: 'Enter your name',
      phoneRequired: 'Enter your phone number',
      invalidEmail: 'Invalid email',
    },
    submitError: 'Could not submit the form. Check your connection and try again.',
    fields: {
      emailLabel: 'Email',
      emailPlaceholder: 'example@mail.com',
      nameLabel: 'Name*',
      namePlaceholder: 'Name',
      phoneLabel: 'Phone*',
      phonePlaceholder: '+1',
      moreFieldsShow: 'More fields',
      moreFieldsHide: 'Hide additional fields',
      telegramLabel: 'Telegram',
      telegramPlaceholder: '@username',
      cityLabel: 'City',
      cityPlaceholder: 'Yekaterinburg',
      dateLabel: 'Date/period',
      datePlaceholder: 'May 25–27',
      formatLabel: 'Event type',
      formatPlaceholder: 'Forum, concert, expo...',
      commentLabel: 'Comment',
      commentPlaceholder: 'Briefly describe your task',
    },
    submitPending: 'Sending...',
    submitSuccess: 'Thank you! We will contact you within 15 minutes.',
  },
  consentContent: {
    prefix: 'By clicking “Send”, I agree to personal data processing in accordance with the',
    linkLabel: 'Privacy Policy',
  },
  loginModalContent: {
    invalidCredentials: 'Invalid email or password',
    title: 'Admin sign in',
    description: 'Enter login and password',
    emailLabel: 'Email',
    emailPlaceholder: 'Email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Password',
    submitting: 'Signing in...',
    submit: 'Sign in',
    cancel: 'Cancel',
  },
  adminGearContent: {
    title: 'Admin',
    editContent: 'Edit content',
    signOut: 'Sign out',
  },
  protectedRouteContent: {
    accessDeniedTitle: 'Access denied',
    accessDeniedDescription: 'You do not have permission to access this section.',
    currentRolePrefix: 'Your role:',
    currentRoleUnknown: 'undefined',
    backButton: 'Go back',
  },
};

const globalContentByLocale: Record<Locale, GlobalContent> = { ru, en };

export const getGlobalContent = (locale: Locale): GlobalContent => globalContentByLocale[locale];
