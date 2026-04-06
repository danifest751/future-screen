import type { Locale } from '../../i18n/types';

const ru = {
  validation: {
    idPositive: 'ID должен быть числом',
    titleRequired: 'Название обязательно',
    shortDescriptionRequired: 'Добавьте краткое описание',
    bulletsRequired: 'Добавьте преимущества',
    pagePathRequired: 'Путь обязателен',
    pagePathPrefix: 'Путь должен начинаться с /',
  },
  toast: {
    saveError: 'Ошибка сохранения категории',
    created: 'Категория добавлена',
    updated: 'Категория обновлена',
    deleted: 'Категория удалена',
    deleteError: 'Ошибка удаления категории',
    resetSuccess: 'Категории сброшены к дефолту',
  },
  layout: {
    title: 'Категории',
    subtitle: 'Управление категориями аренды',
  },
  deleteModal: {
    title: 'Удалить категорию?',
    confirmText: 'Удалить',
    cancelText: 'Отмена',
    description: (title: string) => `Категория "${title}" будет удалена без возможности восстановления.`,
  },
  resetModal: {
    title: 'Сбросить категории к дефолту?',
    description: 'Текущий список категорий будет перезаписан демо-данными.',
    confirmText: 'Сбросить',
    cancelText: 'Отмена',
  },
  form: {
    editTitle: 'Редактирование категории',
    createTitle: 'Новая категория',
    editDescription: (id: number) =>
      `Вы редактируете категорию ${String(id)}. Сохраните изменения или нажмите «Отмена».`,
    createDescription: 'Создайте новую категорию или выберите существующую справа для редактирования.',
    restoredDraft: 'Восстановлен черновик формы, можно продолжить с того же места.',
    editMode: 'Режим редактирования',
    unsavedChanges: 'Есть несохраненные изменения',
    cancel: 'Отмена',
    idLabel: 'ID',
    titleLabel: 'Название',
    shortDescriptionLabel: 'Краткое описание',
    bulletsLabel: 'Буллеты',
    bulletsHint: 'Каждый пункт с новой строки',
    pagePathLabel: 'Путь страницы',
    save: 'Сохранить',
    add: 'Добавить',
  },
  list: {
    title: 'Список категорий',
    shown: (filteredCount: number, totalCount: number) => `Показано ${filteredCount} из ${totalCount}`,
    resetToDefault: 'Сброс к дефолту',
    searchPlaceholder: 'Поиск по названию, пути, описанию...',
    clear: 'Очистить',
    pagePathPrefix: 'Путь:',
    edit: 'Редактировать',
    remove: 'Удалить',
    emptyTitle: 'Категорий пока нет',
    notFoundTitle: 'Ничего не найдено',
    emptyDescription: 'Создайте первую категорию аренды через форму слева.',
    notFoundDescription: 'Попробуйте изменить поисковый запрос или очистить фильтр.',
  },
};

const en: typeof ru = {
  validation: {
    idPositive: 'ID must be a number',
    titleRequired: 'Title is required',
    shortDescriptionRequired: 'Add short description',
    bulletsRequired: 'Add benefits',
    pagePathRequired: 'Path is required',
    pagePathPrefix: 'Path must start with /',
  },
  toast: {
    saveError: 'Failed to save category',
    created: 'Category created',
    updated: 'Category updated',
    deleted: 'Category deleted',
    deleteError: 'Failed to delete category',
    resetSuccess: 'Categories reset to defaults',
  },
  layout: {
    title: 'Categories',
    subtitle: 'Manage rental categories',
  },
  deleteModal: {
    title: 'Delete category?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    description: (title: string) => `Category "${title}" will be deleted permanently.`,
  },
  resetModal: {
    title: 'Reset categories to defaults?',
    description: 'Current category list will be overwritten with demo data.',
    confirmText: 'Reset',
    cancelText: 'Cancel',
  },
  form: {
    editTitle: 'Edit category',
    createTitle: 'New category',
    editDescription: (id: number) =>
      `You are editing category ${String(id)}. Save changes or press "Cancel".`,
    createDescription: 'Create a new category or select an existing one on the right to edit.',
    restoredDraft: 'Form draft restored, you can continue where you left off.',
    editMode: 'Edit mode',
    unsavedChanges: 'You have unsaved changes',
    cancel: 'Cancel',
    idLabel: 'ID',
    titleLabel: 'Title',
    shortDescriptionLabel: 'Short description',
    bulletsLabel: 'Bullets',
    bulletsHint: 'One item per line',
    pagePathLabel: 'Page path',
    save: 'Save',
    add: 'Add',
  },
  list: {
    title: 'Categories list',
    shown: (filteredCount: number, totalCount: number) => `Shown ${filteredCount} of ${totalCount}`,
    resetToDefault: 'Reset to defaults',
    searchPlaceholder: 'Search by title, path, description...',
    clear: 'Clear',
    pagePathPrefix: 'Path:',
    edit: 'Edit',
    remove: 'Delete',
    emptyTitle: 'No categories yet',
    notFoundTitle: 'Nothing found',
    emptyDescription: 'Create your first rental category using the form on the left.',
    notFoundDescription: 'Try changing the search query or clear the filter.',
  },
};

const adminCategoriesPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminCategoriesPageContent = (locale: Locale) => adminCategoriesPageContentByLocale[locale];

export const adminCategoriesPageContent = ru;
