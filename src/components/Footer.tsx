import { Link } from 'react-router-dom';
import { brandContent, footerContent } from '../content/global';

const handleHashNav = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  const hash = href.split('#')[1];
  if (!hash) return;

  event.preventDefault();
  const element = document.getElementById(hash);
  if (element) element.scrollIntoView({ behavior: 'smooth' });
};

const Footer = () => (
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

          <p className="max-w-xs text-sm leading-relaxed text-gray-400">{footerContent.description}</p>
          <p className="mt-4 text-xs text-gray-600">{footerContent.legal}</p>
        </div>

        <div>
          <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            {footerContent.navigationTitle}
          </div>
          <ul className="space-y-3">
            {footerContent.navLinks.map((item) => (
              <li key={item.to}>
                {item.to.includes('#') ? (
                  <a
                    href={item.to}
                    onClick={(event) => handleHashNav(event, item.to)}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link to={item.to} className="text-sm text-gray-400 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            {footerContent.rentTitle}
          </div>
          <ul className="space-y-3">
            {footerContent.rentLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-sm text-gray-400 transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            {footerContent.contactsTitle}
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
              {footerContent.location}
            </li>
            <li className="flex items-start gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <div>{footerContent.workHours}</div>
                <div className="mt-1 text-gray-500">{footerContent.supportHours}</div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div
        className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-gray-600 sm:flex-row"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div>{footerContent.copyright}</div>
        <Link to="/privacy" className="transition-colors hover:text-gray-400">
          {footerContent.privacyPolicy}
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
