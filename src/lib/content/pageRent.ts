export const PAGE_RENT_KEY = 'page_rent';

export interface PageRentContent {
  seo: { title: string; description: string };
  hero: { title: string; subtitle: string; loading: string; error: string };
  checklist: { title: string; items: string[] };
  form: { title: string; subtitle: string; ctaText: string };
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isStringArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

export const parsePageRent = (raw: string | null | undefined): PageRentContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      p.seo && isString(p.seo.title) && isString(p.seo.description) &&
      p.hero && isString(p.hero.title) && isString(p.hero.subtitle) &&
        isString(p.hero.loading) && isString(p.hero.error) &&
      p.checklist && isString(p.checklist.title) && isStringArr(p.checklist.items) &&
      p.form && isString(p.form.title) && isString(p.form.subtitle) && isString(p.form.ctaText)
    ) {
      return p as PageRentContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializePageRent = (v: PageRentContent): string => JSON.stringify(v);
