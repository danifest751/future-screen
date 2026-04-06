export const adminRentalCategoryEditContent = {
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
} as const;
