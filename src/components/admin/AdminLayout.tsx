import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  ClipboardList,
  ExternalLink,
  FolderOpen,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Package,
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
  external?: boolean;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const createNavSections = (content: ReturnType<typeof getAdminLayoutContent>): NavSection[] => [
  {
    id: 'main',
    label: content.navGroups.main,
    items: [
      { to: '/admin', label: content.nav.dashboard, Icon: LayoutDashboard },
      { to: '/admin/leads', label: content.nav.leads, Icon: Inbox, badge: true },
    ],
  },
  {
    id: 'content',
    label: content.navGroups.content,
    items: [
      { to: '/admin/content', label: content.nav.settings, Icon: Settings },
      { to: '/admin/content/history', label: content.nav.contentHistory, Icon: History },
      { to: '/admin/contacts', label: content.nav.contacts, Icon: Phone },
    ],
  },
  {
    id: 'catalog',
    label: content.navGroups.catalog,
    items: [
      { to: '/admin/cases', label: content.nav.cases, Icon: FolderOpen },
      { to: '/admin/packages', label: content.nav.packages, Icon: Package },
      { to: '/admin/categories', label: content.nav.categories, Icon: Tag },
      { to: '/admin/rental-categories', label: content.nav.rentalCategories, Icon: ShoppingCart },
    ],
  },
  {
    id: 'visualizers',
    label: content.navGroups.visualizers,
    items: [
      { to: '/visual-led', label: content.nav.visualLed, Icon: Monitor, external: true },
      { to: '/admin/visual-led-logs', label: content.nav.visualLedLogs, Icon: ClipboardList },
    ],
  },
];

const AdminLayout = ({ title, subtitle, children, contentLocale, onContentLocaleChange }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { adminLocale, setAdminLocale } = useI18n();
  const adminLayoutContent = getAdminLayoutContent(adminLocale);
  const navSections = useMemo(() => createNavSections(adminLayoutContent), [adminLayoutContent]);
  const navItems = useMemo(() => navSections.flatMap((section) => section.items), [navSections]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leadCount, setLeadCount] = useState<number>(0);

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
      const { count, error } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null);

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
    <div className="admin-shell min-h-screen bg-[#f4f7fb] text-slate-950">
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'border border-slate-200 bg-white text-slate-950 shadow-lg',
          success: { iconTheme: { primary: '#059669', secondary: 'white' } },
          error: { iconTheme: { primary: '#dc2626', secondary: 'white' } },
        }}
      />
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? adminLayoutContent.menu.close : adminLayoutContent.menu.open}
        aria-expanded={sidebarOpen}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm lg:hidden"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-[280px] transform border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                FS
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold leading-none text-slate-950">{adminLayoutContent.brand.name}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Zap size={12} className="text-amber-500" />
                  {adminLayoutContent.brand.adminPanel}
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
            {navSections.map((section) => (
              <div key={section.id}>
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase text-slate-400">
                  {section.label}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = item.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.to);
                    const { Icon } = item;

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? 'bg-slate-950 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <div className="ml-2 flex items-center gap-2">
                          {item.badge && item.to === '/admin/leads' && leadCount > 0 && (
                            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                              {leadCount}
                            </span>
                          )}
                          {item.external && <ExternalLink size={13} className={isActive ? 'text-white/70' : 'text-slate-400'} />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <LogOut size={16} className="text-slate-400" />
              <span>{adminLayoutContent.actions.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-[280px]">
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white">
            <div className="flex min-h-20 flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between lg:px-8">
              <div className="min-w-0">
                {breadcrumbs.length > 1 && (
                  <div className="mb-2 text-xs text-slate-500">
                    {breadcrumbs.map((breadcrumb, index) => (
                      <span key={`${breadcrumb.label}-${index}`}>
                        {index > 0 ? <span className="mx-2 text-slate-300">/</span> : null}
                        {breadcrumb.to ? (
                          <Link to={breadcrumb.to} className="hover:text-slate-950">
                            {breadcrumb.label}
                          </Link>
                        ) : (
                          <span className="text-slate-700">{breadcrumb.label}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
                {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitle}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-medium text-slate-900">{adminLayoutContent.profile.role}</div>
                  <div className="text-xs text-slate-500">
                    {new Date().toLocaleDateString(adminLocale === 'ru' ? 'ru-RU' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">
                      {adminLayoutContent.locale.adminLabel}
                    </span>
                    <LocaleSwitch
                      value={adminLocale}
                      onChange={setAdminLocale}
                      ariaLabel={adminLayoutContent.locale.adminLabel}
                    />
                  </div>
                  {contentLocale && onContentLocaleChange ? (
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
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
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                  A
                </div>
              </div>
            </div>
          </header>

          <div className="border-b border-slate-200 bg-white/70 px-5 py-3 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto text-xs text-slate-500">
              <span className="whitespace-nowrap font-medium">{adminLayoutContent.quickLinks.label}</span>
              {navItems.slice(0, 7).map((item) => {
                const isActive = item.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.to);
                const { Icon } = item;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 transition ${
                      isActive
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:text-slate-950'
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

          <div className="px-5 py-6 lg:px-8">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
