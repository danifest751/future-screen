export const HOME_EVENT_TYPES_KEY = 'home_event_types';

export interface HomeEventTypeItem {
  iconKey: string;
  title: string;
  desc: string;
  photo: string;
}

export interface HomeEventTypesContent {
  badge: string;
  title: string;
  accentTitle: string;
  prevLabel: string;
  nextLabel: string;
  items: HomeEventTypeItem[];
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isItem = (v: unknown): v is HomeEventTypeItem =>
  v !== null &&
  typeof v === 'object' &&
  isString((v as HomeEventTypeItem).iconKey) &&
  isString((v as HomeEventTypeItem).title) &&
  isString((v as HomeEventTypeItem).desc) &&
  isString((v as HomeEventTypeItem).photo);

export const parseHomeEventTypes = (
  raw: string | null | undefined,
): HomeEventTypesContent | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      isString(parsed.badge) &&
      isString(parsed.title) &&
      isString(parsed.accentTitle) &&
      isString(parsed.prevLabel) &&
      isString(parsed.nextLabel) &&
      Array.isArray(parsed.items) &&
      parsed.items.every(isItem)
    ) {
      return parsed as HomeEventTypesContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializeHomeEventTypes = (value: HomeEventTypesContent): string =>
  JSON.stringify(value);
