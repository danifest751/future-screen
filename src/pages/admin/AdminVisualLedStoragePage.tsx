import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Trash2, FileText, FolderOpen, Calendar, Hash, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/admin/ui/Button';
import ConfirmModal from '../../components/admin/ui/ConfirmModal';
import LoadingState from '../../components/admin/ui/LoadingState';
import EmptyState from '../../components/admin/ui/EmptyState';
import FilterPills from '../../components/admin/ui/FilterPills';
import {
  fetchSharedReports,
  deleteSharedReport,
  fetchSavedProjects,
  deleteSavedProject,
} from '../../services/visualLedConfig';

type Tab = 'projects' | 'reports';

const TABS = [
  { value: 'projects' as Tab, label: 'Проекты' },
  { value: 'reports' as Tab, label: 'Отчёты' },
];

// ── Projects tab ─────────────────────────────────────────────────────────────

const ProjectsTab = () => {
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['admin', 'vled-projects'],
    queryFn: fetchSavedProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavedProject,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'vled-projects'] });
      toast.success('Проект удалён');
      setConfirmId(null);
    },
    onError: () => toast.error('Не удалось удалить проект'),
  });

  if (isLoading) return <LoadingState />;
  if (!projects.length) return <EmptyState title="Сохранённых проектов нет" />;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">ID проекта</th>
              <th className="px-4 py-3">Создан</th>
              <th className="px-4 py-3 text-right">Сцен</th>
              <th className="px-4 py-3 text-right">Экранов</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {projects.map((p) => {
              const state = p.state as {
                scenes?: unknown[];
                [key: string]: unknown;
              };
              const sceneCount = Array.isArray(state.scenes) ? state.scenes.length : '—';
              const screenCount = Array.isArray(state.scenes)
                ? (state.scenes as Array<{ elements?: unknown[] }>).reduce(
                    (n, s) => n + (Array.isArray(s.elements) ? s.elements.length : 0),
                    0,
                  )
                : '—';

              return (
                <tr key={p.id} className="group bg-slate-950/30 transition hover:bg-slate-900/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FolderOpen size={14} className="shrink-0 text-brand-400" />
                      <span className="font-mono text-xs text-slate-300">{p.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar size={12} />
                      {new Date(p.created_at).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1 text-xs text-slate-300">
                      <Layers size={12} className="text-slate-500" />
                      {sceneCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-slate-300">{screenCount}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setConfirmId(p.id)}
                      className="rounded p-1.5 text-slate-500 opacity-0 transition hover:bg-red-500/20 hover:text-red-300 group-hover:opacity-100"
                      title="Удалить проект"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={confirmId !== null}
        title="Удалить проект?"
        description="Проект будет удалён безвозвратно. Ссылка перестанет работать."
        confirmText="Удалить"
        onConfirm={() => { if (confirmId) deleteMutation.mutate(confirmId); }}
        onCancel={() => setConfirmId(null)}
        danger
      />
    </>
  );
};

// ── Reports tab ───────────────────────────────────────────────────────────────

const REPORT_BASE_URL = '/report/';

const ReportsTab = () => {
  const qc = useQueryClient();
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin', 'vled-reports'],
    queryFn: fetchSharedReports,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSharedReport,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'vled-reports'] });
      toast.success('Отчёт удалён');
      setConfirmSlug(null);
    },
    onError: () => toast.error('Не удалось удалить отчёт'),
  });

  if (isLoading) return <LoadingState />;
  if (!reports.length) return <EmptyState title="Сохранённых отчётов нет" />;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Slug / ссылка</th>
              <th className="px-4 py-3">Создан</th>
              <th className="w-28 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {reports.map((r) => (
              <tr key={r.slug} className="group bg-slate-950/30 transition hover:bg-slate-900/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="shrink-0 text-emerald-400" />
                    <a
                      href={`${REPORT_BASE_URL}${r.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-xs text-brand-300 underline-offset-2 hover:underline"
                    >
                      <Hash size={11} className="text-slate-500" />
                      {r.slug}
                      <ExternalLink size={11} className="text-slate-500" />
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar size={12} />
                    {new Date(r.created_at).toLocaleString('ru-RU', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setConfirmSlug(r.slug)}
                    className="rounded p-1.5 text-slate-500 opacity-0 transition hover:bg-red-500/20 hover:text-red-300 group-hover:opacity-100"
                    title="Удалить отчёт"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={confirmSlug !== null}
        title="Удалить отчёт?"
        description="Отчёт будет удалён безвозвратно. Ссылка перестанет работать."
        confirmText="Удалить"
        onConfirm={() => { if (confirmSlug) deleteMutation.mutate(confirmSlug); }}
        onCancel={() => setConfirmSlug(null)}
        danger
      />
    </>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const AdminVisualLedStoragePage = () => {
  const [tab, setTab] = useState<Tab>('projects');

  return (
    <AdminLayout
      title="Хранилище визуализатора"
      subtitle="Сохранённые проекты (JSON-состояние) и общие HTML-отчёты"
    >
      <div className="space-y-5">
        <FilterPills
          pills={TABS}
          active={tab}
          onChange={(v) => setTab(v)}
        />

        {tab === 'projects' ? <ProjectsTab /> : <ReportsTab />}
      </div>
    </AdminLayout>
  );
};

export default AdminVisualLedStoragePage;
