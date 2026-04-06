import type { Locale } from '../../i18n/types';

const ru = {
  validation: {
    idPositive: 'ID должен быть числом',
    nameRequired: 'Название обязательно',
    forFormatsRequired: 'Укажите хотя бы 1 формат',
    includesRequired: 'Укажите состав пакета',
  },
  toast: {
    saveError: 'Ошибка сохранения пакета',
    created: 'Пакет добавлен',
    updated: 'Пакет обновлён',
    deleted: 'Пакет удалён',
    deleteError: 'Ошибка удаления пакета',
    resetSuccess: 'Пакеты сброшены к дефолту',
  },
  layout: {
    title: 'Пакеты',
    subtitle: 'Управление пакетами и ценовыми предложениями',
  },
  deleteModal: {
    title: 'Удалить пакет?',
    confirmText: 'Удалить',
    cancelText: 'Отмена',
    description: (name: string) => `Пакет "${name}" будет удален без возможности восстановления.`,
  },
  resetModal: {
    title: 'Сбросить все пакеты к дефолту?',
    description: 'Текущие изменения будут перезаписаны демо-данными.',
    confirmText: 'Сбросить',
    cancelText: 'Отмена',
  },
  form: {
    editTitle: 'Редактирование пакета',
    createTitle: 'Новый пакет',
    editDescription: (id: number) =>
      `Вы редактируете пакет ${String(id)}. Сохраните изменения или нажмите «Отмена».`,
    createDescription: 'Создайте новый пакет или выберите существующий справа для редактирования.',
    restoredDraft: 'Восстановлен черновик формы, можно продолжить с того же места.',
    editMode: 'Режим редактирования',
    unsavedChanges: 'Есть несохраненные изменения',
    cancel: 'Отмена',
    idLabel: 'ID',
    nameLabel: 'Название',
    forFormatsLabel: 'Для форматов',
    forFormatsHint: 'Через запятую или новую строку',
    includesLabel: 'Состав',
    includesHint: 'Каждый пункт с новой строки',
    optionsLabel: 'Опции',
    optionsHint: 'Необязательно',
    priceHintLabel: 'Подсказка цены',
    save: 'Сохранить',
    add: 'Добавить',
  },
  list: {
    title: 'Список пакетов',
    shown: (filteredCount: number, totalCount: number) => `Показано ${filteredCount} из ${totalCount}`,
    resetToDefault: 'Сброс к дефолту',
    searchPlaceholder: 'Поиск по названию, ID, составу, опциям...',
    clear: 'Очистить',
    forFormatsPrefix: 'Для:',
    includesPrefix: 'Состав:',
    edit: 'Редактировать',
    remove: 'Удалить',
    emptyTitle: 'Пакетов пока нет',
    notFoundTitle: 'Ничего не найдено',
    emptyDescription: 'Добавьте первый пакет через форму слева.',
    notFoundDescription: 'Попробуйте изменить поисковый запрос или очистить фильтр.',
  },
};

const en: typeof ru = {
  validation: {
    idPositive: 'ID must be a number',
    nameRequired: 'Name is required',
    forFormatsRequired: 'Specify at least 1 format',
    includesRequired: 'Specify package composition',
  },
  toast: {
    saveError: 'Failed to save package',
    created: 'Package created',
    updated: 'Package updated',
    deleted: 'Package deleted',
    deleteError: 'Failed to delete package',
    resetSuccess: 'Packages reset to defaults',
  },
  layout: {
    title: 'Packages',
    subtitle: 'Manage packages and pricing offers',
  },
  deleteModal: {
    title: 'Delete package?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    description: (name: string) => `Package "${name}" will be deleted permanently.`,
  },
  resetModal: {
    title: 'Reset all packages to defaults?',
    description: 'Current changes will be overwritten with demo data.',
    confirmText: 'Reset',
    cancelText: 'Cancel',
  },
  form: {
    editTitle: 'Edit package',
    createTitle: 'New package',
    editDescription: (id: number) =>
      `You are editing package ${String(id)}. Save changes or press "Cancel".`,
    createDescription: 'Create a new package or select an existing one on the right to edit.',
    restoredDraft: 'Form draft restored, you can continue where you left off.',
    editMode: 'Edit mode',
    unsavedChanges: 'You have unsaved changes',
    cancel: 'Cancel',
    idLabel: 'ID',
    nameLabel: 'Name',
    forFormatsLabel: 'For formats',
    forFormatsHint: 'Comma or new line separated',
    includesLabel: 'Includes',
    includesHint: 'One item per line',
    optionsLabel: 'Options',
    optionsHint: 'Optional',
    priceHintLabel: 'Price hint',
    save: 'Save',
    add: 'Add',
  },
  list: {
    title: 'Packages list',
    shown: (filteredCount: number, totalCount: number) => `Shown ${filteredCount} of ${totalCount}`,
    resetToDefault: 'Reset to defaults',
    searchPlaceholder: 'Search by name, ID, includes, options...',
    clear: 'Clear',
    forFormatsPrefix: 'For:',
    includesPrefix: 'Includes:',
    edit: 'Edit',
    remove: 'Delete',
    emptyTitle: 'No packages yet',
    notFoundTitle: 'Nothing found',
    emptyDescription: 'Add your first package using the form on the left.',
    notFoundDescription: 'Try changing the search query or clear the filter.',
  },
};

const adminPackagesPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminPackagesPageContent = (locale: Locale) => adminPackagesPageContentByLocale[locale];

export const adminPackagesPageContent = ru;
