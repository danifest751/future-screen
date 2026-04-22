import { ExternalLink, FileDown } from 'lucide-react';
import { useActiveScene } from '../state/VisualLedContext';
import { runReportExport } from '../reportExport';

/**
 * Report export panel — download or open the current scene as a
 * standalone HTML with per-screen metrics + canvas snapshot.
 * "All scenes" scope is scheduled for phase 4f (requires scene-
 * iteration + re-render pass).
 */
const ReportPanel = () => {
  const scene = useActiveScene();
  const hasContent = scene.elements.length > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <h2 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <FileDown className="h-3 w-3" /> Отчёт
      </h2>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={!hasContent}
          onClick={() => runReportExport(scene, 'active', 'download')}
          className="flex items-center justify-center gap-1 rounded-md bg-brand-500/80 px-2 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileDown className="h-3 w-3" />
          Скачать
        </button>
        <button
          type="button"
          disabled={!hasContent}
          onClick={() => runReportExport(scene, 'active', 'open')}
          className="flex items-center justify-center gap-1 rounded-md border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-white hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ExternalLink className="h-3 w-3" />
          Открыть
        </button>
      </div>
      <div className="mt-2 text-[10px] text-slate-500">
        {hasContent
          ? 'Активная сцена с снимком canvas и метриками'
          : 'Добавь экран — отчёт появится'}
      </div>
    </div>
  );
};

export default ReportPanel;
