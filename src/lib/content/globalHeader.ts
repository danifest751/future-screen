export const GLOBAL_HEADER_KEY = 'global_header';

export interface GlobalHeaderNavLink {
  to: string;
  label: string;
  hash: boolean;
}

export interface GlobalHeaderContent {
  navLinks: GlobalHeaderNavLink[];
  rentLabel: string;
  casesLabel: string;
  contactsLabel: string;
  signOutTitle: string;
  signInTitle: string;
  menuAriaLabel: string;
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isNavLink = (v: unknown): v is GlobalHeaderNavLink =>
  v !== null &&
  typeof v === 'object' &&
  isString((v as GlobalHeaderNavLink).to) &&
  isString((v as GlobalHeaderNavLink).label) &&
  typeof (v as GlobalHeaderNavLink).hash === 'boolean';

export const parseGlobalHeader = (
  raw: string | null | undefined,
): GlobalHeaderContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      Array.isArray(p.navLinks) &&
      p.navLinks.every(isNavLink) &&
      isString(p.rentLabel) &&
      isString(p.casesLabel) &&
      isString(p.contactsLabel) &&
      isString(p.signOutTitle) &&
      isString(p.signInTitle) &&
      isString(p.menuAriaLabel)
    ) {
      return p as GlobalHeaderContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializeGlobalHeader = (v: GlobalHeaderContent): string => JSON.stringify(v);
