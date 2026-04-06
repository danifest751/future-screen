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
};

const en: typeof ru = {
  seo: {
    title: 'Event Equipment Rental | Future Screen',
    description:
      'Rental of lighting, audio, video equipment, stage structures, and instruments for events.',
  },
  hero: {
    title: 'Equipment Rental',
    subtitle: 'Lighting, sound, video, stages, instruments',
    loading: 'Loading...',
    error: 'Failed to load categories',
  },
  checklist: {
    title: 'What to consider',
    items: [
      'Format and venue: indoor/outdoor, ceiling height, rigging points',
      'Scenario: performances, presentations, broadcast, microphone count',
      'Timeline and logistics: installation/dismantling windows, access',
      'Backup: power source, processing, spare channels',
    ],
  },
  form: {
    title: 'Request rental',
    subtitle: 'Describe event format and venue, and we will prepare a setup',
    ctaText: 'Get selection',
  },
};

const rentPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getRentPageContent = (locale: Locale) => rentPageContentByLocale[locale];

export const rentPageContent = ru;
