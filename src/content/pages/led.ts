import type { Locale } from '../../i18n/types';

const ru = {
  seo: {
    title: 'LED-экраны — аренда и монтаж | Фьючер Скрин',
    description:
      'Аренда LED-экранов для мероприятий: задники сцен, порталы, вогнутые конструкции. Монтаж, процессинг, инженеры.',
  },
  hero: {
    title: 'LED-экраны',
    subtitle: 'Задники сцен, порталы, вогнутые и подвесные конструкции',
  },
  benefitsTitle: 'Преимущества',
  benefits: [
    'Яркость и контраст при солнце и сценическом свете',
    'Модульность: любые размеры и формы',
    'Быстрая сборка/разборка, лёгкие корпуса',
    'Процессинг, инженеры и сервис в комплекте',
  ],
  configsTitle: 'Типовые конфигурации',
  configs: [
    'Задник сцены с порталом и крыльями',
    'Подвесная конструкция для помещений',
    'Вогнутый/выпуклый экран с радиусом',
    'Стойка/тотем для стоек регистрации',
    'Порталы и подиумы для входных групп',
  ],
  selection: {
    title: 'Как выбрать',
    subtitle: 'Простая логика под задачу',
    cards: [
      {
        caption: 'Шаг пикселя',
        title: 'От расстояния до зрителя',
        description: 'До 5 м — 2–2.6 мм, 5–10 м — 3–4 мм, улица/дальше — 4–6 мм.',
      },
      {
        caption: 'Конструкция',
        title: 'Зал, улица или подвес',
        description: 'Подбираем рамы, подвес, стойки с учётом нагрузок и ветровых зон.',
      },
      {
        caption: 'Содержание',
        title: 'Плейаут и процессинг',
        description: 'Медиасервер, коммутаторы, резервный источник по запросу.',
      },
    ],
  },
  faqTitle: 'FAQ',
  faq: [
    'Как выбрать шаг пикселя? — От расстояния до зрителя: 2–3 мм для помещений, 3–4 мм для улицы.',
    'Что входит? — Доставка, монтаж, процессинг, инженер на площадке (по договорённости).',
    'Можно ли подвесить? — Да, при наличии точек крепления и расчёте нагрузок.',
    'Есть ли резерв? — Можем заложить резервные модули и процессинг по запросу.',
  ],
  included: {
    title: 'Что входит',
    items: ['Доставка и монтаж', 'Процессинг и плейаут', 'Инженер на площадке', 'Резерв по запросу'],
  },
  form: {
    title: 'Подобрать LED-решение',
    subtitle: 'Опишите площадку и формат, подберём конфигурацию и КП.',
    ctaText: 'Получить предложение',
  },
};

const en: typeof ru = {
  seo: {
    title: 'LED Screens — Rental and Installation | Future Screen',
    description:
      'LED screen rental for events: stage backdrops, portals, and curved structures. Installation, processing, and engineering included.',
  },
  hero: {
    title: 'LED Screens',
    subtitle: 'Stage backdrops, portals, curved and suspended structures',
  },
  benefitsTitle: 'Benefits',
  benefits: [
    'High brightness and contrast in sunlight and stage lighting',
    'Modularity: any size and shape',
    'Fast setup and teardown with lightweight cabinets',
    'Processing, engineers, and service included',
  ],
  configsTitle: 'Typical Configurations',
  configs: [
    'Stage backdrop with portal and side wings',
    'Suspended construction for indoor venues',
    'Concave/convex screen with radius setup',
    'Stand/totem for registration desks',
    'Portals and podiums for entrance groups',
  ],
  selection: {
    title: 'How to choose',
    subtitle: 'A simple logic based on your task',
    cards: [
      {
        caption: 'Pixel pitch',
        title: 'Based on viewing distance',
        description: 'Up to 5 m — 2–2.6 mm, 5–10 m — 3–4 mm, outdoor/farther — 4–6 mm.',
      },
      {
        caption: 'Construction',
        title: 'Indoor, outdoor, or suspended',
        description: 'We select frames, rigging, and stands based on loads and wind zones.',
      },
      {
        caption: 'Content',
        title: 'Playout and processing',
        description: 'Media server, switchers, and optional backup source.',
      },
    ],
  },
  faqTitle: 'FAQ',
  faq: [
    'How to choose pixel pitch? — Based on viewing distance: 2–3 mm indoors, 3–4 mm outdoors.',
    'What is included? — Delivery, installation, processing, and on-site engineer (by agreement).',
    'Can it be suspended? — Yes, with available rigging points and load calculation.',
    'Do you provide backup? — Yes, we can include backup modules and processing on request.',
  ],
  included: {
    title: 'What is included',
    items: ['Delivery and installation', 'Processing and playout', 'On-site engineer', 'Backup on request'],
  },
  form: {
    title: 'Select an LED setup',
    subtitle: 'Describe venue and format, and we will prepare configuration and quote.',
    ctaText: 'Get proposal',
  },
};

const ledPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getLedPageContent = (locale: Locale) => ledPageContentByLocale[locale];

export const ledPageContent = ru;
