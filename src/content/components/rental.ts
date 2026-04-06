import type { Locale } from '../../i18n/types';

const ru = {
  benefitsTitle: 'Преимущества',
  ctaFallbackTitle: 'Нужна помощь?',
  ctaFormButton: 'Отправить',
  faqTitle: 'Частые вопросы',
  galleryEmptyLabel: 'Изображение',
  galleryTitle: 'Галерея',
  serviceIncludesTitle: 'Что входит в услугу',
  useCasesTitle: 'Сценарии использования',
  benefitKeywordGroups: {
    speed: ['быстр', 'скор', 'гибк'],
    reliability: ['надёжн', 'надежн', 'безопасн', 'гарант'],
    experience: ['опыт', 'лет', 'професс'],
    support: ['поддержк', 'сопровожд', 'сервис'],
    setup: ['настройк', 'монтаж', 'установк'],
    timing: ['срок', 'время', 'пунктуальн'],
  },
};

const en: typeof ru = {
  benefitsTitle: 'Benefits',
  ctaFallbackTitle: 'Need help?',
  ctaFormButton: 'Send',
  faqTitle: 'FAQ',
  galleryEmptyLabel: 'Image',
  galleryTitle: 'Gallery',
  serviceIncludesTitle: 'What is included',
  useCasesTitle: 'Use cases',
  benefitKeywordGroups: {
    speed: ['fast', 'speed', 'quick', 'agile'],
    reliability: ['reliab', 'safe', 'stabl', 'guarantee'],
    experience: ['experien', 'years', 'pro'],
    support: ['support', 'service', 'assist'],
    setup: ['setup', 'install', 'mount', 'config'],
    timing: ['timing', 'time', 'deadline', 'punctual'],
  },
};

const rentalComponentContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getRentalComponentContent = (locale: Locale) => rentalComponentContentByLocale[locale];

export const rentalComponentContent = ru;
