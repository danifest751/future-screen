export const adminContentIndexContent = {
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
} as const;
