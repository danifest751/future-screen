import type { Locale } from '../../i18n/types';

const ru = {
  layout: {
    title: 'Главная: секция оборудования',
    loadingSubtitle: 'Загрузка...',
    lastSaved: (value: string) => `Последнее сохранение: ${value}`,
  },
  editor: {
    title: 'Редактирование шапки секции',
    badgeLabel: 'Бейдж',
    titleLabel: 'Заголовок',
    accentTitleLabel: 'Акцент заголовка',
    subtitleLabel: 'Подзаголовок',
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
  },
};

const en: typeof ru = {
  layout: {
    title: 'Home: equipment section',
    loadingSubtitle: 'Loading...',
    lastSaved: (value: string) => `Last saved: ${value}`,
  },
  editor: {
    title: 'Section header editor',
    badgeLabel: 'Badge',
    titleLabel: 'Title',
    accentTitleLabel: 'Accent title',
    subtitleLabel: 'Subtitle',
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
  },
};

const adminHomeEquipmentSectionContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminHomeEquipmentSectionContent = (locale: Locale) =>
  adminHomeEquipmentSectionContentByLocale[locale];

export const adminHomeEquipmentSectionContent = ru;
