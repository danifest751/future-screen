export const GLOBAL_BRAND_KEY = 'global_brand';

export interface GlobalBrandContent {
  namePrimary: string;
  nameSecondary: string;
  subtitle: string;
  /** Display-formatted phone, e.g. "8 (912) 246-65-66". */
  phoneDisplay: string;
  /** tel: URL form, e.g. "+79122466566". Not inline-editable by design
   *  (anchor attribute, not DOM text). Kept in DB for admin-page edits. */
  phoneHref: string;
}

const isString = (v: unknown): v is string => typeof v === 'string';

export const parseGlobalBrand = (
  raw: string | null | undefined,
): GlobalBrandContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      isString(p.namePrimary) &&
      isString(p.nameSecondary) &&
      isString(p.subtitle) &&
      isString(p.phoneDisplay) &&
      isString(p.phoneHref)
    ) {
      return p as GlobalBrandContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializeGlobalBrand = (v: GlobalBrandContent): string => JSON.stringify(v);
