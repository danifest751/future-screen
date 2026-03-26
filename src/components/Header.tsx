import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import LoginModal from './LoginModal';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/#about', label: 'О нас', hash: true },
  { to: '/#equipment', label: 'Оборудование', hash: true },
  { to: '/#services', label: 'Услуги', hash: true },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // After navigation to '/', scroll to the pending hash
  useEffect(() => {
    const pending = sessionStorage.getItem('scrollTo');
    if (pending && location.pathname === '/') {
      sessionStorage.removeItem('scrollTo');
      const tryScroll = (attempts = 0) => {
        const el = document.getElementById(pending);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else if (attempts < 10) {
          setTimeout(() => tryScroll(attempts + 1), 100);
        }
      };
      setTimeout(() => tryScroll(), 100);
    }
  }, [location.pathname]);

  const closeMenu = () => setMenuOpen(false);

  const handleHashNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const hash = href.split('#')[1];
    if (!hash) return;
    e.preventDefault();
    closeMenu();
    if (location.pathname === '/') {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      sessionStorage.setItem('scrollTo', hash);
      navigate('/');
    }
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(10, 10, 10, 0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
      }}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-3" onClick={closeMenu}>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white lg:h-11 lg:w-11"
            style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--glow)' }}
          >
            FS
          </div>
          <div className="min-w-0 leading-tight">
            <div className="font-display truncate text-[15px] font-semibold text-white lg:text-base">
              Фьючер Скрин
            </div>
            <div className="hidden text-[10px] text-gray-400 lg:block">
              Техсопровождение мероприятий
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((item) => (
            <a
              key={item.to}
              href={item.to}
              onClick={(e) => handleHashNav(e, item.to)}
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <NavLink
            to="/cases"
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/5 hover:text-white ${isActive ? 'text-white' : 'text-gray-300'}`
            }
          >
            Кейсы
          </NavLink>
          <NavLink
            to="/contacts"
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/5 hover:text-white ${isActive ? 'text-white' : 'text-gray-300'}`
            }
          >
            Контакты
          </NavLink>
        </nav>

        {/* Right controls */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Phone */}
          <a
            href="tel:+79122466566"
            className="hidden items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-white/30 hover:bg-white/5 lg:flex"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/>
            </svg>
            8 (912) 246-65-66
          </a>

          {/* Auth button */}
          {isAuthenticated ? (
            <button
              onClick={async () => { await logout(); closeMenu(); }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-white/30 hover:text-white"
              title="Выйти"
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
              title="Войти"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Burger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-white/30 hover:text-white lg:hidden"
            aria-label="Меню"
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

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="border-t lg:hidden"
          style={{
            background: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <nav className="container-page flex flex-col gap-1 py-4">
            {navLinks.map((item) => (
              <a
                key={item.to}
                href={item.to}
                onClick={(e) => handleHashNav(e, item.to)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <NavLink
              to="/cases"
              onClick={closeMenu}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/5 hover:text-white ${isActive ? 'text-white' : 'text-gray-300'}`
              }
            >
              Кейсы
            </NavLink>
            <NavLink
              to="/contacts"
              onClick={closeMenu}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/5 hover:text-white ${isActive ? 'text-white' : 'text-gray-300'}`
              }
            >
              Контакты
            </NavLink>
            <div className="mt-3 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <a
                href="tel:+79122466566"
                className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/>
                </svg>
                8 (912) 246-65-66
              </a>
            </div>
          </nav>
        </div>
      )}

      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </header>
  );
};

export default Header;
