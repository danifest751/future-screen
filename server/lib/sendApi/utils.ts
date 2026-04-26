import type { SubmissionRequestBody } from './types.js';

// Telegram HTML mode tolerates raw " and ', but the same util might end
// up in an attribute context (e.g. inline preview / future email
// template variables). Escape both so we never bite ourselves later.
export const escapeHtml = (value = ''): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const toCleanString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

export const toErrorMessage = (err: unknown): string => {
  if (!err) return 'Неизвестная ошибка';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message?: unknown }).message ?? 'Неизвестная ошибка');
  }
  return String(err);
};

export const normalizeRequestId = (value: unknown): string =>
  toCleanString(value).replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 120);

export const getRequestIdFromBody = (body: unknown): string => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return '';
  return normalizeRequestId((body as SubmissionRequestBody).requestId);
};

export const toRecord = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const entries = Object.entries(value)
    .map(([key, item]) => [String(key), toCleanString(item)] as const)
    .filter(([, item]) => item);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};
