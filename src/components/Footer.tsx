import { Link, useLocation } from 'react-router-dom';
import { getGlobalContent } from '../content/global';
import { useI18n } from '../context/I18nContext';
import { useGlobalFooter } from '../hooks/useGlobalFooter';
import { useEditableBinding } from '../hooks/useEditableBinding';
import type { GlobalFooterContent, GlobalFooterLink } from '../lib/content/globalFooter';

const handleHashNav = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  const hash = href.split('#')[1];
  if (!hash) return;

  event.preventDefault();
  const element = document.getElementById(hash);
  if (element) element.scrollIntoView({ behavior: 'smooth' });
};

interface FooterNavLinkProps {
  link: GlobalFooterLink;
  index: number;
  labelPrefix: string;
  onSaveLabel: (next: string) => Promise<void>;
  hashNav?: boolean;
}

const FooterNavLink = ({ link, index, labelPrefix, onSaveLabel, hashNav }: FooterNavLinkProps) => {
  const labelEdit = useEditableBinding({
    value: link.label,
    onSave: onSaveLabel,
    label: `${labelPrefix} ${index + 1} — label`,
  });
  const inner = <span {...labelEdit.bindProps}>{labelEdit.value}</span>;
  if (hashNav && link.to.includes('#')) {
    return (
      <a
        href={link.to}
        onClick={(event) => handleHashNav(event, link.to)}
        className="text-sm text-gray-400 transition-colors hover:text-white"
      >
        {inner}
      </a>
    );
  }
  return (
    <Link to={link.to} className="text-sm text-gray-400 transition-colors hover:text-white">
      {inner}
    </Link>
  );
};

const Footer = () => {
  const { getLocaleForPath, siteLocale } = useI18n();
  const location = useLocation();
  const locale = getLocaleForPath(location.pathname);
  const { brandContent } = getGlobalContent(locale);
  // Footer chrome comes from DB for the editor's current locale; we fall back
  // to the route-derived locale for read-only rendering outside edit mode.
  const { data: footerContent, save: saveFooter } = useGlobalFooter(siteLocale, true);

  const savePatch = async (patch: Partial<GlobalFooterContent>) => {
    const ok = await saveFooter({ ...footerContent, ...patch });
    if (!ok) throw new Error('Failed to save footer');
  };

  const descriptionEdit = useEditableBinding({
    value: footerContent.description,
    onSave: (next) => savePatch({ description: next }),
    label: 'Footer — description',
    kind: 'multiline',
  });
  const legalEdit = useEditableBinding({
    value: footerContent.legal,
    onSave: (next) => savePatch({ legal: next }),
    label: 'Footer — legal',
  });
  const navigationTitleEdit = useEditableBinding({
    value: footerContent.navigationTitle,
    onSave: (next) => savePatch({ navigationTitle: next }),
    label: 'Footer — navigation title',
  });
  const rentTitleEdit = useEditableBinding({
    value: footerContent.rentTitle,
    onSave: (next) => savePatch({ rentTitle: next }),
    label: 'Footer — rent title',
  });
  const contactsTitleEdit = useEditableBinding({
    value: footerContent.contactsTitle,
    onSave: (next) => savePatch({ contactsTitle: next }),
    label: 'Footer — contacts title',
  });
  const locationEdit = useEditableBinding({
    value: footerContent.location,
    onSave: (next) => savePatch({ location: next }),
    label: 'Footer — location',
  });
  const workHoursEdit = useEditableBinding({
    value: footerContent.workHours,
    onSave: (next) => savePatch({ workHours: next }),
    label: 'Footer — work hours',
  });
  const supportHoursEdit = useEditableBinding({
    value: footerContent.supportHours,
    onSave: (next) => savePatch({ supportHours: next }),
    label: 'Footer — support hours',
  });
  const copyrightEdit = useEditableBinding({
    value: footerContent.copyright,
    onSave: (next) => savePatch({ copyright: next }),
    label: 'Footer — copyright',
  });
  const privacyPolicyEdit = useEditableBinding({
    value: footerContent.privacyPolicy,
    onSave: (next) => savePatch({ privacyPolicy: next }),
    label: 'Footer — privacy policy label',
  });

  const saveNavLinkLabel = (index: number) => async (nextLabel: string) => {
    const nextLinks = footerContent.navLinks.map((l, i) =>
      i === index ? { ...l, label: nextLabel } : l,
    );
    await savePatch({ navLinks: nextLinks });
  };
  const saveRentLinkLabel = (index: number) => async (nextLabel: string) => {
    const nextLinks = footerContent.rentLinks.map((l, i) =>
      i === index ? { ...l, label: nextLabel } : l,
    );
    await savePatch({ rentLinks: nextLinks });
  };

  return (
    <footer
      className="relative z-10 border-t"
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="container-page py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="mb-5 flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-[15px] font-bold tracking-tight text-white">
                  {brandContent.namePrimary}
                </span>
                <svg viewBox="0 0 28 24" width="28" height="24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <rect x="0.5" y="0.5" width="27" height="23" rx="2.5" fill="#0d0d0d" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                  <circle cx="5.5" cy="6" r="2" fill="#ef4444" opacity="0.95" />
                  <circle cx="11.5" cy="6" r="2" fill="#3b82f6" opacity="0.95" />
                  <circle cx="17.5" cy="6" r="2" fill="#22c55e" opacity="0.95" />
                  <circle cx="23" cy="6" r="2" fill="#f59e0b" opacity="0.95" />
                  <circle cx="5.5" cy="12" r="2" fill="#8b5cf6" opacity="0.95" />
                  <circle cx="11.5" cy="12" r="2" fill="#ef4444" opacity="0.95" />
                  <circle cx="17.5" cy="12" r="2" fill="#3b82f6" opacity="0.95" />
                  <circle cx="23" cy="12" r="2" fill="#22c55e" opacity="0.95" />
                  <circle cx="5.5" cy="18" r="2" fill="#f59e0b" opacity="0.95" />
                  <circle cx="11.5" cy="18" r="2" fill="#8b5cf6" opacity="0.95" />
                  <circle cx="17.5" cy="18" r="2" fill="#ec4899" opacity="0.95" />
                  <circle cx="23" cy="18" r="2" fill="#ef4444" opacity="0.95" />
                </svg>
                <span className="font-display text-[15px] font-bold tracking-tight text-white">
                  {brandContent.nameSecondary}
                </span>
              </div>
              <div className="text-[8.5px] font-medium uppercase tracking-[0.12em] text-gray-300">
                {brandContent.subtitle}
              </div>
            </Link>

            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              <span {...descriptionEdit.bindProps}>{descriptionEdit.value}</span>
            </p>
            <p className="mt-4 text-xs text-gray-600">
              <span {...legalEdit.bindProps}>{legalEdit.value}</span>
            </p>
          </div>

          <div>
            <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              <span {...navigationTitleEdit.bindProps}>{navigationTitleEdit.value}</span>
            </div>
            <ul className="space-y-3">
              {footerContent.navLinks.map((item, i) => (
                <li key={`${i}-${item.to}`}>
                  <FooterNavLink
                    link={item}
                    index={i}
                    labelPrefix="Footer nav"
                    onSaveLabel={saveNavLinkLabel(i)}
                    hashNav
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              <span {...rentTitleEdit.bindProps}>{rentTitleEdit.value}</span>
            </div>
            <ul className="space-y-3">
              {footerContent.rentLinks.map((item, i) => (
                <li key={`${i}-${item.to}`}>
                  <FooterNavLink
                    link={item}
                    index={i}
                    labelPrefix="Footer rent"
                    onSaveLabel={saveRentLinkLabel(i)}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              <span {...contactsTitleEdit.bindProps}>{contactsTitleEdit.value}</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href={`tel:${brandContent.phoneHref}`} className="flex items-center gap-2 transition-colors hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
                  </svg>
                  {brandContent.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span {...locationEdit.bindProps}>{locationEdit.value}</span>
              </li>
              <li className="flex items-start gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <div>
                    <span {...workHoursEdit.bindProps}>{workHoursEdit.value}</span>
                  </div>
                  <div className="mt-1 text-gray-500">
                    <span {...supportHoursEdit.bindProps}>{supportHoursEdit.value}</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-gray-600 sm:flex-row"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div>
            <span {...copyrightEdit.bindProps}>{copyrightEdit.value}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="transition-colors hover:text-gray-400">
              <span {...privacyPolicyEdit.bindProps}>{privacyPolicyEdit.value}</span>
            </Link>
            <a
              href="https://github.com/danifest751/visual-led"
              target="_blank"
              rel="noreferrer"
              className="opacity-70 transition-colors hover:text-gray-400 hover:opacity-100"
            >
              {footerContent.visualLedLink}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
