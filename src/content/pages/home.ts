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

export const homePageContent = {
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
} as const;
