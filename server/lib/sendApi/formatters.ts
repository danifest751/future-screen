import type { EmailPayload } from './types.js';
import { escapeHtml, toCleanString } from './utils.js';

const RU_PAGE_LABELS: Record<string, string> = {
  '/': 'Главная',
  '/prices': 'Цены',
  '/cases': 'Кейсы',
  '/contacts': 'Контакты',
  '/support': 'Поддержка',
  '/consult': 'Консультация',
  '/rent': 'Аренда',
  '/rent/video': 'Аренда: Видеоэкраны',
  '/rent/sound': 'Аренда: Звук',
  '/rent/light': 'Аренда: Свет',
  '/rent/stage': 'Аренда: Сцены',
  '/rent/instruments': 'Аренда: Инструменты',
  '/rent/computers': 'Аренда: Компьютеры',
  '/rent/touchscreens': 'Аренда: Тач-панели',
  '/rent/staff': 'Аренда: Персонал',
};

export const normalizePath = (value: string): string => {
  if (!value) return '';
  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      const parsed = new URL(value);
      return parsed.pathname || '/';
    }
  } catch {
    // ignore parse errors and use raw value
  }
  return value.startsWith('/') ? value : '';
};

export const localizeSourceToRu = (rawSource: string): string => {
  const source = toCleanString(rawSource);
  if (!source) return 'Сайт';

  const match = source.match(/\((\/[^)]+)\)\s*$/);
  const path = normalizePath(match?.[1] ?? '');
  const baseRaw = match ? source.replace(match[0], '').trim() : source;

  const baseNormalized = baseRaw.toLowerCase();
  const baseLocalized =
    baseNormalized.startsWith('quote form') || baseNormalized.startsWith('form quote')
      ? 'Форма заявки'
      : baseNormalized.startsWith('site') || baseNormalized.startsWith('future screen form')
        ? 'Сайт'
        : baseRaw;

  if (!path) return baseLocalized || 'Сайт';

  const pathLabel = RU_PAGE_LABELS[path] || `Страница ${path}`;
  return `${baseLocalized || 'Сайт'} — ${pathLabel}`;
};

export const formatTelegramMessage = (payload: EmailPayload): string => {
  const sourceLabel = localizeSourceToRu(payload.source);
  const lines = [
    '<b>🔥 Новая заявка</b>',
    `<b>Источник:</b> ${escapeHtml(sourceLabel)}`,
    '',
  ];

  const pushField = (label: string, value: unknown) => {
    const clean = toCleanString(value);
    if (!clean) return;
    lines.push(`<b>${label}:</b> ${escapeHtml(clean)}`);
  };

  pushField('Имя', payload.name);
  pushField('Телефон', payload.phone);
  pushField('Email', payload.email);
  pushField('Telegram', payload.telegram);
  pushField('Город', payload.city);
  pushField('Дата', payload.date);
  pushField('Формат', payload.format);
  pushField('Комментарий', payload.comment);

  if (payload.extra) {
    const extraEntries = Object.entries(payload.extra)
      .map(([key, value]) => [toCleanString(key), toCleanString(value)] as const)
      .filter(([key, value]) => key && value);

    if (extraEntries.length > 0) {
      lines.push('');
      lines.push('<b>Параметры расчета:</b>');
      for (const [key, value] of extraEntries) {
        lines.push(`• <b>${escapeHtml(key)}:</b> ${escapeHtml(value)}`);
      }
    }
  }

  return lines.join('\n');
};

export const formatEmailFailureAlertMessage = ({
  requestId,
  source,
  name,
  phone,
  email,
  errorMessage,
}: {
  requestId: string;
  source?: string;
  name?: string;
  phone?: string;
  email?: string;
  errorMessage: string;
}): string => {
  const sourceLabel = localizeSourceToRu(toCleanString(source));
  const lines = [
    '<b>⚠️ Ошибка доставки Email</b>',
    `<b>Request ID:</b> <code>${escapeHtml(requestId)}</code>`,
    '',
    `<b>Источник:</b> ${escapeHtml(sourceLabel)}`,
    `<b>Имя:</b> ${escapeHtml(toCleanString(name) || '—')}`,
    `<b>Телефон:</b> ${escapeHtml(toCleanString(phone) || '—')}`,
  ];

  const cleanEmail = toCleanString(email);
  if (cleanEmail) lines.push(`<b>Email:</b> ${escapeHtml(cleanEmail)}`);

  lines.push('');
  lines.push(`<b>Причина:</b> ${escapeHtml(toCleanString(errorMessage) || 'Неизвестная ошибка')}`);
  return lines.join('\n');
};
