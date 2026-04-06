import type { Locale } from '../../i18n/types';

type MediaUploadContent = {
  statuses: {
    pending: string;
    uploading: string;
    processing: string;
    completed: string;
    error: string;
    unknown: string;
  };
  errors: {
    failedToLoadImage: string;
  };
};

const ru: MediaUploadContent = {
  statuses: {
    pending: 'Ожидает',
    uploading: 'Загрузка',
    processing: 'Обработка',
    completed: 'Готово',
    error: 'Ошибка',
    unknown: 'Неизвестно',
  },
  errors: {
    failedToLoadImage: 'Не удалось загрузить изображение',
  },
};

const en: MediaUploadContent = {
  statuses: {
    pending: 'Pending',
    uploading: 'Uploading',
    processing: 'Processing',
    completed: 'Done',
    error: 'Error',
    unknown: 'Unknown',
  },
  errors: {
    failedToLoadImage: 'Failed to load image',
  },
};

const mediaUploadByLocale: Record<Locale, MediaUploadContent> = { ru, en };

export const getMediaUploadContent = (locale: Locale): MediaUploadContent => mediaUploadByLocale[locale];
