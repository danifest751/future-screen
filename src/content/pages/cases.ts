import type { Locale } from '../../i18n/types';

const ru = {
  seo: {
    title: 'Кейсы — реализованные проекты | Фьючер Скрин',
    description:
      'Портфолио реализованных проектов: форумы, концерты, выставки. Цифры, состав работ и фото.',
  },
  section: {
    title: 'Кейсы',
    subtitle: 'Реализованные проекты с цифрами и составом работ',
  },
  videoOverlay: {
    watch: 'Смотреть видео',
    many: (count: number) => `${count} видео`,
  },
  emptyState: 'Кейсы пока не добавлены',
  details: {
    titleSuffix: '— кейс | Фьючер Скрин',
    servicesLabel: 'Услуги:',
    videosLabel: 'Видео',
    contactPrompt: 'Нужны детали?',
    contactLink: 'Свяжитесь с нами',
    requestTitle: 'Запросить похожий проект',
    requestSubtitle: 'Опишите формат и сроки — предложим конфигурацию',
    requestCta: 'Обсудить',
  },
} as const;

const en: typeof ru = ru;

const casesPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getCasesPageContent = (locale: Locale) => casesPageContentByLocale[locale];

export const casesPageContent = ru;
