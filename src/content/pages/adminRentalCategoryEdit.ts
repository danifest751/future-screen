import type { Locale } from '../../i18n/types';

const ru = {
  validation: {
    nameRequired: 'Название обязательно',
    shortNameRequired: 'Краткое название обязательно',
    slugRequired: 'Slug обязателен',
    slugFormat: 'Slug: только латиница, цифры и дефис',
  },
  toasts: {
    notFound: 'Категория не найдена',
    loadError: 'Ошибка загрузки категории',
    createSuccess: 'Категория создана',
    updateSuccess: 'Категория обновлена',
    saveError: 'Ошибка сохранения',
  },
  loading: {
    title: 'Загрузка...',
    description: 'Загрузка данных категории...',
  },
  layout: {
    createTitle: 'Новая категория аренды',
    editTitle: (name: string) => `Редактирование: ${name}`,
    createSubtitle: 'Создание нового раздела оборудования в аренду',
    editSubtitle: 'Изменение контента категории',
    unknownName: '...',
  },
  topBar: {
    back: 'Назад',
    unsaved: 'Есть несохраненные изменения',
    published: 'Опубликовано',
    saving: 'Сохраняем...',
    create: 'Создать',
    save: 'Сохранить',
  },
  sections: {
    basics: {
      title: 'Основные',
      name: 'Название',
      namePlaceholder: 'Световое оборудование',
      shortName: 'Краткое название',
      shortNameHint: 'Для карточек на /rent',
      shortNamePlaceholder: 'Свет',
      slug: 'Slug',
      slugHint: 'URL: /rent/{slug}. Только латиница, цифры и дефис',
      slugPlaceholder: 'light',
      sortOrder: 'Порядок сортировки',
    },
    seo: {
      title: 'SEO',
      metaTitle: 'Meta Title',
      metaTitleHint: 'До 60 символов',
      metaTitlePlaceholder: 'Аренда светового оборудования — Фьючер Скрин',
      metaDescription: 'Meta Description',
      metaDescriptionHint: 'До 160 символов',
      metaDescriptionPlaceholder: 'Профессиональная аренда...',
    },
    hero: {
      title: 'Hero-блок',
      h1: 'Заголовок H1',
      h1Placeholder: 'Аренда светового оборудования',
      subtitle: 'Подзаголовок',
      ctaPrimary: 'Основной CTA',
      ctaPrimaryPlaceholder: 'Запросить КП',
      ctaSecondary: 'Вторичный CTA',
      ctaSecondaryPlaceholder: 'Подробнее',
      highlights: 'Highlights',
      highlightsHint: 'Каждый пункт с новой строки',
      highlightsPlaceholder: 'Быстрая доставка\nНастройка на площадке\nТехподдержка 24/7',
    },
    about: {
      title: 'Описание (About)',
      sectionTitle: 'Заголовок секции',
      sectionTitlePlaceholder: 'О категории',
      text: 'Текст',
      items: 'Пункты',
      itemsHint: 'Каждый пункт с новой строки',
    },
    useCases: {
      title: 'Сценарии использования (Use Cases)',
      sectionTitle: 'Заголовок секции',
      sectionTitlePlaceholder: 'Сценарии использования',
      rows: 'Сценарии',
      rowsHint: 'Формат: Заголовок | Описание (каждый с новой строки)',
      rowsPlaceholder:
        'Корпоратив | Полное освещение сцены и зала\n' +
        'Концерт | Профессиональный свет для живых выступлений\n' +
        'Выставка | Подсветка стендов и экспозиций',
    },
    serviceIncludes: {
      title: 'Состав услуги (Service Includes)',
      sectionTitle: 'Заголовок секции',
      sectionTitlePlaceholder: 'В услугу входит',
      items: 'Пункты',
      itemsHint: 'Каждый пункт с новой строки',
      itemsPlaceholder:
        'Доставка оборудования\n' +
        'Монтаж и настройка\n' +
        'Техническое сопровождение\n' +
        'Демонтаж и вывоз',
    },
    benefits: {
      title: 'Преимущества (Benefits)',
      sectionTitle: 'Заголовок секции',
      sectionTitlePlaceholder: 'Почему выбирают нас',
      rows: 'Преимущества',
      rowsHint: 'Формат: Заголовок | Описание (каждый с новой строки)',
      rowsPlaceholder:
        'Опыт 15+ лет | Работаем с 2007 года на рынке\n' +
        'Собственный парк | Не зависим от подрядчиков',
    },
    gallery: {
      title: 'Галерея',
      rows: 'Изображения',
      rowsHint: 'Формат: URL | Alt | Подпись (каждый с новой строки)',
      rowsPlaceholder:
        '/images/rental/light-1.jpg | Свет на сцене | Пример освещения\n' +
        '/images/rental/light-2.jpg | Подсветка зала | Архитектурный свет',
    },
    faq: {
      title: 'FAQ',
      sectionTitle: 'Заголовок секции',
      sectionTitlePlaceholder: 'Частые вопросы',
      rows: 'Вопросы и ответы',
      rowsHint: 'Формат: Вопрос | Ответ (каждый с новой строки)',
      rowsPlaceholder:
        'Какие сроки аренды? | Минимальный срок — 1 день. Доставка и монтаж включены.\n' +
        'Нужен ли оператор? | Да, мы предоставляем техника на площадке.',
    },
    bottomCta: {
      title: 'CTA внизу страницы',
      heading: 'Заголовок',
      headingPlaceholder: 'Готовы обсудить проект?',
      text: 'Текст',
      primary: 'Основной CTA',
      primaryPlaceholder: 'Запросить КП',
      secondary: 'Вторичный CTA',
      secondaryPlaceholder: 'Позвонить',
    },
  },
  footer: {
    cancel: 'Отмена',
    saving: 'Сохраняем...',
    create: 'Создать категорию',
    save: 'Сохранить изменения',
  },
};

const en: typeof ru = {
  validation: {
    nameRequired: 'Name is required',
    shortNameRequired: 'Short name is required',
    slugRequired: 'Slug is required',
    slugFormat: 'Slug: latin letters, numbers and hyphens only',
  },
  toasts: {
    notFound: 'Category not found',
    loadError: 'Failed to load category',
    createSuccess: 'Category created',
    updateSuccess: 'Category updated',
    saveError: 'Save error',
  },
  loading: {
    title: 'Loading...',
    description: 'Loading category data...',
  },
  layout: {
    createTitle: 'New rental category',
    editTitle: (name: string) => `Editing: ${name}`,
    createSubtitle: 'Create a new rental equipment section',
    editSubtitle: 'Edit category content',
    unknownName: '...',
  },
  topBar: {
    back: 'Back',
    unsaved: 'You have unsaved changes',
    published: 'Published',
    saving: 'Saving...',
    create: 'Create',
    save: 'Save',
  },
  sections: {
    basics: {
      title: 'Basics',
      name: 'Name',
      namePlaceholder: 'Lighting equipment',
      shortName: 'Short name',
      shortNameHint: 'Used for cards on /rent',
      shortNamePlaceholder: 'Lighting',
      slug: 'Slug',
      slugHint: 'URL: /rent/{slug}. Latin letters, numbers and hyphens only',
      slugPlaceholder: 'light',
      sortOrder: 'Sort order',
    },
    seo: {
      title: 'SEO',
      metaTitle: 'Meta Title',
      metaTitleHint: 'Up to 60 characters',
      metaTitlePlaceholder: 'Lighting equipment rental — Future Screen',
      metaDescription: 'Meta Description',
      metaDescriptionHint: 'Up to 160 characters',
      metaDescriptionPlaceholder: 'Professional rental...',
    },
    hero: {
      title: 'Hero block',
      h1: 'H1 title',
      h1Placeholder: 'Lighting equipment rental',
      subtitle: 'Subtitle',
      ctaPrimary: 'Primary CTA',
      ctaPrimaryPlaceholder: 'Request quote',
      ctaSecondary: 'Secondary CTA',
      ctaSecondaryPlaceholder: 'Learn more',
      highlights: 'Highlights',
      highlightsHint: 'One item per line',
      highlightsPlaceholder: 'Fast delivery\nOn-site setup\n24/7 support',
    },
    about: {
      title: 'About section',
      sectionTitle: 'Section title',
      sectionTitlePlaceholder: 'About category',
      text: 'Text',
      items: 'Items',
      itemsHint: 'One item per line',
    },
    useCases: {
      title: 'Use Cases',
      sectionTitle: 'Section title',
      sectionTitlePlaceholder: 'Use cases',
      rows: 'Use cases',
      rowsHint: 'Format: Title | Description (one per line)',
      rowsPlaceholder:
        'Corporate event | Full stage and hall lighting\n' +
        'Concert | Professional show lighting\n' +
        'Exhibition | Booth and exhibit illumination',
    },
    serviceIncludes: {
      title: 'Service Includes',
      sectionTitle: 'Section title',
      sectionTitlePlaceholder: 'Service includes',
      items: 'Items',
      itemsHint: 'One item per line',
      itemsPlaceholder:
        'Equipment delivery\n' +
        'Installation and setup\n' +
        'Technical support\n' +
        'Dismantling and pickup',
    },
    benefits: {
      title: 'Benefits',
      sectionTitle: 'Section title',
      sectionTitlePlaceholder: 'Why choose us',
      rows: 'Benefits',
      rowsHint: 'Format: Title | Description (one per line)',
      rowsPlaceholder:
        '15+ years experience | Operating since 2007\n' +
        'Own fleet | No dependency on subcontractors',
    },
    gallery: {
      title: 'Gallery',
      rows: 'Images',
      rowsHint: 'Format: URL | Alt | Caption (one per line)',
      rowsPlaceholder:
        '/images/rental/light-1.jpg | Stage lighting | Lighting setup example\n' +
        '/images/rental/light-2.jpg | Hall lighting | Architectural light',
    },
    faq: {
      title: 'FAQ',
      sectionTitle: 'Section title',
      sectionTitlePlaceholder: 'Frequently asked questions',
      rows: 'Questions and answers',
      rowsHint: 'Format: Question | Answer (one per line)',
      rowsPlaceholder:
        'What is the minimum rental period? | Minimum period is 1 day. Delivery and installation are included.\n' +
        'Do you provide an operator? | Yes, we provide an on-site technician.',
    },
    bottomCta: {
      title: 'Bottom CTA',
      heading: 'Heading',
      headingPlaceholder: 'Ready to discuss your project?',
      text: 'Text',
      primary: 'Primary CTA',
      primaryPlaceholder: 'Request quote',
      secondary: 'Secondary CTA',
      secondaryPlaceholder: 'Call us',
    },
  },
  footer: {
    cancel: 'Cancel',
    saving: 'Saving...',
    create: 'Create category',
    save: 'Save changes',
  },
};

const adminRentalCategoryEditContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminRentalCategoryEditContent = (locale: Locale) => adminRentalCategoryEditContentByLocale[locale];

export const adminRentalCategoryEditContent = ru;
