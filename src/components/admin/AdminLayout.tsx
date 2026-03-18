import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

type BreadcrumbItem = {
  label: string;
  to?: string;
};

const navItems = [
  { to: '/admin', label: 'Дашборд', icon: '📊' },
  { to: '/admin/leads', label: 'Заявки', icon: '📬', badge: true },
  { to: '/admin/cases', label: 'Кейсы', icon: '📁' },
  { to: '/admin/packages', label: 'Пакеты', icon: '📦' },
  { to: '/admin/categories', label: 'Категории', icon: '🗂️' },
  { to: '/admin/contacts', label: 'Контакты', icon: '📞' },
  { to: '/admin/calculator', label: 'Калькулятор', icon: '🧮' },
  { to: '/admin/content', label: 'Все настройки', icon: '⚙️' },
];

const AdminLayout = ({ title, subtitle, children }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leadCount, setLeadCount] = useState<number>(0);

  const activeNavItem = navItems.find((item) =>
    item.to === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(item.to),
  );

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Админ', to: '/admin' },
    ...(activeNavItem ? [{ label: activeNavItem.label }] : []),
  ];

  useEffect(() => {
    let mounted = true;

    const loadLeadCount = async () => {
      const { count, error } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true });

      if (!mounted) return;
      if (error) {
        setLeadCount(0);
        return;
      }
      setLeadCount(count ?? 0);
    };

    void loadLeadCount();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          className: 'bg-slate-800 text-white border border-white/10',
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
        }} 
      />
      {/* Мобильная кнопка меню */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={sidebarOpen}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-slate-800 text-white lg:hidden"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Overlay для мобильных */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Боковое меню */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-white/10 bg-slate-800 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div className="flex h-full flex-col">
          {/* Логотип */}
          <div className="flex h-16 items-center border-b border-white/10 px-6">
            <div className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold">
                FS
              </div>
              <div>
                <div className="text-sm font-semibold">Admin</div>
                <div className="text-xs text-slate-400">Future Screen</div>
              </div>
            </div>
          </div>

          {/* Навигация */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                item.to === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                     <>
                       {item.to === '/admin/leads' && leadCount > 0 ? (
                         <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold">
                           {leadCount}
                         </span>
                       ) : null}
                     </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Кнопка выхода */}
          <div className="border-t border-white/10 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span>🚪</span>
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="lg:ml-64">
        <div className="min-h-screen">
          {/* Заголовок страницы */}
          <header className="border-b border-white/10 bg-slate-800/50 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-xl font-semibold text-white">{title}</h1>
                {breadcrumbs.length > 1 && (
                  <div className="mt-1 text-sm text-slate-400">
                    {breadcrumbs.map((b, idx) => (
                      <span key={`${b.label}-${idx}`}>
                        {idx > 0 ? (
                          <span className="mx-2 text-slate-600">/</span>
                        ) : null}
                        {b.to ? (
                          <Link to={b.to} className="hover:text-white">
                            {b.label}
                          </Link>
                        ) : (
                          <span className="text-slate-200">{b.label}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {subtitle && (
                  <p className="text-sm text-slate-400">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-medium text-white">Admin</div>
                  <div className="text-xs text-slate-400">
                    {new Date().toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                  A
                </div>
              </div>
            </div>
          </header>

          <div className="border-b border-white/10 bg-slate-900/40 px-6 py-3">
            <div className="flex items-center gap-3 overflow-x-auto text-xs text-slate-300">
              <span className="whitespace-nowrap text-slate-500">Быстрый переход:</span>
              {navItems.map((item) => {
                const isActive =
                  item.to === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 transition ${
                      isActive
                        ? 'border-brand-500/50 bg-brand-500/10 text-white'
                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:text-white'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Контент */}
          <div className="p-6">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
