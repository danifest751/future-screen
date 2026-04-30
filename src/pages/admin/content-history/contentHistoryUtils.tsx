import type {
  SiteContentSnapshot,
  SiteContentVersion,
  SiteContentVersionOperation,
} from '../../../services/siteContentVersions';

export const operationColor: Record<SiteContentVersionOperation, string> = {
  INSERT: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  UPDATE: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  DELETE: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export const formatTimestamp = (iso: string, locale: string): string => {
  try {
    return new Date(iso).toLocaleString(locale, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export const summarizeSnapshot = (v: SiteContentVersion, adminLocale: 'ru' | 'en'): string => {
  const pieces: string[] = [];
  const charsLabel = adminLocale === 'ru' ? 'симв.' : 'chars';
  const yesLabel = adminLocale === 'ru' ? 'да' : 'yes';
  const noLabel = adminLocale === 'ru' ? 'нет' : 'no';
  const emptyLabel = adminLocale === 'ru' ? 'пусто' : 'empty';

  if (v.title) {
    pieces.push(`${adminLocale === 'ru' ? 'Заголовок RU' : 'Title RU'}: ${JSON.stringify(v.title.slice(0, 40))}`);
  }
  if (v.content) {
    pieces.push(`RU: ${v.content.length} ${charsLabel}`);
  }
  if (v.metaTitle) {
    pieces.push(`Meta RU: ${JSON.stringify(v.metaTitle.slice(0, 32))}`);
  }
  if (v.titleEn) {
    pieces.push(`${adminLocale === 'ru' ? 'Заголовок EN' : 'Title EN'}: ${JSON.stringify(v.titleEn.slice(0, 40))}`);
  }
  if (v.contentEn) {
    pieces.push(`EN: ${v.contentEn.length} ${charsLabel}`);
  }
  if (v.metaTitleEn) {
    pieces.push(`Meta EN: ${JSON.stringify(v.metaTitleEn.slice(0, 32))}`);
  }
  if (v.isPublished !== null && v.isPublished !== undefined) {
    pieces.push(`${adminLocale === 'ru' ? 'Опубликовано' : 'Published'}: ${v.isPublished ? yesLabel : noLabel}`);
  }
  return pieces.join(' · ') || `— ${emptyLabel} —`;
};

export type RestorePreviewFieldKey = Exclude<keyof SiteContentSnapshot, 'id' | 'key'>;
export type PreviewSnapshot = SiteContentSnapshot | SiteContentVersion | null;

export const restorePreviewFields: Array<{ key: RestorePreviewFieldKey; labelKey: RestorePreviewFieldKey }> = [
  { key: 'title', labelKey: 'title' },
  { key: 'content', labelKey: 'content' },
  { key: 'contentHtml', labelKey: 'contentHtml' },
  { key: 'metaTitle', labelKey: 'metaTitle' },
  { key: 'metaDescription', labelKey: 'metaDescription' },
  { key: 'fontSize', labelKey: 'fontSize' },
  { key: 'titleEn', labelKey: 'titleEn' },
  { key: 'contentEn', labelKey: 'contentEn' },
  { key: 'contentHtmlEn', labelKey: 'contentHtmlEn' },
  { key: 'metaTitleEn', labelKey: 'metaTitleEn' },
  { key: 'metaDescriptionEn', labelKey: 'metaDescriptionEn' },
  { key: 'fontSizeEn', labelKey: 'fontSizeEn' },
  { key: 'isPublished', labelKey: 'isPublished' },
];

export const isSamePreviewValue = (
  currentValue: ReturnType<typeof getPreviewValue>,
  nextValue: ReturnType<typeof getPreviewValue>
): boolean => (currentValue ?? null) === (nextValue ?? null);

export const getPreviewValue = (
  snapshot: PreviewSnapshot,
  key: RestorePreviewFieldKey
): SiteContentSnapshot[RestorePreviewFieldKey] | SiteContentVersion[RestorePreviewFieldKey] | undefined => (
  snapshot ? snapshot[key] : null
);

export const formatPreviewValue = (
  value: SiteContentSnapshot[RestorePreviewFieldKey] | SiteContentVersion[RestorePreviewFieldKey] | undefined,
  adminLocale: 'ru' | 'en'
): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? (adminLocale === 'ru' ? 'да' : 'yes') : (adminLocale === 'ru' ? 'нет' : 'no');
  if (value.length === 0) return adminLocale === 'ru' ? 'пустая строка' : 'empty string';
  return value.length > 900 ? `${value.slice(0, 900)}…` : value;
};

export interface DiffTextParts {
  prefix: string;
  changed: string;
  suffix: string;
}

export const formatDiffText = (
  value: ReturnType<typeof getPreviewValue>,
  adminLocale: 'ru' | 'en'
): string => formatPreviewValue(value, adminLocale);

export const splitDiffText = (beforeText: string, afterText: string): {
  before: DiffTextParts;
  after: DiffTextParts;
} => {
  let prefixLength = 0;
  const maxPrefix = Math.min(beforeText.length, afterText.length);
  while (prefixLength < maxPrefix && beforeText[prefixLength] === afterText[prefixLength]) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  const maxSuffix = Math.min(beforeText.length - prefixLength, afterText.length - prefixLength);
  while (
    suffixLength < maxSuffix &&
    beforeText[beforeText.length - 1 - suffixLength] === afterText[afterText.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  return {
    before: {
      prefix: beforeText.slice(0, prefixLength),
      changed: beforeText.slice(prefixLength, beforeText.length - suffixLength),
      suffix: suffixLength > 0 ? beforeText.slice(beforeText.length - suffixLength) : '',
    },
    after: {
      prefix: afterText.slice(0, prefixLength),
      changed: afterText.slice(prefixLength, afterText.length - suffixLength),
      suffix: suffixLength > 0 ? afterText.slice(afterText.length - suffixLength) : '',
    },
  };
};
