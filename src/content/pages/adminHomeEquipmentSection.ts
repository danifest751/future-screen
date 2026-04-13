import type { Locale } from '../../i18n/types';

const ru = {
  layout: {
    title: 'Главная: секция оборудования',
    loadingSubtitle: 'Загрузка...',
    lastSaved: (value: string) => `Последнее сохранение: ${value}`,
  },
  editor: {
    title: 'Редактирование секции',
    badgeLabel: 'Бейдж',
    titleLabel: 'Заголовок',
    accentTitleLabel: 'Акцент заголовка',
    subtitleLabel: 'Подзаголовок',
    mainCardsTitle: 'Основные карточки',
    extraCardsTitle: 'Дополнительные карточки',
    cardLabel: (index: number) => `Карточка ${index}`,
    cardTitleLabel: 'Название',
    cardDescLabel: 'Описание',
    cardBulletsLabel: 'Пункты списка',
    cardBulletsHint: 'Один пункт в строке',
    save: 'Сохранить',
    unsavedChanges: 'Есть несохраненные изменения',
  },
  validation: {
    required: 'Поле обязательно',
  },
  toasts: {
    saveSuccess: 'Секция оборудования сохранена',
    saveError: 'Ошибка сохранения',
  },
  preview: {
    title: 'Предпросмотр',
    sourceLabel: 'Источник данных',
    sourceStatic: 'Источник: статический контент главной',
  },
};

const en: typeof ru = {
  layout: {
    title: 'Home: equipment section',
    loadingSubtitle: 'Loading...',
    lastSaved: (value: string) => `Last saved: ${value}`,
  },
  editor: {
    title: 'Section editor',
    badgeLabel: 'Badge',
    titleLabel: 'Title',
    accentTitleLabel: 'Accent title',
    subtitleLabel: 'Subtitle',
    mainCardsTitle: 'Main cards',
    extraCardsTitle: 'Extra cards',
    cardLabel: (index: number) => `Card ${index}`,
    cardTitleLabel: 'Title',
    cardDescLabel: 'Description',
    cardBulletsLabel: 'Bullet points',
    cardBulletsHint: 'One bullet point per line',
    save: 'Save',
    unsavedChanges: 'You have unsaved changes',
  },
  validation: {
    required: 'Field is required',
  },
  toasts: {
    saveSuccess: 'Equipment section saved',
    saveError: 'Save error',
  },
  preview: {
    title: 'Preview',
    sourceLabel: 'Data source',
    sourceStatic: 'Source: static homepage content',
  },
};

const adminHomeEquipmentSectionContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminHomeEquipmentSectionContent = (locale: Locale) =>
  adminHomeEquipmentSectionContentByLocale[locale];

export const adminHomeEquipmentSectionContent = ru;
