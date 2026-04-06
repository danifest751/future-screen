import type { Locale } from '../../i18n/types';

export type HomeIconKey =
  | 'led'
  | 'panel'
  | 'sound'
  | 'light'
  | 'stage'
  | 'computer'
  | 'touch'
  | 'staff'
  | 'corporate'
  | 'concert'
  | 'conference'
  | 'wedding'
  | 'exhibition'
  | 'presentation'
  | 'festival'
  | 'promo'
  | 'theater'
  | 'sports';

const ru = {
  seo: {
    title: 'Фьючер Скрин — Техническое оснащение мероприятий | LED-экраны, звук, свет',
    description:
      'Аренда LED-экранов, звукового и светового оборудования в Екатеринбурге. Техническое сопровождение концертов, корпоративов, конференций с 2007 года.',
    keywords:
      'аренда led экранов, техническое оснащение мероприятий, аренда звука, аренда света, сценические конструкции, светодиодные экраны, Екатеринбург',
  },
  hero: {
    badge: 'Работаем по всей России с 2007 года',
    titleLines: ['Аренда экранов,', 'звука, света', 'и сцены'],
    subtitle:
      'Техническое обеспечение корпоративов, концертов, конференций и выставок любого масштаба',
    primaryCta: 'Рассчитать мероприятие',
    secondaryCta: 'Смотреть кейсы',
    stats: [
      { value: '18+', label: 'лет опыта' },
      { value: '500+', label: 'мероприятий/год' },
      { value: '300+', label: 'единиц техники' },
      { value: '24/7', label: 'поддержка' },
    ],
  },
  works: {
    badge: 'Наши работы',
    title: 'Мероприятия,',
    accentTitle: 'которые мы делали',
    allCasesLink: 'Все кейсы →',
    prevLabel: 'Назад',
    nextLabel: 'Вперёд',
    items: [
      { src: '/images/work-corporate-gala.png', tag: 'Корпоратив', title: 'Гала-ужин производственной компании' },
      { src: '/images/work-festival.png', tag: 'Open-air фестиваль', title: 'Летний музыкальный фестиваль' },
      { src: '/images/work-conference.png', tag: 'Конференция', title: 'Деловой форум 2000 участников' },
      { src: '/images/work-concert.png', tag: 'Концерт', title: 'Rock-шоу с LED-стеной 200 м²' },
      { src: '/images/work-wedding.png', tag: 'Свадьба', title: 'Торжественная церемония в банкетном зале' },
      { src: '/images/work-product-launch.png', tag: 'Презентация', title: 'Запуск флагманского продукта' },
      { src: '/images/work-exhibition.png', tag: 'Выставка', title: 'Стенд на международном форуме' },
      { src: '/images/work-newyear.png', tag: 'Новый год', title: 'Корпоративный новогодний праздник' },
      { src: '/images/work-awards.png', tag: 'Награждение', title: 'Церемония вручения премий' },
      { src: '/images/work-sports.png', tag: 'Спорт', title: 'Финальный матч чемпионата' },
    ],
  },
  equipmentSection: {
    badge: 'Парк оборудования',
    title: 'Оборудование',
    accentTitle: 'в аренду',
    subtitle:
      'Полный спектр профессионального оборудования для мероприятий любого масштаба',
    items: [
      {
        iconKey: 'led' as const,
        title: 'LED-экраны',
        desc: 'Интерьерные и уличные светодиодные экраны различного размера и разрешения от 2.6мм шаг пикселя',
        bullets: ['Экраны от 3×2м до 10×6м', 'Модульная система сборки', 'Фермовые конструкции до 7м'],
        gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
        link: '/rent/video',
        photo: '/images/led-closeup.png',
      },
      {
        iconKey: 'panel' as const,
        title: 'Плазменные панели',
        desc: 'LED и OLED панели диагональю от 32" до 100" для презентаций и выставок',
        bullets: ['Диагонали 32"—100"', '4K Ultra HD разрешение', 'Более 300 панелей в парке'],
        gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        link: '/rent/video',
        photo: '/images/equip-plasma.png',
      },
      {
        iconKey: 'sound' as const,
        title: 'Звуковое оборудование',
        desc: 'Профессиональные звуковые комплекты, микрофоны, микшеры для концертов и конференций',
        bullets: ['Активные акустические системы', 'Радиомикрофоны Shure/Sennheiser', 'Микшерные пульты'],
        gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
        link: '/rent/sound',
        photo: '/images/equip-sound.png',
      },
      {
        iconKey: 'light' as const,
        title: 'Световое оборудование',
        desc: 'Прожекторы, PAR-ы, LED-панели, динамические головы для сценического освещения',
        bullets: ['LED PAR и прожекторы', 'Динамические световые приборы', 'Контроллеры DMX'],
        gradient: 'linear-gradient(135deg, #ffd89b, #19547b)',
        link: '/rent/light',
        photo: '/images/equip-light.png',
      },
      {
        iconKey: 'stage' as const,
        title: 'Сценические конструкции',
        desc: 'Модульные сцены, фермы, подиумы и трасты для создания площадок любой сложности',
        bullets: ['Модульные сценические площадки', 'Алюминиевые фермы', 'Подвес для света и экранов'],
        gradient: 'linear-gradient(135deg, #11998e, #38ef7d)',
        link: '/rent/stage',
        photo: '/images/equip-stage.png',
      },
    ],
    extraItems: [
      {
        iconKey: 'computer' as const,
        title: 'Компьютеры и ноутбуки',
        desc: 'Core i7/i5, игровые и офисные конфигурации',
        link: '/rent/computers',
        photo: '/images/equip-computers.png',
      },
      {
        iconKey: 'touch' as const,
        title: 'Тачскрины',
        desc: 'Интерактивные столы 42"–55" с 10-точечным касанием',
        link: '/rent/touchscreens',
        photo: '/images/equip-touch.png',
      },
      {
        iconKey: 'staff' as const,
        title: 'Технический персонал',
        desc: 'Видеооператоры, звукорежиссёры, техники',
        link: '/rent/staff',
        photo: '/images/equip-staff.png',
      },
    ],
  },
  eventTypesSection: {
    badge: 'Наши направления',
    title: 'Направления',
    accentTitle: 'мероприятий',
    prevLabel: 'Назад',
    nextLabel: 'Вперёд',
    items: [
      {
        iconKey: 'corporate' as const,
        title: 'Корпоративы',
        desc: 'Техническое оснащение корпоративных праздников и тимбилдингов',
        photo: '/images/gala-event.png',
      },
      {
        iconKey: 'concert' as const,
        title: 'Концерты',
        desc: 'Полный технический райдер для концертных площадок и фестивалей',
        photo: '/images/hero-concert.png',
      },
      {
        iconKey: 'conference' as const,
        title: 'Конференции',
        desc: 'Системы синхронного перевода, проекторы, микрофоны',
        photo: '/images/event-conference.png',
      },
      {
        iconKey: 'wedding' as const,
        title: 'Свадьбы',
        desc: 'LED-экраны для банкетных залов, свет, звук',
        photo: '/images/event-wedding.png',
      },
      {
        iconKey: 'exhibition' as const,
        title: 'Выставки',
        desc: 'Светодиодные экраны для стендов, интерактивные панели',
        photo: '/images/event-exhibition.png',
      },
      {
        iconKey: 'presentation' as const,
        title: 'Презентации',
        desc: 'Премиум-решения для продуктовых презентаций',
        photo: '/images/event-presentation.png',
      },
      {
        iconKey: 'festival' as const,
        title: 'Фестивали',
        desc: 'Open-air площадки: сцена, звук, LED-экраны для тысяч зрителей',
        photo: '/images/festival-crowd.png',
      },
      {
        iconKey: 'promo' as const,
        title: 'Промо-акции',
        desc: 'Рекламные стойки, LED-конструкции, брендированные экраны',
        photo: '/images/hero-led-event.png',
      },
      {
        iconKey: 'theater' as const,
        title: 'Театр и шоу',
        desc: 'Сценический свет, звуковые системы, LED-задники для спектаклей',
        photo: '/images/event-theater.png',
      },
      {
        iconKey: 'sports' as const,
        title: 'Спортивные события',
        desc: 'Видеотабло, трансляции, PA-системы для арен и стадионов',
        photo: '/images/event-sports.png',
      },
    ],
  },
  processSection: {
    badge: 'Процесс работы',
    title: 'Как мы',
    accentTitle: 'работаем',
    steps: [
      {
        num: '01',
        title: 'Заявка',
        desc: 'Опишите ваше мероприятие — дату, количество гостей, площадку и задачи',
      },
      {
        num: '02',
        title: 'Расчёт',
        desc: 'Подбираем оптимальное оборудование и составляем коммерческое предложение',
      },
      {
        num: '03',
        title: 'Монтаж',
        desc: 'Доставка, установка и настройка всего оборудования заранее до мероприятия',
      },
      {
        num: '04',
        title: 'Поддержка',
        desc: 'Техническое сопровождение во время события и демонтаж после',
      },
    ],
  },
  ctaSection: {
    title: 'Готовы обсудить',
    accentTitle: 'ваше мероприятие?',
    subtitle:
      'Расскажите о вашем проекте — мы рассчитаем стоимость и предложим лучшее техническое решение',
  },
  ctaForm: {
    errors: {
      name: 'Введите имя (минимум 2 символа)',
      contact: 'Укажите телефон или email',
      phone: 'Некорректный формат телефона',
      email: 'Некорректный формат email',
      submit: 'Ошибка отправки. Попробуйте позже или позвоните нам.',
    },
    success: {
      title: 'Заявка отправлена!',
      subtitle: 'Мы свяжемся с вами в ближайшее время',
      reset: 'Отправить ещё',
    },
    placeholders: {
      name: 'Ваше имя',
      phone: 'Телефон',
      email: 'Email',
    },
    submit: {
      loading: 'Отправка...',
      idle: 'Обсудить',
    },
  },
};

const en: typeof ru = {
  seo: {
    title: 'Future Screen — Event Technical Production | LED, Sound, Lighting',
    description:
      'LED screen, sound, and lighting rental in Yekaterinburg. Technical production for concerts, corporate events, and conferences since 2007.',
    keywords:
      'led screen rental, event technical production, sound rental, lighting rental, stage structures, yekaterinburg',
  },
  hero: {
    badge: 'Working across Russia since 2007',
    titleLines: ['Screen,', 'sound and lighting', 'rental'],
    subtitle:
      'Technical production for corporate events, concerts, conferences, and exhibitions of any scale',
    primaryCta: 'Estimate event',
    secondaryCta: 'View cases',
    stats: [
      { value: '18+', label: 'years of experience' },
      { value: '500+', label: 'events/year' },
      { value: '300+', label: 'equipment units' },
      { value: '24/7', label: 'support' },
    ],
  },
  works: {
    badge: 'Our work',
    title: 'Events',
    accentTitle: 'we produced',
    allCasesLink: 'All cases →',
    prevLabel: 'Previous',
    nextLabel: 'Next',
    items: [
      { src: '/images/work-corporate-gala.png', tag: 'Corporate', title: 'Production company gala dinner' },
      { src: '/images/work-festival.png', tag: 'Open-air festival', title: 'Summer music festival' },
      { src: '/images/work-conference.png', tag: 'Conference', title: 'Business forum for 2000 attendees' },
      { src: '/images/work-concert.png', tag: 'Concert', title: 'Rock show with 200 m² LED wall' },
      { src: '/images/work-wedding.png', tag: 'Wedding', title: 'Ceremony in a premium banquet hall' },
      { src: '/images/work-product-launch.png', tag: 'Launch', title: 'Flagship product launch event' },
      { src: '/images/work-exhibition.png', tag: 'Exhibition', title: 'Booth at an international forum' },
      { src: '/images/work-newyear.png', tag: 'New Year', title: 'Corporate New Year celebration' },
      { src: '/images/work-awards.png', tag: 'Awards', title: 'Award ceremony production' },
      { src: '/images/work-sports.png', tag: 'Sports', title: 'Championship final production' },
    ],
  },
  equipmentSection: {
    badge: 'Equipment fleet',
    title: 'Equipment',
    accentTitle: 'for rent',
    subtitle:
      'A full range of professional equipment for events of any scale',
    items: [
      {
        iconKey: 'led' as const,
        title: 'LED screens',
        desc: 'Indoor and outdoor LED screens with different sizes and resolutions from 2.6 mm pixel pitch',
        bullets: ['Screens from 3×2 m to 10×6 m', 'Modular assembly system', 'Truss structures up to 7 m'],
        gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
        link: '/rent/video',
        photo: '/images/led-closeup.png',
      },
      {
        iconKey: 'panel' as const,
        title: 'Display panels',
        desc: 'LED and OLED panels from 32" to 100" for presentations and exhibitions',
        bullets: ['32"—100" diagonals', '4K Ultra HD resolution', '300+ panels in stock'],
        gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        link: '/rent/video',
        photo: '/images/equip-plasma.png',
      },
      {
        iconKey: 'sound' as const,
        title: 'Audio equipment',
        desc: 'Professional PA systems, microphones, and mixers for concerts and conferences',
        bullets: ['Active PA systems', 'Shure/Sennheiser wireless mics', 'Mixing consoles'],
        gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
        link: '/rent/sound',
        photo: '/images/equip-sound.png',
      },
      {
        iconKey: 'light' as const,
        title: 'Lighting equipment',
        desc: 'Spotlights, PAR, LED panels, moving heads for stage lighting',
        bullets: ['LED PAR and spotlights', 'Moving light fixtures', 'DMX controllers'],
        gradient: 'linear-gradient(135deg, #ffd89b, #19547b)',
        link: '/rent/light',
        photo: '/images/equip-light.png',
      },
      {
        iconKey: 'stage' as const,
        title: 'Stage structures',
        desc: 'Modular stages, truss, podiums, and supports for complex venues',
        bullets: ['Modular stage platforms', 'Aluminum truss', 'Suspension for light and screens'],
        gradient: 'linear-gradient(135deg, #11998e, #38ef7d)',
        link: '/rent/stage',
        photo: '/images/equip-stage.png',
      },
    ],
    extraItems: [
      {
        iconKey: 'computer' as const,
        title: 'Computers and laptops',
        desc: 'Core i7/i5, gaming and office configurations',
        link: '/rent/computers',
        photo: '/images/equip-computers.png',
      },
      {
        iconKey: 'touch' as const,
        title: 'Touchscreens',
        desc: '42"–55" interactive displays with 10-point touch',
        link: '/rent/touchscreens',
        photo: '/images/equip-touch.png',
      },
      {
        iconKey: 'staff' as const,
        title: 'Technical crew',
        desc: 'Video operators, sound engineers, and technicians',
        link: '/rent/staff',
        photo: '/images/equip-staff.png',
      },
    ],
  },
  eventTypesSection: {
    badge: 'Our directions',
    title: 'Event',
    accentTitle: 'types',
    prevLabel: 'Previous',
    nextLabel: 'Next',
    items: [
      { iconKey: 'corporate' as const, title: 'Corporate events', desc: 'Technical setup for corporate events and team activities', photo: '/images/gala-event.png' },
      { iconKey: 'concert' as const, title: 'Concerts', desc: 'Full technical rider support for concert venues and festivals', photo: '/images/hero-concert.png' },
      { iconKey: 'conference' as const, title: 'Conferences', desc: 'Interpretation systems, projectors, and microphones', photo: '/images/event-conference.png' },
      { iconKey: 'wedding' as const, title: 'Weddings', desc: 'LED screens, lighting, and sound for banquet venues', photo: '/images/event-wedding.png' },
      { iconKey: 'exhibition' as const, title: 'Exhibitions', desc: 'LED solutions and interactive panels for booths', photo: '/images/event-exhibition.png' },
      { iconKey: 'presentation' as const, title: 'Presentations', desc: 'Premium setup for product presentations', photo: '/images/event-presentation.png' },
      { iconKey: 'festival' as const, title: 'Festivals', desc: 'Open-air stages, sound, and LED for large audiences', photo: '/images/festival-crowd.png' },
      { iconKey: 'promo' as const, title: 'Promo campaigns', desc: 'Branded LED constructions and promo setups', photo: '/images/hero-led-event.png' },
      { iconKey: 'theater' as const, title: 'Theatre and show', desc: 'Stage lighting, sound, and LED backdrops', photo: '/images/event-theater.png' },
      { iconKey: 'sports' as const, title: 'Sports events', desc: 'Scoreboards, broadcast support, and PA systems', photo: '/images/event-sports.png' },
    ],
  },
  processSection: {
    badge: 'Workflow',
    title: 'How we',
    accentTitle: 'work',
    steps: [
      {
        num: '01',
        title: 'Request',
        desc: 'Tell us your event date, guest count, venue, and goals',
      },
      {
        num: '02',
        title: 'Estimate',
        desc: 'We choose optimal equipment and prepare a commercial proposal',
      },
      {
        num: '03',
        title: 'Setup',
        desc: 'Delivery, installation, and full system preparation before the event',
      },
      {
        num: '04',
        title: 'Support',
        desc: 'On-site technical support during the event and teardown after',
      },
    ],
  },
  ctaSection: {
    title: 'Ready to discuss',
    accentTitle: 'your event?',
    subtitle:
      'Share your project details and we will estimate costs and offer the best technical setup',
  },
  ctaForm: {
    errors: {
      name: 'Enter your name (at least 2 characters)',
      contact: 'Enter phone or email',
      phone: 'Invalid phone format',
      email: 'Invalid email format',
      submit: 'Submission failed. Please try again later or call us.',
    },
    success: {
      title: 'Request submitted!',
      subtitle: 'We will contact you shortly',
      reset: 'Send another request',
    },
    placeholders: {
      name: 'Your name',
      phone: 'Phone',
      email: 'Email',
    },
    submit: {
      loading: 'Sending...',
      idle: 'Discuss',
    },
  },
};

const homePageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getHomePageContent = (locale: Locale) => homePageContentByLocale[locale];

export const homePageContent = ru;
