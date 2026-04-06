import type { Locale } from '../../i18n/types';

const ru = {
  validation: {
    phonesRequired: 'Введите хотя бы один телефон',
    emailsRequired: 'Введите хотя бы один email',
    addressRequired: 'Адрес обязателен',
    workingHoursRequired: 'Укажите рабочее время',
  },
  toast: {
    saveSuccess: 'Контакты сохранены',
    saveError: 'Ошибка сохранения контактов',
    resetSuccess: 'Контакты сброшены к дефолту',
  },
  layout: {
    title: 'Контакты',
    loadingSubtitle: 'Загрузка...',
    loadErrorSubtitle: 'Не удалось загрузить',
    subtitle: 'Телефоны, email, адрес и рабочие часы',
  },
  states: {
    notLoadedTitle: 'Контакты не загружены',
    notLoadedDescription: 'Попробуйте обновить страницу или обратитесь к администратору',
  },
  resetModal: {
    title: 'Сбросить контакты к дефолту?',
    description: 'Текущие контакты будут перезаписаны демо-значениями.',
    confirmText: 'Сбросить',
    cancelText: 'Отмена',
  },
  form: {
    title: 'Редактирование контактов',
    restoredDraft: 'Восстановлен черновик',
    unsavedChanges: 'Есть несохраненные изменения',
    resetToDefault: 'Сброс к дефолту',
    phonesLabel: 'Телефоны',
    phonesHint: 'Каждый телефон с новой строки',
    emailsLabel: 'Email',
    emailsHint: 'Каждый email с новой строки',
    addressLabel: 'Адрес',
    workingHoursLabel: 'Время работы',
    submit: 'Сохранить контакты',
  },
  current: {
    title: 'Текущие данные',
    emptyTitle: 'Контакты пока не заполнены',
    emptyDescription: 'Заполните форму слева и сохраните изменения.',
    phonesLabel: 'Телефоны',
    emailsLabel: 'Email',
    addressLabel: 'Адрес',
    workingHoursLabel: 'Время работы',
  },
};

const en: typeof ru = {
  validation: {
    phonesRequired: 'Enter at least one phone number',
    emailsRequired: 'Enter at least one email',
    addressRequired: 'Address is required',
    workingHoursRequired: 'Working hours are required',
  },
  toast: {
    saveSuccess: 'Contacts saved',
    saveError: 'Failed to save contacts',
    resetSuccess: 'Contacts reset to defaults',
  },
  layout: {
    title: 'Contacts',
    loadingSubtitle: 'Loading...',
    loadErrorSubtitle: 'Failed to load',
    subtitle: 'Phones, email, address, and working hours',
  },
  states: {
    notLoadedTitle: 'Contacts are not loaded',
    notLoadedDescription: 'Try refreshing the page or contact an administrator',
  },
  resetModal: {
    title: 'Reset contacts to defaults?',
    description: 'Current contacts will be overwritten with demo values.',
    confirmText: 'Reset',
    cancelText: 'Cancel',
  },
  form: {
    title: 'Edit contacts',
    restoredDraft: 'Draft restored',
    unsavedChanges: 'You have unsaved changes',
    resetToDefault: 'Reset to defaults',
    phonesLabel: 'Phones',
    phonesHint: 'One phone per line',
    emailsLabel: 'Email',
    emailsHint: 'One email per line',
    addressLabel: 'Address',
    workingHoursLabel: 'Working hours',
    submit: 'Save contacts',
  },
  current: {
    title: 'Current data',
    emptyTitle: 'Contacts are empty',
    emptyDescription: 'Fill in the form on the left and save your changes.',
    phonesLabel: 'Phones',
    emailsLabel: 'Email',
    addressLabel: 'Address',
    workingHoursLabel: 'Working hours',
  },
};

const adminContactsPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminContactsPageContent = (locale: Locale) => adminContactsPageContentByLocale[locale];

export const adminContactsPageContent = ru;
