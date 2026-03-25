import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';
import { useLeads } from '../../hooks/useLeads';
import type { LeadLog } from '../../types/leads';
import { ConfirmModal, EmptyState, Input, LoadingState } from '../../components/admin/ui';

const AdminLeadsPage = () => {
  const { leads: logs, loading, error: leadsError, clearLeads } = useLeads();
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState(filter);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearSubmitting, setClearSubmitting] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedFilter(filter);
    }, 250);
    return () => {
      window.clearTimeout(t);
    };
  }, [filter]);

  const handleClearConfirm = async () => {
    setClearSubmitting(true);
    try {
      const ok = await clearLeads();
      if (ok) toast.success('Все заявки удалены');
      else toast.error('Не удалось удалить заявки');
    } finally {
      setClearSubmitting(false);
    }
  };

  const resetFilters = () => {
    setFilter('');
    setSelectedSource('all');
    setDebouncedFilter('');
  };

  const exportLogs = () => {
    try {
      const dataStr = JSON.stringify(logs, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Заявки экспортированы в JSON');
    } catch (e) {
      toast.error('Ошибка при экспорте');
    }
  };

  const exportCSV = () => {
    try {
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
      toast.success('Заявки экспортированы в CSV');
    } catch (e) {
      toast.error('Ошибка при экспорте');
    }
  };

  // Уникальные источники для фильтра
  const sources = Array.from(new Set(logs.map((l) => l.source)));

  // Фильтрация
  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const q = debouncedFilter.trim();
        const matchesFilter =
          q === '' ||
          log.name.toLowerCase().includes(q.toLowerCase()) ||
          log.phone.includes(q) ||
          log.email?.toLowerCase().includes(q.toLowerCase()) ||
          log.city?.toLowerCase().includes(q.toLowerCase());

        const matchesSource = selectedSource === 'all' || log.source === selectedSource;

        return matchesFilter && matchesSource;
      }),
    [debouncedFilter, logs, selectedSource]
  );

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
      <ConfirmModal
        open={clearModalOpen}
        danger
        title="Очистить все заявки?"
        description="Удалим все записи из базы. Операцию нельзя отменить."
        confirmText="Очистить"
        cancelText="Отмена"
        confirmDisabled={clearSubmitting}
        onCancel={() => setClearModalOpen(false)}
        onConfirm={() => handleClearConfirm()}
      />

      {loading && <div className="mb-4"><LoadingState title="Загрузка заявок" description="Пожалуйста, подождите" /></div>}
      {leadsError && <div className="mb-4 text-sm text-red-400">Ошибка: {leadsError}</div>}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-slate-400">
          Показано: <span className="font-semibold text-white">{filteredLogs.length}</span> из{' '}
          <span className="font-semibold text-white">{logs.length}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/40"
          >
            Экспорт CSV
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
            onClick={() => setClearModalOpen(true)}
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:border-red-500/60"
          >
            Очистить всё
          </button>
        </div>
      </div>

      {/* Фильтры */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {filter.trim() && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Поиск: {filter.trim()}</span>}
          {selectedSource !== 'all' && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Источник: {selectedSource}</span>
          )}
          {(filter.trim() || selectedSource !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300 hover:text-white"
            >
              Сбросить фильтры
            </button>
          )}
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-200">
            Поиск
            <Input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Имя, телефон, email, город..."
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
          <EmptyState
            icon="🔎"
            title={logs.length === 0 ? 'Заявок пока нет' : 'Ничего не найдено'}
            description={
              logs.length === 0
                ? 'Заполните форму на сайте, чтобы увидеть первую запись.'
                : 'Попробуйте изменить поиск или выбрать другой источник.'
            }
          />
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
