export const HOME_CTA_KEY = 'home_cta';

export interface HomeCtaContent {
  title: string;
  accentTitle: string;
  subtitle: string;
}

const isString = (v: unknown): v is string => typeof v === 'string';

export const parseHomeCta = (raw: string | null | undefined): HomeCtaContent | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      isString(parsed.title) &&
      isString(parsed.accentTitle) &&
      isString(parsed.subtitle)
    ) {
      return parsed as HomeCtaContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializeHomeCta = (value: HomeCtaContent): string => JSON.stringify(value);
