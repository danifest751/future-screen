export const PAGE_PRICES_KEY = 'page_prices';

export interface PagePricesContent {
  seo: { title: string; description: string };
  hero: {
    title: string;
    subtitle: string;
    loading: string;
    fallbackFormat: string;
    optionsLabel: string;
    detailsLink: string;
  };
  pricing: { title: string; items: string[] };
  form: { title: string; subtitle: string; ctaText: string };
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isStringArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

export const parsePagePrices = (raw: string | null | undefined): PagePricesContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      p.seo && isString(p.seo.title) && isString(p.seo.description) &&
      p.hero &&
      isString(p.hero.title) && isString(p.hero.subtitle) &&
      isString(p.hero.loading) && isString(p.hero.fallbackFormat) &&
      isString(p.hero.optionsLabel) && isString(p.hero.detailsLink) &&
      p.pricing && isString(p.pricing.title) && isStringArr(p.pricing.items) &&
      p.form && isString(p.form.title) && isString(p.form.subtitle) && isString(p.form.ctaText)
    ) {
      return p as PagePricesContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializePagePrices = (v: PagePricesContent): string => JSON.stringify(v);
