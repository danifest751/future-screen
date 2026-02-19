import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const navItems = [
  { to: '/admin', label: 'Дашборд', icon: '📊' },
  { to: '/admin/leads', label: 'Заявки', icon: '📬', badge: true },
  { to: '/admin/cases', label: 'Кейсы', icon: '📁' },
  { to: '/admin/content', label: 'Настройки', icon: '⚙️' },
];

const AdminLayout = ({ title, subtitle, children }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Мобильная кнопка меню */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
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
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold">
                      {item.to === '/admin/leads' ? (
                        (() => {
                          const logs = localStorage.getItem('fs_lead_logs');
                          const count = logs ? JSON.parse(logs).length : 0;
                          return count > 0 ? count : null;
                        })()
                      ) : null}
                    </span>
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

          {/* Контент */}
          <div className="p-6">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
