import { useState } from 'react';
import { ExternalLink, FileDown } from 'lucide-react';
import CollapsiblePanel from '../CollapsiblePanel';
import { runReportExport, type ExportScope } from '../reportExport';
import { useVisualLed } from '../state/VisualLedContext';

/**
 * Report export panel — download or open a standalone HTML with
 * per-screen metrics + canvas snapshot. Supports two scopes:
 *   - active: only the current scene (fast; uses the live canvas)
 *   - all: every scene (offscreen-rendered one-by-one)
 */
const ReportPanel = () => {
  const { state } = useVisualLed();
  const [scope, setScope] = useState<ExportScope>('active');
  const [busy, setBusy] = useState(false);

  const activeScene = state.scenes.find((s) => s.id === state.activeSceneId);
  const activeHasContent = activeScene ? activeScene.elements.length > 0 : false;
  const anyHasContent = state.scenes.some((s) => s.elements.length > 0);
  const canExport = scope === 'active' ? activeHasContent : anyHasContent;

  const run = async (action: 'download' | 'open') => {
    if (!canExport || busy) return;
    setBusy(true);
    try {
      await runReportExport(state.scenes, state.activeSceneId, scope, action);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CollapsiblePanel
      id="report"
      title="Отчёт"
      icon={<FileDown className="h-3 w-3" />}
      defaultOpen={false}
    >
      <label className="mb-2 block text-[11px] text-slate-300">
        Scope
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as ExportScope)}
          className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
        >
          <option value="active">Активная сцена</option>
          <option value="all">Все сцены ({state.scenes.length})</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={!canExport || busy}
          onClick={() => void run('download')}
          className="flex items-center justify-center gap-1 rounded-md bg-brand-500/80 px-2 py-1.5 text-xs font-semibold text-white transition duration-150 hover:bg-brand-500 active:translate-y-[1px] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileDown className="h-3 w-3" />
          {busy ? '…' : 'Скачать'}
        </button>
        <button
          type="button"
          disabled={!canExport || busy}
          onClick={() => void run('open')}
          className="flex items-center justify-center gap-1 rounded-md border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-white transition duration-150 hover:border-white/30 active:translate-y-[1px] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ExternalLink className="h-3 w-3" />
          Открыть
        </button>
      </div>

      <div className="mt-2 text-[10px] text-slate-500">
        {canExport
          ? scope === 'active'
            ? 'Активная сцена: снимок canvas + метрики экранов'
            : `Все сцены (${state.scenes.length}): offscreen-рендер каждой`
          : 'Добавь экран — отчёт появится'}
      </div>
    </CollapsiblePanel>
  );
};

export default ReportPanel;
