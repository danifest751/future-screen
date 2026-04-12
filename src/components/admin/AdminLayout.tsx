import { useEffect, useState, type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  ChevronRight,
  ClipboardList,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Package,
  Palette,
  Phone,
  Settings,
  ShoppingCart,
  Tag,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { getAdminLayoutContent } from '../../content/components/adminLayout';
import LocaleSwitch from '../LocaleSwitch';
import { supabase } from '../../lib/supabase';
import type { Locale } from '../../i18n/types';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  contentLocale?: Locale;
  onContentLocaleChange?: (locale: Locale) => void;
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

const createDefaultNavItems = (content: ReturnType<typeof getAdminLayoutContent>): NavItem[] => [
  { to: '/admin', label: content.nav.dashboard, Icon: LayoutDashboard },
  { to: '/admin/leads', label: content.nav.leads, Icon: Inbox, badge: true },
  { to: '/admin/cases', label: content.nav.cases, Icon: FolderOpen },
  { to: '/admin/backgrounds', label: content.nav.backgrounds, Icon: Palette },
  { to: '/admin/packages', label: content.nav.packages, Icon: Package },
  { to: '/admin/categories', label: content.nav.categories, Icon: Tag },
  { to: '/admin/rental-categories', label: content.nav.rentalCategories, Icon: ShoppingCart },
  { to: '/admin/contacts', label: content.nav.contacts, Icon: Phone },
  { to: '/admin/content', label: content.nav.settings, Icon: Settings },
  { to: '/visual-led', label: content.nav.visualLed, Icon: Monitor },
  { to: '/admin/visual-led-logs', label: content.nav.visualLedLogs, Icon: ClipboardList },
];

const AdminLayout = ({ title, subtitle, children, contentLocale, onContentLocaleChange }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { adminLocale, setAdminLocale } = useI18n();
  const adminLayoutContent = getAdminLayoutContent(adminLocale);
  const defaultNavItems = createDefaultNavItems(adminLayoutContent);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leadCount, setLeadCount] = useState<number>(0);
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    const saved = localStorage.getItem('adminNavOrder');
    if (saved) {
      try {
        const parsed: { to: string }[] = JSON.parse(saved);
        const rehydrated = parsed
          .map((item) => defaultNavItems.find((defaultItem) => defaultItem.to === item.to))
          .filter((item): item is NavItem => Boolean(item));
        const savedKeys = rehydrated.map((item) => item.to);
        const extras = defaultNavItems.filter((item) => !savedKeys.includes(item.to));
        return [...rehydrated, ...extras];
      } catch {
        return defaultNavItems;
      }
    }
    return defaultNavItems;
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setNavItems((prev) => {
      const ordered = prev
        .map((item) => defaultNavItems.find((nextItem) => nextItem.to === item.to))
        .filter((item): item is NavItem => Boolean(item));
      const orderedKeys = ordered.map((item) => item.to);
      const extras = defaultNavItems.filter((item) => !orderedKeys.includes(item.to));
      return [...ordered, ...extras];
    });
  }, [adminLocale]);

  const activeNavItem = navItems.find((item) =>
    item.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.to),
  );

  const breadcrumbs: BreadcrumbItem[] = [
    { label: adminLayoutContent.breadcrumbs.admin, to: '/admin' },
    ...(activeNavItem ? [{ label: activeNavItem.label }] : []),
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    const loadLeadCount = async () => {
      const { count, error } = await supabase.from('leads').select('id', { count: 'exact', head: true });

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

  const handleDragStart = (event: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (event: React.DragEvent, dropIndex: number) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...navItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    setNavItems(newItems);
    localStorage.setItem('adminNavOrder', JSON.stringify(newItems.map((item) => ({ to: item.to }))));
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
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? adminLayoutContent.menu.close : adminLayoutContent.menu.open}
        aria-expanded={sidebarOpen}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-slate-800 text-white lg:hidden"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-white/10 bg-slate-800 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-white/10 px-6">
            <div className="flex items-center gap-3 text-white">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}
              >
                FS
              </div>
              <div>
                <div className="text-sm font-semibold leading-none">{adminLayoutContent.brand.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <Zap size={10} className="text-brand-400" />
                  {adminLayoutContent.brand.adminPanel}
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item, index) => {
              const isActive = item.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.to);
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              const { Icon } = item;

              return (
                <div
                  key={item.to}
                  draggable
                  onDragStart={(event) => handleDragStart(event, index)}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(event) => handleDrop(event, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative cursor-grab ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-800 rounded-lg' : ''}`}
                >
                  <Link
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive ? 'text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                    style={
                      isActive
                        ? {
                            background: 'linear-gradient(135deg, rgba(102,126,234,0.25) 0%, rgba(118,75,162,0.2) 100%)',
                            borderLeft: '2px solid #667eea',
                          }
                        : {}
                    }
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

          <div className="border-t border-white/10 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut size={16} className="text-slate-500" />
              <span>{adminLayoutContent.actions.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64">
        <div className="min-h-screen">
          <header className="border-b border-white/10 bg-slate-800/50 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-xl font-semibold text-white">{title}</h1>
                {breadcrumbs.length > 1 && (
                  <div className="mt-1 text-sm text-slate-400">
                    {breadcrumbs.map((breadcrumb, index) => (
                      <span key={`${breadcrumb.label}-${index}`}>
                        {index > 0 ? <span className="mx-2 text-slate-600">/</span> : null}
                        {breadcrumb.to ? (
                          <Link to={breadcrumb.to} className="hover:text-white">
                            {breadcrumb.label}
                          </Link>
                        ) : (
                          <span className="text-slate-200">{breadcrumb.label}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-medium text-white">{adminLayoutContent.profile.role}</div>
                  <div className="text-xs text-slate-400">
                    {new Date().toLocaleDateString(adminLocale === 'ru' ? 'ru-RU' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </div>
                </div>
                <div className="hidden items-end gap-3 md:flex">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {adminLayoutContent.locale.adminLabel}
                    </span>
                    <LocaleSwitch
                      value={adminLocale}
                      onChange={setAdminLocale}
                      ariaLabel={adminLayoutContent.locale.adminLabel}
                    />
                  </div>
                  {contentLocale && onContentLocaleChange ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {adminLayoutContent.locale.contentLabel}
                      </span>
                      <LocaleSwitch
                        value={contentLocale}
                        onChange={onContentLocaleChange}
                        ariaLabel={adminLayoutContent.locale.contentLabel}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 md:hidden">
                  <LocaleSwitch
                    value={adminLocale}
                    onChange={setAdminLocale}
                    ariaLabel={adminLayoutContent.locale.adminLabel}
                  />
                  {contentLocale && onContentLocaleChange ? (
                    <LocaleSwitch
                      value={contentLocale}
                      onChange={onContentLocaleChange}
                      ariaLabel={adminLayoutContent.locale.contentLabel}
                    />
                  ) : null}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                  A
                </div>
              </div>
            </div>
          </header>

          <div className="border-b border-white/10 bg-slate-900/40 px-6 py-3">
            <div className="flex items-center gap-3 overflow-x-auto text-xs text-slate-300">
              <span className="whitespace-nowrap text-slate-500">{adminLayoutContent.quickLinks.label}</span>
              {navItems.map((item) => {
                const isActive = item.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.to);
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

          <div className="p-6">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
