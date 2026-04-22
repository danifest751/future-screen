export const PAGE_CONTACTS_KEY = 'page_contacts';

export interface PageContactsContent {
  seo: { title: string; description: string };
  hero: { title: string; subtitle: string };
  errors: { loadTitle: string; emptyTitle: string; emptyDescription: string };
  labels: {
    phones: string;
    email: string;
    address: string;
    workingHours: string;
    mapTitle: string;
    openInMaps: string;
  };
  form: { title: string; subtitle: string; ctaText: string };
}

const isString = (v: unknown): v is string => typeof v === 'string';

export const parsePageContacts = (raw: string | null | undefined): PageContactsContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      p.seo && isString(p.seo.title) && isString(p.seo.description) &&
      p.hero && isString(p.hero.title) && isString(p.hero.subtitle) &&
      p.errors && isString(p.errors.loadTitle) && isString(p.errors.emptyTitle) && isString(p.errors.emptyDescription) &&
      p.labels &&
      isString(p.labels.phones) && isString(p.labels.email) &&
      isString(p.labels.address) && isString(p.labels.workingHours) &&
      isString(p.labels.mapTitle) && isString(p.labels.openInMaps) &&
      p.form && isString(p.form.title) && isString(p.form.subtitle) && isString(p.form.ctaText)
    ) {
      return p as PageContactsContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializePageContacts = (v: PageContactsContent): string => JSON.stringify(v);
