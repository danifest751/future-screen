import type { Locale } from '../../i18n/types';

const ru = {
  seo: {
    title: 'Аренда оборудования для мероприятий | Фьючер Скрин',
    description:
      'Аренда светового, звукового, видеооборудования, сцен и инструментов для мероприятий.',
  },
  hero: {
    title: 'Аренда оборудования',
    subtitle: 'Свет, звук, видео, сцены, инструменты',
    loading: 'Загрузка...',
    error: 'Ошибка загрузки категорий',
  },
  checklist: {
    title: 'Что важно учесть',
    items: [
      'Формат и площадка: зал/улица, высота потолка, точки подвеса',
      'Сценарий: выступления, презентации, трансляция, количество микрофонов',
      'Сроки и логистика: окна на монтаж/демонтаж, доступы',
      'Резерв: источник питания, процессинг, запасные каналы',
    ],
  },
  form: {
    title: 'Запросить аренду',
    subtitle: 'Опишите формат и площадку, подберём комплект',
    ctaText: 'Получить подбор',
  },
} as const;

const en: typeof ru = ru;

const rentPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getRentPageContent = (locale: Locale) => rentPageContentByLocale[locale];

export const rentPageContent = ru;
