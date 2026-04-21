export const PAGE_ABOUT_KEY = 'page_about';

export interface PageAboutContent {
  seo: { title: string; description: string };
  section: { title: string; subtitle: string };
  paragraphs: string[];
  factsTitle: string;
  facts: string[];
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isStringArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

export const parsePageAbout = (raw: string | null | undefined): PageAboutContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      p.seo && isString(p.seo.title) && isString(p.seo.description) &&
      p.section && isString(p.section.title) && isString(p.section.subtitle) &&
      isStringArr(p.paragraphs) &&
      isString(p.factsTitle) &&
      isStringArr(p.facts)
    ) {
      return p as PageAboutContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializePageAbout = (v: PageAboutContent): string => JSON.stringify(v);
