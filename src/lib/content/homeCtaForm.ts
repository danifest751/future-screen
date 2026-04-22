export const HOME_CTA_FORM_KEY = 'home_cta_form';

export interface HomeCtaFormContent {
  errors: {
    name: string;
    contact: string;
    phone: string;
    email: string;
    submit: string;
  };
  success: {
    title: string;
    subtitle: string;
    reset: string;
  };
  placeholders: {
    name: string;
    phone: string;
    email: string;
  };
  submit: {
    loading: string;
    idle: string;
  };
}

const isString = (v: unknown): v is string => typeof v === 'string';

export const parseHomeCtaForm = (
  raw: string | null | undefined,
): HomeCtaFormContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      p.errors &&
      isString(p.errors.name) && isString(p.errors.contact) && isString(p.errors.phone) &&
      isString(p.errors.email) && isString(p.errors.submit) &&
      p.success && isString(p.success.title) && isString(p.success.subtitle) && isString(p.success.reset) &&
      p.placeholders && isString(p.placeholders.name) && isString(p.placeholders.phone) && isString(p.placeholders.email) &&
      p.submit && isString(p.submit.loading) && isString(p.submit.idle)
    ) {
      return p as HomeCtaFormContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializeHomeCtaForm = (v: HomeCtaFormContent): string => JSON.stringify(v);
