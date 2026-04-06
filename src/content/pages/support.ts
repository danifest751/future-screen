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
} as const;

const en: typeof ru = ru;

const supportPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getSupportPageContent = (locale: Locale) => supportPageContentByLocale[locale];

export const supportPageContent = ru;
