export const GLOBAL_CONSENT_KEY = 'global_consent';

export interface GlobalConsentContent {
  prefix: string;
  linkLabel: string;
}

const isString = (v: unknown): v is string => typeof v === 'string';

export const parseGlobalConsent = (
  raw: string | null | undefined,
): GlobalConsentContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === 'object' && isString(p.prefix) && isString(p.linkLabel)) {
      return p as GlobalConsentContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializeGlobalConsent = (v: GlobalConsentContent): string => JSON.stringify(v);
