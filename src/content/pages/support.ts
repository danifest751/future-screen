import type { Locale } from '../../i18n/types';

const ru = {
  seo: {
    title: 'Техсопровождение мероприятий | Фьючер Скрин',
    description:
      'Пакеты техсопровождения мероприятий: LED, звук, свет, сцены. Лайт, Медиум, Биг — под любой формат.',
  },
  hero: {
    title: 'Техсопровождение под ключ',
    subtitle: 'Лайт · Медиум · Биг — под формат мероприятия',
  },
  loading: 'Загрузка...',
  universalBadge: 'Универсальный',
  optionsPrefix: 'Опции:',
  formatsPrefix: 'Для:',
  discussPackage: 'Обсудить пакет',
  process: {
    title: 'Процесс',
    subtitle: 'Прозрачно и с резервом',
    stepPrefix: 'Шаг',
    items: [
      'Бриф: что, где, когда, формат мероприятия',
      'Расчёт и КП за 15 минут, схемы площадки',
      'Подбор оборудования, резерв по запросу',
      'Логистика, монтаж, программирование',
      'Сопровождение инженерами, оперативные правки',
      'Демонтаж и отчёт',
    ],
  },
  advantages: {
    title: 'Почему мы',
    items: [
      'С 2007 года, проекты по всей РФ',
      'Инженеры и монтажные бригады в штате',
      'Резерв оборудования и процессинга по запросу',
      'Отвечаем за результат и сроки',
    ],
  },
  form: {
    title: 'Получить предложение',
    subtitle: 'Опишите формат — подберём пакет и состав',
    ctaText: 'Запросить КП',
  },
};

const en: typeof ru = {
  seo: {
    title: 'Event Technical Production | Future Screen',
    description:
      'Technical production packages for events: LED, sound, lighting, and stage. Lite, Medium, Big for any format.',
  },
  hero: {
    title: 'Turnkey Technical Production',
    subtitle: 'Lite · Medium · Big — adjusted to your event format',
  },
  loading: 'Loading...',
  universalBadge: 'Universal',
  optionsPrefix: 'Options:',
  formatsPrefix: 'For:',
  discussPackage: 'Discuss package',
  process: {
    title: 'Process',
    subtitle: 'Transparent and with backup',
    stepPrefix: 'Step',
    items: [
      'Brief: what, where, when, and event format',
      'Estimate and proposal in 15 minutes, venue scheme',
      'Equipment selection, backup on request',
      'Logistics, setup, and programming',
      'On-site engineering support and quick adjustments',
      'Dismantling and reporting',
    ],
  },
  advantages: {
    title: 'Why us',
    items: [
      'Since 2007, projects across Russia',
      'In-house engineers and installation teams',
      'Equipment and processing backup on request',
      'Clear ownership of results and deadlines',
    ],
  },
  form: {
    title: 'Get a proposal',
    subtitle: 'Describe the event format, and we will suggest package and scope',
    ctaText: 'Request quote',
  },
};

const supportPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getSupportPageContent = (locale: Locale) => supportPageContentByLocale[locale];

export const supportPageContent = ru;
