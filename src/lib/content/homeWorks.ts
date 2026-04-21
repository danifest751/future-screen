export const HOME_WORKS_KEY = 'home_works';

export interface HomeWorksItem {
  src: string;
  tag: string;
  title: string;
}

export interface HomeWorksContent {
  badge: string;
  title: string;
  accentTitle: string;
  allCasesLink: string;
  prevLabel: string;
  nextLabel: string;
  items: HomeWorksItem[];
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isItem = (v: unknown): v is HomeWorksItem =>
  v !== null &&
  typeof v === 'object' &&
  isString((v as HomeWorksItem).src) &&
  isString((v as HomeWorksItem).tag) &&
  isString((v as HomeWorksItem).title);

export const parseHomeWorks = (raw: string | null | undefined): HomeWorksContent | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      isString(parsed.badge) &&
      isString(parsed.title) &&
      isString(parsed.accentTitle) &&
      isString(parsed.allCasesLink) &&
      isString(parsed.prevLabel) &&
      isString(parsed.nextLabel) &&
      Array.isArray(parsed.items) &&
      parsed.items.every(isItem)
    ) {
      return parsed as HomeWorksContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializeHomeWorks = (value: HomeWorksContent): string => JSON.stringify(value);
