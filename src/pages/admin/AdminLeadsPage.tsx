import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

export type LeadLog = {
  id: string;
  timestamp: string;
  source: string;
  name: string;
  phone: string;
  email?: string;
  telegram?: string;
  city?: string;
  date?: string;
  format?: string;
  comment?: string;
  extra?: Record<string, string>;
  pagePath?: string;
  referrer?: string;
};

const STORAGE_KEY = 'fs_lead_logs';

const AdminLeadsPage = () => {
  const [logs, setLogs] = useState<LeadLog[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLogs(parsed);
      } catch (e) {
        console.error('Failed to parse lead logs', e);
      }
    }
  }, []);

  const clearLogs = () => {
    if (confirm('Вы уверены, что хотите очистить все записи?')) {
      localStorage.removeItem(STORAGE_KEY);
      setLogs([]);
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Дата', 'Время', 'Источник', 'Имя', 'Телефон', 'Email', 'Telegram', 'Город', 'Дата мероприятия', 'Формат', 'Комментарий'];
    const rows = logs.map((log) => [
      log.id,
      new Date(log.timestamp).toLocaleDateString('ru-RU'),
      new Date(log.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      log.source,
      log.name,
      log.phone,
      log.email || '',
      log.telegram || '',
      log.city || '',
      log.date || '',
      log.format || '',
      `"${(log.comment || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Уникальные источники для фильтра
  const sources = Array.from(new Set(logs.map((l) => l.source)));

  // Фильтрация
  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      filter === '' ||
      log.name.toLowerCase().includes(filter.toLowerCase()) ||
      log.phone.includes(filter) ||
      log.email?.toLowerCase().includes(filter.toLowerCase()) ||
      log.city?.toLowerCase().includes(filter.toLowerCase());

    const matchesSource = selectedSource === 'all' || log.source === selectedSource;

    return matchesFilter && matchesSource;
  });

  // Группировка по датам
  const logsByDate = filteredLogs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, LeadLog[]>);

  return (
    <AdminLayout title="Лента заявок" subtitle="Все отправленные КП и заявки с форм">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-slate-400">
          Всего заявок: <span className="text-white font-semibold">{logs.length}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/40"
          >
            📥 Экспорт CSV
          </button>
          <button
            type="button"
            onClick={exportLogs}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/40"
          >
            📥 Экспорт JSON
          </button>
          <button
            type="button"
            onClick={clearLogs}
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:border-red-500/60"
          >
            🗑 Очистить всё
          </button>
        </div>
      </div>

      {/* Фильтры */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-200">
            Поиск
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Имя, телефон, email, город..."
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="text-sm text-slate-200">
            Источник
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="all">Все источники</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Лента */}
        {filteredLogs.length === 0 ? (
          <div className="card text-center text-slate-400">
            {logs.length === 0
              ? 'Заявок пока нет. Заполните форму на сайте, чтобы увидеть первую запись.'
              : 'Ничего не найдено по заданным фильтрам.'}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(logsByDate).map(([date, dateLogs]) => (
              <div key={date}>
                <div className="mb-3 text-sm font-semibold text-slate-400">{date}</div>
                <div className="grid gap-4">
                  {dateLogs.map((log) => (
                    <LeadCard key={log.id} log={log} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </AdminLayout>
  );
};

const LeadCard = ({ log }: { log: LeadLog }) => {
  const time = new Date(log.timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="card border-l-4 border-l-brand-500">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-white">{log.name}</span>
            <span className="rounded bg-brand-500/10 px-2 py-0.5 text-xs text-brand-100">
              {log.source}
            </span>
          </div>
          <div className="text-xs text-slate-500">{time}</div>
        </div>
        {log.pagePath && (
          <a
            href={log.pagePath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white"
          >
            📄 Страница
          </a>
        )}
      </div>

      <div className="grid gap-2 text-sm md:grid-cols-2">
        <div>
          <span className="text-slate-400">Телефон:</span>{' '}
          <a href={`tel:${log.phone}`} className="text-white hover:text-brand-100">
            {log.phone}
          </a>
        </div>
        {log.email && (
          <div>
            <span className="text-slate-400">Email:</span>{' '}
            <a href={`mailto:${log.email}`} className="text-white hover:text-brand-100">
              {log.email}
            </a>
          </div>
        )}
        {log.telegram && (
          <div>
            <span className="text-slate-400">Telegram:</span>{' '}
            <span className="text-white">{log.telegram}</span>
          </div>
        )}
        {log.city && (
          <div>
            <span className="text-slate-400">Город:</span>{' '}
            <span className="text-white">{log.city}</span>
          </div>
        )}
        {log.date && (
          <div>
            <span className="text-slate-400">Дата:</span>{' '}
            <span className="text-white">{log.date}</span>
          </div>
        )}
        {log.format && (
          <div>
            <span className="text-slate-400">Формат:</span>{' '}
            <span className="text-white">{log.format}</span>
          </div>
        )}
      </div>

      {log.extra && Object.keys(log.extra).length > 0 && (
        <div className="mt-3 rounded-lg bg-white/5 p-3">
          <div className="mb-2 text-xs font-semibold text-slate-400">Детали расчёта:</div>
          <div className="grid gap-1 text-xs md:grid-cols-2">
            {Object.entries(log.extra).map(([key, value]) => (
              <div key={key}>
                <span className="text-slate-500">{key}:</span>{' '}
                <span className="text-slate-300">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {log.comment && (
        <div className="mt-3 rounded-lg bg-white/5 p-3 text-sm">
          <span className="text-slate-400">Комментарий:</span>{' '}
          <span className="text-slate-300">{log.comment}</span>
        </div>
      )}
    </div>
  );
};

export default AdminLeadsPage;
