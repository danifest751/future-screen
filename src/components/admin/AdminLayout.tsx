import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import {
  BACKGROUND_CHANGED_EVENT,
  BACKGROUND_SETTINGS_CHANGED_EVENT,
  isCustomBackgroundId,
  backgroundOptions,
  backgroundSettingsControls,
  getStoredBackgroundSettingsMap,
  patchStoredBackgroundSettings,
  getStoredBackground,
  setStoredBackground,
  type AnyBackgroundSettings,
  type BackgroundSettingsById,
  type BackgroundId,
} from '../../lib/backgrounds';
import {
  LayoutDashboard,
  Inbox,
  FolderOpen,
  Package,
  Tag,
  Phone,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type NavItem = {
  to: string;
  label: string;
  Icon: LucideIcon;
  badge?: boolean;
};

const defaultNavItems: NavItem[] = [
  { to: '/admin', label: 'Дашборд', Icon: LayoutDashboard },
  { to: '/admin/leads', label: 'Заявки', Icon: Inbox, badge: true },
  { to: '/admin/cases', label: 'Кейсы', Icon: FolderOpen },
  { to: '/admin/packages', label: 'Пакеты', Icon: Package },
  { to: '/admin/categories', label: 'Категории', Icon: Tag },
  { to: '/admin/contacts', label: 'Контакты', Icon: Phone },
  { to: '/admin/content', label: 'Настройки', Icon: Settings },
];

const AdminLayout = ({ title, subtitle, children }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [background, setBackground] = useState<BackgroundId>(() => getStoredBackground());
  const [backgroundSettingsMap, setBackgroundSettingsMap] = useState<BackgroundSettingsById>(() => getStoredBackgroundSettingsMap());
  const [leadCount, setLeadCount] = useState<number>(0);
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    const saved = localStorage.getItem('adminNavOrder');
    if (saved) {
      try {
        const parsed: { to: string }[] = JSON.parse(saved);
        // Merge with defaults to restore Icon references (not serializable)
        const rehydrated = parsed
          .map((p) => defaultNavItems.find((d) => d.to === p.to))
          .filter((x): x is NavItem => Boolean(x));
        const savedKeys = rehydrated.map((i) => i.to);
        const extras = defaultNavItems.filter((d) => !savedKeys.includes(d.to));
        return [...rehydrated, ...extras];
      } catch {
        return defaultNavItems;
      }
    }
    return defaultNavItems;
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  useEffect(() => {
    const syncBackground = () => {
      setBackground(getStoredBackground());
    };

    const syncBackgroundSettings = () => {
      setBackgroundSettingsMap(getStoredBackgroundSettingsMap());
    };

    window.addEventListener('storage', syncBackground);
    window.addEventListener('storage', syncBackgroundSettings);
    window.addEventListener(BACKGROUND_CHANGED_EVENT, syncBackground as EventListener);
    window.addEventListener(BACKGROUND_SETTINGS_CHANGED_EVENT, syncBackgroundSettings as EventListener);
    return () => {
      window.removeEventListener('storage', syncBackground);
      window.removeEventListener('storage', syncBackgroundSettings);
      window.removeEventListener(BACKGROUND_CHANGED_EVENT, syncBackground as EventListener);
      window.removeEventListener(BACKGROUND_SETTINGS_CHANGED_EVENT, syncBackgroundSettings as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...navItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    setNavItems(newItems);
    // Only persist the `to` keys — Icons are not serializable
    localStorage.setItem('adminNavOrder', JSON.stringify(newItems.map((i) => ({ to: i.to }))));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="min-h-screen bg-transparent">
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
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
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
            <div className="flex items-center gap-3 text-white">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}
              >
                FS
              </div>
              <div>
                <div className="text-sm font-semibold leading-none">Future Screen</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <Zap size={10} className="text-brand-400" />
                  Панель управления
                </div>
              </div>
            </div>
          </div>

          {/* Навигация */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item, index) => {
              const isActive =
                item.to === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.to);
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              const { Icon } = item;

              return (
                <div
                  key={item.to}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative cursor-grab ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-800 rounded-lg' : ''}`}
                >
                  <Link
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                    style={isActive ? { background: 'linear-gradient(135deg, rgba(102,126,234,0.25) 0%, rgba(118,75,162,0.2) 100%)', borderLeft: '2px solid #667eea' } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.to === '/admin/leads' && leadCount > 0 && (
                      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                        {leadCount}
                      </span>
                    )}
                    {isActive && <ChevronRight size={14} className="ml-auto text-brand-400" />}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Кнопка выхода */}
          <div className="border-t border-white/10 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut size={16} className="text-slate-500" />
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
                <div className="hidden min-w-[320px] md:block">
                  <label htmlFor="admin-background" className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
                    Фон сайта
                  </label>
                  <select
                    id="admin-background"
                    value={background}
                    onChange={(e) => {
                      const nextBackground = e.target.value as BackgroundId;
                      setBackground(nextBackground);
                      setStoredBackground(nextBackground);
                    }}
                    className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none transition focus:border-brand-400"
                  >
                    {backgroundOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  {isCustomBackgroundId(background) ? (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <label className="col-span-2">
                        Анимация
                        <select
                          value={backgroundSettingsMap[background].motion}
                          onChange={(e) => {
                            const motion = e.target.value as BackgroundSettingsById[typeof background]['motion'];
                            setBackgroundSettingsMap((prev) => ({
                              ...prev,
                              [background]: { ...prev[background], motion },
                            }));
                            patchStoredBackgroundSettings(background, { motion });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 outline-none transition focus:border-brand-400"
                        >
                          <option value="slow">Медленно</option>
                          <option value="normal">Нормально</option>
                          <option value="fast">Быстро</option>
                        </select>
                      </label>

                      {backgroundSettingsControls[background].map((control) => {
                        const value = Number(backgroundSettingsMap[background][control.key as keyof AnyBackgroundSettings]);
                        return (
                          <label key={control.key} className="col-span-2">
                            {control.label}: {value.toFixed(control.step >= 1 ? 0 : control.step >= 0.1 ? 1 : 2)}
                            <input
                              type="range"
                              min={control.min}
                              max={control.max}
                              step={control.step}
                              value={value}
                              onChange={(e) => {
                                const numericValue = Number(e.target.value);
                                const patch = { [control.key]: numericValue } as Partial<AnyBackgroundSettings>;
                                setBackgroundSettingsMap((prev) => ({
                                  ...prev,
                                  [background]: {
                                    ...prev[background],
                                    [control.key]: numericValue,
                                  },
                                }));
                                patchStoredBackgroundSettings(background, patch);
                              }}
                              className="mt-1 w-full accent-brand-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
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
                const { Icon } = item;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 transition ${
                      isActive
                        ? 'border-brand-500/50 bg-brand-500/10 text-white'
                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:text-white'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={12} />
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
