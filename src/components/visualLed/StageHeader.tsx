import { HardDriveDownload, RotateCcw } from 'lucide-react';
import ScenesTabs from './ScenesTabs';
import { useActiveScene, useVisualLed } from './state/VisualLedContext';

/**
 * Stage header — title + scene tabs + zoom/viewport tools + autosave badge.
 */
const StageHeader = () => {
  const scene = useActiveScene();
  const { dispatch, clearPersistence } = useVisualLed();

  const resetAll = () => {
    const ok = window.confirm(
      'Сбросить всю сессию? Удалит сохранённое в браузере и перезагрузит визуализатор.',
    );
    if (!ok) return;
    clearPersistence();
    window.location.reload();
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold tracking-tight text-white">
          Perspective Planner{' '}
          <span className="ml-1 rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-mono text-brand-200">
            v2
          </span>
        </div>
        <ScenesTabs />
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span
          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300"
          title="Автосохранение в localStorage каждые 800ms"
        >
          <HardDriveDownload className="h-3 w-3" />
          autosave
        </span>
        <span className="rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 font-mono">
          {scene.canvasWidth} × {scene.canvasHeight}
        </span>
        <button
          type="button"
          onClick={() => dispatch({ type: 'view/reset' })}
          className="rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 hover:border-white/30 hover:text-white"
          title="Сбросить масштаб и pan"
        >
          Сброс view
        </button>
        <span className="font-mono text-[11px]">zoom: {scene.view.scale.toFixed(2)}x</span>
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 text-slate-400 hover:border-red-400/40 hover:text-red-300"
          title="Стереть сохранённое состояние и начать с чистого листа"
        >
          <RotateCcw className="h-3 w-3" />
          Сброс сессии
        </button>
      </div>
    </header>
  );
};

export default StageHeader;
