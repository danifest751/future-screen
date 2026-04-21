export const PAGE_LED_KEY = 'page_led';

export interface PageLedSelectionCard {
  caption: string;
  title: string;
  description: string;
}

export interface PageLedContent {
  seo: { title: string; description: string };
  hero: { title: string; subtitle: string };
  benefitsTitle: string;
  benefits: string[];
  configsTitle: string;
  configs: string[];
  selection: {
    title: string;
    subtitle: string;
    cards: PageLedSelectionCard[];
  };
  faqTitle: string;
  faq: string[];
  included: { title: string; items: string[] };
  form: { title: string; subtitle: string; ctaText: string };
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isStringArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);
const isCard = (v: unknown): v is PageLedSelectionCard =>
  v !== null &&
  typeof v === 'object' &&
  isString((v as PageLedSelectionCard).caption) &&
  isString((v as PageLedSelectionCard).title) &&
  isString((v as PageLedSelectionCard).description);

export const parsePageLed = (raw: string | null | undefined): PageLedContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      p.seo && isString(p.seo.title) && isString(p.seo.description) &&
      p.hero && isString(p.hero.title) && isString(p.hero.subtitle) &&
      isString(p.benefitsTitle) && isStringArr(p.benefits) &&
      isString(p.configsTitle) && isStringArr(p.configs) &&
      p.selection && isString(p.selection.title) && isString(p.selection.subtitle) &&
      Array.isArray(p.selection.cards) && p.selection.cards.every(isCard) &&
      isString(p.faqTitle) && isStringArr(p.faq) &&
      p.included && isString(p.included.title) && isStringArr(p.included.items) &&
      p.form && isString(p.form.title) && isString(p.form.subtitle) && isString(p.form.ctaText)
    ) {
      return p as PageLedContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializePageLed = (v: PageLedContent): string => JSON.stringify(v);
