import { useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useLeads } from '../../hooks/useLeads';
import { Inbox, CalendarDays, BarChart3, PhoneCall } from 'lucide-react';

const AdminDashboard = () => {
  const { leads: logs, loading, error } = useLeads();

  // Статистика
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayLogs = logs.filter((l) => new Date(l.timestamp) >= today);
    const weekLogs = logs.filter((l) => new Date(l.timestamp) >= weekAgo);
    const monthLogs = logs.filter((l) => new Date(l.timestamp) >= monthAgo);

    // Статистика по источникам
    const bySource = logs.reduce((acc, log) => {
      acc[log.source] = (acc[log.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Статистика по городам
    const byCity = logs
      .filter((l) => l.city)
      .reduce((acc, log) => {
        acc[log.city!] = (acc[log.city!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    // С контактами (email или telegram)
    const withContacts = logs.filter((l) => l.email || l.telegram).length;

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

  // Последние заявки
  const recentLogs = useMemo(() => {
    return [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10);
  }, [logs]);

  return (
    <AdminLayout title="Дашборд" subtitle="Обзор активности и статистика">
      <div className="space-y-6">
        {loading && <div className="text-sm text-slate-400">Загрузка аналитики...</div>}
        {error && <div className="text-sm text-red-400">Ошибка загрузки заявок: {error}</div>}

        {/* Карточки статистики */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Всего заявок"
            value={stats.total}
            Icon={Inbox}
            trend={stats.today > 0 ? `+${stats.today} сегодня` : 'Нет новых'}
            trendColor={stats.today > 0 ? 'text-emerald-400' : 'text-slate-400'}
          />
          <StatCard
            title="За неделю"
            value={stats.week}
            Icon={CalendarDays}
            trend={`${stats.today} за сегодня`}
            trendColor="text-blue-400"
          />
          <StatCard
            title="За месяц"
            value={stats.month}
            Icon={BarChart3}
            trend={`${stats.withContacts} с контактами`}
            trendColor="text-purple-400"
          />
          <StatCard
            title="Конверсия"
            value={`${stats.contactRate}%`}
            Icon={PhoneCall}
            trend={`${stats.withContacts} из ${stats.total}`}
            trendColor={stats.contactRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Источники */}
          <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Источники заявок</h3>
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
                      <span className="w-12 text-right text-sm font-medium text-white">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              {Object.keys(stats.bySource).length === 0 && (
                <div className="text-center text-slate-400">Пока нет данных</div>
              )}
            </div>
          </div>

          {/* Города */}
          <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Города</h3>
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
                <div className="text-center text-slate-400">Пока нет данных</div>
              )}
            </div>
          </div>
        </div>

        {/* Последние заявки */}
        <div className="rounded-xl border border-white/10 bg-slate-800">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white">Последние заявки</h3>
            <a
              href="/admin/leads"
              className="text-sm font-medium text-brand-400 hover:text-brand-300"
            >
              Все заявки →
            </a>
          </div>
          <div className="divide-y divide-white/10">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-4 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{log.name}</span>
                    <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      {log.source.split(' (')[0]}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    {log.phone}
                    {log.email && <span className="ml-2">· {log.email}</span>}
                    {log.city && <span className="ml-2">· {log.city}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">
                    {new Date(log.timestamp).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                Заявок пока нет. Заполните форму на сайте, чтобы увидеть первую запись.
              </div>
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
  Icon: React.ComponentType<{ size?: number; className?: string }>;
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
        style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.15) 100%)', border: '1px solid rgba(102,126,234,0.2)' }}
      >
        <Icon size={22} className="text-brand-400" />
      </div>
    </div>
    <div className={`mt-3 text-sm ${trendColor}`}>{trend}</div>
  </div>
);

export default AdminDashboard;
