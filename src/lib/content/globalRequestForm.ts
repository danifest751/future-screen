export const GLOBAL_REQUEST_FORM_KEY = 'global_request_form';

export interface GlobalRequestFormContent {
  defaults: { title: string; ctaText: string };
  sourcePrefix: string;
  validation: { nameRequired: string; phoneRequired: string; invalidEmail: string };
  submitError: string;
  fields: {
    emailLabel: string;
    emailPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    moreFieldsShow: string;
    moreFieldsHide: string;
    telegramLabel: string;
    telegramPlaceholder: string;
    cityLabel: string;
    cityPlaceholder: string;
    dateLabel: string;
    datePlaceholder: string;
    formatLabel: string;
    formatPlaceholder: string;
    commentLabel: string;
    commentPlaceholder: string;
  };
  submitPending: string;
  submitSuccess: string;
}

const isString = (v: unknown): v is string => typeof v === 'string';

export const parseGlobalRequestForm = (
  raw: string | null | undefined,
): GlobalRequestFormContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      p.defaults && isString(p.defaults.title) && isString(p.defaults.ctaText) &&
      isString(p.sourcePrefix) &&
      p.validation && isString(p.validation.nameRequired) && isString(p.validation.phoneRequired) && isString(p.validation.invalidEmail) &&
      isString(p.submitError) &&
      p.fields &&
      isString(p.fields.emailLabel) && isString(p.fields.emailPlaceholder) &&
      isString(p.fields.nameLabel) && isString(p.fields.namePlaceholder) &&
      isString(p.fields.phoneLabel) && isString(p.fields.phonePlaceholder) &&
      isString(p.fields.moreFieldsShow) && isString(p.fields.moreFieldsHide) &&
      isString(p.fields.telegramLabel) && isString(p.fields.telegramPlaceholder) &&
      isString(p.fields.cityLabel) && isString(p.fields.cityPlaceholder) &&
      isString(p.fields.dateLabel) && isString(p.fields.datePlaceholder) &&
      isString(p.fields.formatLabel) && isString(p.fields.formatPlaceholder) &&
      isString(p.fields.commentLabel) && isString(p.fields.commentPlaceholder) &&
      isString(p.submitPending) &&
      isString(p.submitSuccess)
    ) {
      return p as GlobalRequestFormContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializeGlobalRequestForm = (v: GlobalRequestFormContent): string =>
  JSON.stringify(v);
