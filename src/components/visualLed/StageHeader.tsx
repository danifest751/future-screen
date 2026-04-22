import { useEffect } from 'react';
import { HardDriveDownload, Keyboard, Redo2, RotateCcw, Undo2 } from 'lucide-react';
import ScenesTabs from './ScenesTabs';
import { useActiveScene, useVisualLed } from './state/VisualLedContext';

interface StageHeaderProps {
  onOpenShortcuts: () => void;
}

/**
 * Stage header — title + scene tabs + zoom/viewport tools + undo/redo
 * + autosave badge. Also owns the global Ctrl+Z / Ctrl+Shift+Z / ? key
 * bindings so they live next to the buttons they drive.
 */
const StageHeader = ({ onOpenShortcuts }: StageHeaderProps) => {
  const scene = useActiveScene();
  const { dispatch, clearPersistence, canUndo, canRedo } = useVisualLed();

  const resetAll = () => {
    const ok = window.confirm(
      'Сбросить всю сессию? Удалит сохранённое в браузере и перезагрузит визуализатор.',
    );
    if (!ok) return;
    clearPersistence();
    window.location.reload();
  };

  // Global keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z / Cmd+Z / Cmd+Shift+Z / "?"
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea';

      // "?" shortcut — open cheat sheet. Skip when typing.
      if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && e.key === '?') {
        e.preventDefault();
        onOpenShortcuts();
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      if (typing) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'history/undo' });
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        dispatch({ type: 'history/redo' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, onOpenShortcuts]);

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
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => dispatch({ type: 'history/undo' })}
            disabled={!canUndo}
            className="rounded-md border border-white/10 bg-slate-900/60 p-1 hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            title="Отменить (Ctrl+Z)"
            aria-label="Отменить последнее действие"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'history/redo' })}
            disabled={!canRedo}
            className="rounded-md border border-white/10 bg-slate-900/60 p-1 hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            title="Повторить (Ctrl+Shift+Z)"
            aria-label="Повторить отменённое действие"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>
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
          onClick={onOpenShortcuts}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 hover:border-white/30 hover:text-white"
          title="Показать горячие клавиши (?)"
          aria-label="Показать горячие клавиши"
        >
          <Keyboard className="h-3 w-3" />
          ?
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 text-slate-400 hover:border-red-400/40 hover:text-red-300"
          title="Стереть сохранённое состояние и начать с чистого листа"
          aria-label="Сбросить всю сессию"
        >
          <RotateCcw className="h-3 w-3" />
          Сброс сессии
        </button>
      </div>
    </header>
  );
};

export default StageHeader;
