export const PAGE_CONSULT_KEY = 'page_consult';

export interface PageConsultContent {
  seo: { title: string; description: string };
  hero: { title: string; subtitle: string };
  body: { description: string; items: string[] };
  form: { title: string; subtitle: string; ctaText: string };
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isStringArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

export const parsePageConsult = (raw: string | null | undefined): PageConsultContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      p.seo && isString(p.seo.title) && isString(p.seo.description) &&
      p.hero && isString(p.hero.title) && isString(p.hero.subtitle) &&
      p.body && isString(p.body.description) && isStringArr(p.body.items) &&
      p.form && isString(p.form.title) && isString(p.form.subtitle) && isString(p.form.ctaText)
    ) {
      return p as PageConsultContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializePageConsult = (v: PageConsultContent): string => JSON.stringify(v);
