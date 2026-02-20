import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { PhoneIcon } from './icons/PhoneIcon';
import ThemeSwitcher from './ThemeSwitcher';
import LoginModal from './LoginModal';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/', label: 'Главная' },
  { to: '/led', label: 'Экраны' },
  { to: '/calculator', label: 'Калькулятор' },
  { to: '/support', label: 'Техсопровождение' },
  { to: '/rent', label: 'Аренда' },
  { to: '/cases', label: 'Кейсы' },
  { to: '/prices', label: 'Пакеты' },
  { to: '/contacts', label: 'Контакты' },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  // Закрываем меню при переходе
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b backdrop-blur" style={{ borderColor: 'var(--border-color)', background: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)' }}>
      <div className="container-page flex h-16 items-center justify-between gap-2 lg:gap-3">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold text-white" onClick={closeMenu}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white lg:h-10 lg:w-10">FS</div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-semibold lg:text-sm">Future Screen</div>
            <div className="hidden text-[10px] text-slate-300 lg:block">Экраны будущего</div>
          </div>
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 text-xs font-medium lg:flex lg:text-sm">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap px-1.5 py-1 transition hover:text-white lg:px-2 ${isActive ? 'text-white' : 'text-slate-300'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 text-sm lg:gap-2">
          <a
            className="hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs transition lg:flex lg:px-3"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            href="tel:+79122466566"
          >
            <PhoneIcon className="h-3.5 w-3.5 lg:h-4 lg:w-4" /> <span className="hidden lg:inline">+7 (912) 246-65-66</span><span className="lg:hidden">Позвонить</span>
          </a>
          <ThemeSwitcher />
          {/* Кнопка входа/выхода */}
          {isAuthenticated ? (
            <button
              onClick={async () => { await logout(); closeMenu(); }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:border-white/30 hover:text-white"
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
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:border-white/30 hover:text-white"
              title="Войти"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M14 10a.75.75 0 0 0-.75-.75H3.704l3.472 3.472a.75.75 0 1 1-1.06 1.06l-4.75-4.75a.75.75 0 0 1 0-1.06l4.75-4.75a.75.75 0 0 1 1.06 1.06L3.704 9.25h9.546A.75.75 0 0 0 14 10Z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {/* Бургер-кнопка (мобильная) */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:border-white/30 hover:text-white lg:hidden"
            aria-label="Меню"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5A.75.75 0 0 1 2.75 9h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75Zm0 5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {menuOpen && (
        <div className="border-t backdrop-blur lg:hidden" style={{ borderColor: 'var(--border-color)', background: 'color-mix(in srgb, var(--bg-primary) 95%, transparent)' }}>
          <nav className="container-page flex flex-col gap-2 px-2 py-4">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-brand-500/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 space-y-2 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
              <a
                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm transition"
                style={{ color: 'var(--text-secondary)' }}
                href="tel:+79122466566"
              >
                <PhoneIcon className="h-4 w-4" /> Позвонить
              </a>
            </div>
          </nav>
        </div>
      )}
      
      {/* Модальное окно входа */}
      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </header>
  );
};

export default Header;
