export const brandContent = {
  namePrimary: 'Фьючер',
  nameSecondary: 'Скрин',
  subtitle: 'Техсопровождение мероприятий',
  phoneDisplay: '8 (912) 246-65-66',
  phoneHref: '+79122466566',
};

export const appContent = {
  title: 'Фьючер Скрин — LED, звук, свет, сцены',
  description:
    'Техсопровождение мероприятий: LED-экраны, звук, свет, сцены. КП за 15 минут. Работаем по РФ с 2007 года.',
};

export const headerContent = {
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
};

export const footerContent = {
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
  ],
  description:
    'Техническое оснащение мероприятий любой сложности. LED-экраны, свет, звук, сцены.',
  legal: 'ООО «Фьючер Скрин» · ИНН/КПП по запросу',
  navigationTitle: 'Навигация',
  rentTitle: 'Аренда',
  contactsTitle: 'Контакты',
  location: 'Екатеринбург, работаем по всей России',
  workHours: 'Ежедневно: 9:00 — 22:00',
  supportHours: 'Техподдержка: 24/7',
  copyright: '© 2007–2026 Фьючер Скрин. Все права защищены.',
  privacyPolicy: 'Политика конфиденциальности',
};

export const requestFormContent = {
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
};

export const consentContent = {
  prefix:
    'Нажимая кнопку «Отправить», я даю согласие на обработку персональных данных в соответствии с',
  linkLabel: 'Политикой конфиденциальности',
};

export const loginModalContent = {
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
};

export const adminGearContent = {
  title: 'Админка',
  editContent: 'Редактировать контент',
  signOut: 'Выйти',
};

export const protectedRouteContent = {
  accessDeniedTitle: 'Доступ запрещён',
  accessDeniedDescription: 'У вас недостаточно прав для доступа к этому разделу.',
  currentRolePrefix: 'Ваша роль:',
  currentRoleUnknown: 'не определена',
  backButton: 'Вернуться назад',
};
