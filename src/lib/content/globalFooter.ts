export const GLOBAL_FOOTER_KEY = 'global_footer';

export interface GlobalFooterLink {
  to: string;
  label: string;
}

export interface GlobalFooterContent {
  navLinks: GlobalFooterLink[];
  rentLinks: GlobalFooterLink[];
  description: string;
  legal: string;
  navigationTitle: string;
  rentTitle: string;
  contactsTitle: string;
  location: string;
  workHours: string;
  supportHours: string;
  copyright: string;
  privacyPolicy: string;
  visualLedLink: string;
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isLink = (v: unknown): v is GlobalFooterLink =>
  v !== null &&
  typeof v === 'object' &&
  isString((v as GlobalFooterLink).to) &&
  isString((v as GlobalFooterLink).label);

export const parseGlobalFooter = (
  raw: string | null | undefined,
): GlobalFooterContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      Array.isArray(p.navLinks) &&
      p.navLinks.every(isLink) &&
      Array.isArray(p.rentLinks) &&
      p.rentLinks.every(isLink) &&
      isString(p.description) &&
      isString(p.legal) &&
      isString(p.navigationTitle) &&
      isString(p.rentTitle) &&
      isString(p.contactsTitle) &&
      isString(p.location) &&
      isString(p.workHours) &&
      isString(p.supportHours) &&
      isString(p.copyright) &&
      isString(p.privacyPolicy) &&
      isString(p.visualLedLink)
    ) {
      return p as GlobalFooterContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializeGlobalFooter = (v: GlobalFooterContent): string => JSON.stringify(v);
