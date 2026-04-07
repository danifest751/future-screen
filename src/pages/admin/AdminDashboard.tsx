import { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Inbox, PhoneCall, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { ConfirmModal } from '../../components/admin/ui';
import { useI18n } from '../../context/I18nContext';
import { getAdminDashboardContent } from '../../content/pages/adminDashboard';
import { useLeads } from '../../hooks/useLeads';
import type { LeadLog } from '../../types/leads';

const AdminDashboard = () => {
  const { adminLocale } = useI18n();
  const adminDashboardContent = getAdminDashboardContent(adminLocale);
  const localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';
  const { leads: logs, loading, error, deleteLead } = useLeads();
  const [deleteTarget, setDeleteTarget] = useState<LeadLog | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const deleteCopy = adminLocale === 'ru'
    ? {
        title: 'Удалить заявку?',
        description: (name: string) => `Заявка «${name}» будет удалена без возможности восстановления.`,
        action: 'Удалить',
        success: 'Заявка удалена',
        error: 'Не удалось удалить заявку',
      }
    : {
        title: 'Delete lead?',
        description: (name: string) => `Lead "${name}" will be permanently deleted.`,
        action: 'Delete',
        success: 'Lead deleted',
        error: 'Failed to delete lead',
      };

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayLogs = logs.filter((item) => new Date(item.timestamp) >= today);
    const weekLogs = logs.filter((item) => new Date(item.timestamp) >= weekAgo);
    const monthLogs = logs.filter((item) => new Date(item.timestamp) >= monthAgo);

    const bySource = logs.reduce((acc, log) => {
      acc[log.source] = (acc[log.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCity = logs
      .filter((item) => item.city)
      .reduce((acc, log) => {
        acc[log.city!] = (acc[log.city!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const withContacts = logs.filter((item) => item.email || item.telegram).length;

    return {
      total: logs.length,
      today: todayLogs.length,
      week: weekLogs.length,
      month: monthLogs.length,
      withContacts,
      contactRate: logs.length > 0 ? Math.round((withContacts / logs.length) * 100) : 0,
      bySource,
      byCity,
      topCities: Object.entries(byCity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  }, [logs]);

  const sourceEntries = Object.entries(stats.bySource) as Array<[string, number]>;

  const recentLogs = useMemo(() => {
    return [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10);
  }, [logs]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      const ok = await deleteLead(deleteTarget.id);
      if (ok) {
        toast.success(deleteCopy.success);
        setDeleteTarget(null);
      } else {
        toast.error(deleteCopy.error);
      }
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title={adminDashboardContent.layout.title}
      subtitle={adminDashboardContent.layout.subtitle}
    >
      <ConfirmModal
        open={Boolean(deleteTarget)}
        danger
        title={deleteCopy.title}
        description={deleteTarget ? deleteCopy.description(deleteTarget.name) : ''}
        confirmText={deleteCopy.action}
        cancelText={adminLocale === 'ru' ? 'Отмена' : 'Cancel'}
        confirmDisabled={deleteSubmitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <div className="space-y-6">
        {loading && <div className="text-sm text-slate-400">{adminDashboardContent.state.loading}</div>}
        {error && (
          <div className="text-sm text-red-400">
            {adminDashboardContent.state.errorPrefix} {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={adminDashboardContent.stats.total}
            value={stats.total}
            Icon={Inbox}
            trend={
              stats.today > 0
                ? `+${stats.today} ${adminDashboardContent.stats.todaySuffix}`
                : adminDashboardContent.stats.noNew
            }
            trendColor={stats.today > 0 ? 'text-emerald-400' : 'text-slate-400'}
          />
          <StatCard
            title={adminDashboardContent.stats.week}
            value={stats.week}
            Icon={CalendarDays}
            trend={`${stats.today} ${adminDashboardContent.stats.todaySuffix}`}
            trendColor="text-blue-400"
          />
          <StatCard
            title={adminDashboardContent.stats.month}
            value={stats.month}
            Icon={BarChart3}
            trend={`${stats.withContacts} ${adminDashboardContent.stats.withContactsSuffix}`}
            trendColor="text-purple-400"
          />
          <StatCard
            title={adminDashboardContent.stats.conversion}
            value={`${stats.contactRate}%`}
            Icon={PhoneCall}
            trend={adminDashboardContent.stats.fromTotal(stats.withContacts, stats.total)}
            trendColor={stats.contactRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">{adminDashboardContent.sections.sources}</h3>
            <div className="space-y-3">
              {sourceEntries
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{source}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 rounded-full bg-slate-700">
                        <div
                          className="h-2 rounded-full bg-brand-500"
                          style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm font-medium text-white">{count}</span>
                    </div>
                  </div>
                ))}
              {Object.keys(stats.bySource).length === 0 && (
                <div className="text-center text-slate-400">{adminDashboardContent.sections.noData}</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">{adminDashboardContent.sections.cities}</h3>
            <div className="space-y-3">
              {stats.topCities.map(([city, count], index) => (
                <div key={city} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <span className="text-sm text-slate-300">{city}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{count}</span>
                </div>
              ))}
              {stats.topCities.length === 0 && (
                <div className="text-center text-slate-400">{adminDashboardContent.sections.noData}</div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white">{adminDashboardContent.sections.recentLeads}</h3>
            <a href="/admin/leads" className="text-sm font-medium text-brand-400 hover:text-brand-300">
              {adminDashboardContent.sections.allLeads}
            </a>
          </div>
          <div className="divide-y divide-white/10">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-white">{log.name}</span>
                    <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      {log.source.split(' (')[0]}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-400">
                    {log.phone}
                    {log.email && <span className="ml-2">{adminDashboardContent.lead.separator} {log.email}</span>}
                    {log.city && <span className="ml-2">{adminDashboardContent.lead.separator} {log.city}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">
                    {new Date(log.timestamp).toLocaleDateString(localeTag, {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString(localeTag, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(log)}
                  title={deleteCopy.action}
                  className="inline-flex items-center rounded-lg border border-red-400/30 bg-red-500/10 px-2 py-1.5 text-red-100 hover:border-red-400/60"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <div className="p-8 text-center text-slate-400">{adminDashboardContent.sections.emptyRecent}</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const StatCard = ({
  title,
  value,
  Icon,
  trend,
  trendColor,
}: {
  title: string;
  value: number | string;
  Icon: LucideIcon;
  trend: string;
  trendColor: string;
}) => (
  <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-slate-400">{title}</div>
        <div className="mt-1 text-3xl font-bold text-white">{value}</div>
      </div>
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.15) 100%)',
          border: '1px solid rgba(102,126,234,0.2)',
        }}
      >
        <Icon size={22} className="text-brand-400" />
      </div>
    </div>
    <div className={`mt-3 text-sm ${trendColor}`}>{trend}</div>
  </div>
);

export default AdminDashboard;
