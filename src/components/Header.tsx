import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { PrefetchLink } from './PrefetchLink';
import { RentalDropdown } from './RentalDropdown';
import LoginModal from './LoginModal';
import LocaleSwitch from './LocaleSwitch';
import { getGlobalContent } from '../content/global';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [rentalDropdownOpen, setRentalDropdownOpen] = useState(false);
  const rentalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isAuthenticated, logout } = useAuth();
  const { siteLocale, setSiteLocale, getLocaleForPath } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const locale = getLocaleForPath(location.pathname);
  const isAdminPath = location.pathname.startsWith('/admin');
  const { brandContent, headerContent } = getGlobalContent(locale);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const pending = sessionStorage.getItem('scrollTo');
    if (pending && location.pathname === '/') {
      sessionStorage.removeItem('scrollTo');
      const tryScroll = (attempts = 0) => {
        const element = document.getElementById(pending);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else if (attempts < 10) {
          setTimeout(() => tryScroll(attempts + 1), 100);
        }
      };

      setTimeout(() => tryScroll(), 100);
    }
  }, [location.pathname]);

  const closeMenu = () => setMenuOpen(false);

  const handleRentalMouseEnter = () => {
    if (rentalTimeoutRef.current) clearTimeout(rentalTimeoutRef.current);
    setRentalDropdownOpen(true);
  };

  const handleRentalMouseLeave = () => {
    rentalTimeoutRef.current = setTimeout(() => {
      setRentalDropdownOpen(false);
    }, 150);
  };

  const handleHashNav = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const hash = href.split('#')[1];
    if (!hash) return;

    event.preventDefault();
    closeMenu();

    if (location.pathname === '/') {
      const element = document.getElementById(hash);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    sessionStorage.setItem('scrollTo', hash);
    navigate('/');
  };

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    closeMenu();
    if (location.pathname !== '/') return;

    event.preventDefault();
    const start = window.scrollY;
    const duration = 1200;
    const startTime = performance.now();
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, start * (1 - easeInOutCubic(progress)));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const headerStyle = {
    background: scrolled ? 'rgba(10, 10, 10, 0.85)' : 'transparent',
    backdropFilter: scrolled ? 'blur(20px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 transition-all duration-300" style={headerStyle}>
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link to="/" className="flex shrink-0 flex-col gap-0.5" onClick={handleLogoClick}>
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[15px] font-bold tracking-tight text-white lg:text-[16px]">
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
            <span className="font-display text-[15px] font-bold tracking-tight text-white lg:text-[16px]">
              {brandContent.nameSecondary}
            </span>
          </div>
          <div className="hidden text-[8.5px] font-medium uppercase tracking-[0.12em] text-gray-300 lg:block">
            {brandContent.subtitle}
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {headerContent.navLinks.map((item) => (
            <a
              key={item.to}
              href={item.to}
              onClick={(event) => handleHashNav(event, item.to)}
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <div className="relative" onMouseEnter={handleRentalMouseEnter} onMouseLeave={handleRentalMouseLeave}>
            <PrefetchLink
              to="/rent"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-white/5 hover:text-white"
            >
              {headerContent.rentLabel}
            </PrefetchLink>
            <RentalDropdown isOpen={rentalDropdownOpen} onClose={() => setRentalDropdownOpen(false)} />
          </div>
          <PrefetchLink
            to="/cases"
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-white/5 hover:text-white"
          >
            {headerContent.casesLabel}
          </PrefetchLink>
          <PrefetchLink
            to="/contacts"
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-white/5 hover:text-white"
          >
            {headerContent.contactsLabel}
          </PrefetchLink>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {!isAdminPath ? (
            <LocaleSwitch
              value={siteLocale}
              onChange={setSiteLocale}
              ariaLabel="Site language"
              className="hidden lg:inline-flex"
            />
          ) : null}

          <a
            href={`tel:${brandContent.phoneHref}`}
            className="hidden items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-white/30 hover:bg-white/5 lg:flex"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
            {brandContent.phoneDisplay}
          </a>

          {isAuthenticated ? (
            <button
              onClick={async () => {
                await logout();
                closeMenu();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-white/30 hover:text-white"
              title={headerContent.signOutTitle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-3.472-3.472a.75.75 0 1 1 1.06-1.06l4.75 4.75a.75.75 0 0 1 0 1.06l-4.75 4.75a.75.75 0 1 1-1.06-1.06l3.472-3.472H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-white/30 hover:text-white"
              title={headerContent.signInTitle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-white/30 hover:text-white lg:hidden"
            aria-label={headerContent.menuAriaLabel}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-black/85 px-4 py-4 backdrop-blur lg:hidden">
          <nav className="container-page flex flex-col gap-2">
            {!isAdminPath ? (
              <div className="mb-1">
                <LocaleSwitch value={siteLocale} onChange={setSiteLocale} ariaLabel="Site language" />
              </div>
            ) : null}

            {headerContent.navLinks.map((item) => (
              <a
                key={item.to}
                href={item.to}
                onClick={(event) => handleHashNav(event, item.to)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <PrefetchLink
              to="/rent"
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
              onClick={closeMenu}
            >
              {headerContent.rentLabel}
            </PrefetchLink>
            <PrefetchLink
              to="/cases"
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
              onClick={closeMenu}
            >
              {headerContent.casesLabel}
            </PrefetchLink>
            <PrefetchLink
              to="/contacts"
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
              onClick={closeMenu}
            >
              {headerContent.contactsLabel}
            </PrefetchLink>
          </nav>
        </div>
      ) : null}

      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </header>
  );
};

export default Header;
