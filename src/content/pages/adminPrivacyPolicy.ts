import type { Locale } from '../../i18n/types';

const ru = {
  layout: {
    title: 'Политика конфиденциальности',
    loadingSubtitle: 'Загрузка...',
    lastSaved: (value: string) => `Последнее сохранение: ${value}`,
  },
  validation: {
    titleRequired: 'Заголовок обязателен',
    contentRequired: 'Контент обязателен',
  },
  toasts: {
    saveSuccess: 'Политика конфиденциальности сохранена',
    saveError: 'Ошибка сохранения',
  },
  editor: {
    title: 'Редактирование',
    restoredDraft: 'Восстановлен черновик',
    unsavedChanges: 'Есть несохраненные изменения',
    pageTitleLabel: 'Заголовок страницы (H1)',
    pageTitlePlaceholder: 'Политика конфиденциальности',
    contentLabel: 'Контент (Markdown)',
    contentPlaceholder: '# Заголовок\n\nВаш контент здесь...',
    seoTitle: 'SEO настройки',
    metaTitleLabel: 'Meta Title',
    metaTitleHint: 'До 60 символов',
    metaTitlePlaceholder: 'Политика конфиденциальности — Фьючер Скрин',
    metaDescriptionLabel: 'Meta Description',
    metaDescriptionHint: 'До 160 символов',
    metaDescriptionPlaceholder: 'Описание страницы для поисковых систем...',
    fontSizeTitle: 'Размер шрифта',
    fontSizeScale: ['Мелкий', 'Обычный', 'Крупный', 'Очень крупный'],
    current: 'Текущий:',
    defaultNote: 'по умолчанию',
    save: 'Сохранить',
  },
  preview: {
    title: 'Предпросмотр',
    openOnSite: 'Открыть на сайте →',
    emptyTitle: 'Контент не загружен',
    emptyDescription: 'Заполните форму слева и сохраните.',
  },
};

const en: typeof ru = {
  layout: {
    title: 'Privacy Policy',
    loadingSubtitle: 'Loading...',
    lastSaved: (value: string) => `Last saved: ${value}`,
  },
  validation: {
    titleRequired: 'Title is required',
    contentRequired: 'Content is required',
  },
  toasts: {
    saveSuccess: 'Privacy policy saved',
    saveError: 'Save error',
  },
  editor: {
    title: 'Editor',
    restoredDraft: 'Draft restored',
    unsavedChanges: 'You have unsaved changes',
    pageTitleLabel: 'Page title (H1)',
    pageTitlePlaceholder: 'Privacy Policy',
    contentLabel: 'Content (Markdown)',
    contentPlaceholder: '# Heading\n\nYour content here...',
    seoTitle: 'SEO settings',
    metaTitleLabel: 'Meta Title',
    metaTitleHint: 'Up to 60 characters',
    metaTitlePlaceholder: 'Privacy Policy — Future Screen',
    metaDescriptionLabel: 'Meta Description',
    metaDescriptionHint: 'Up to 160 characters',
    metaDescriptionPlaceholder: 'Page description for search engines...',
    fontSizeTitle: 'Font size',
    fontSizeScale: ['Small', 'Normal', 'Large', 'Extra large'],
    current: 'Current:',
    defaultNote: 'default',
    save: 'Save',
  },
  preview: {
    title: 'Preview',
    openOnSite: 'Open on site →',
    emptyTitle: 'Content not loaded',
    emptyDescription: 'Fill in the form on the left and save.',
  },
};

const adminPrivacyPolicyContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminPrivacyPolicyContent = (locale: Locale) => adminPrivacyPolicyContentByLocale[locale];

export const adminPrivacyPolicyContent = ru;
