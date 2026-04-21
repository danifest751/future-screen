export const PAGE_SUPPORT_KEY = 'page_support';

export interface PageSupportContent {
  seo: { title: string; description: string };
  hero: { title: string; subtitle: string };
  loading: string;
  universalBadge: string;
  optionsPrefix: string;
  formatsPrefix: string;
  discussPackage: string;
  process: { title: string; subtitle: string; stepPrefix: string; items: string[] };
  advantages: { title: string; items: string[] };
  form: { title: string; subtitle: string; ctaText: string };
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isStringArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

export const parsePageSupport = (raw: string | null | undefined): PageSupportContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      p.seo && isString(p.seo.title) && isString(p.seo.description) &&
      p.hero && isString(p.hero.title) && isString(p.hero.subtitle) &&
      isString(p.loading) && isString(p.universalBadge) &&
      isString(p.optionsPrefix) && isString(p.formatsPrefix) && isString(p.discussPackage) &&
      p.process && isString(p.process.title) && isString(p.process.subtitle) &&
        isString(p.process.stepPrefix) && isStringArr(p.process.items) &&
      p.advantages && isString(p.advantages.title) && isStringArr(p.advantages.items) &&
      p.form && isString(p.form.title) && isString(p.form.subtitle) && isString(p.form.ctaText)
    ) {
      return p as PageSupportContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializePageSupport = (v: PageSupportContent): string => JSON.stringify(v);
