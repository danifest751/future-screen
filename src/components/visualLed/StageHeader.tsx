import { useEffect, useRef, useState } from 'react';
import {
  HardDriveDownload,
  Keyboard,
  MoreHorizontal,
  Redo2,
  RotateCcw,
  Undo2,
} from 'lucide-react';
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
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const resetAll = () => {
    const ok = window.confirm(
      'Сбросить всю сессию? Удалит сохранённое в браузере и перезагрузит визуализатор.',
    );
    if (!ok) return;
    clearPersistence();
    window.location.reload();
  };

  const resetView = () => {
    dispatch({ type: 'view/reset' });
    setMoreOpen(false);
  };

  // Close "more" menu on outside click. Esc closes it too — handled below.
  useEffect(() => {
    if (!moreOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [moreOpen]);

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
          Perspective Planner
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
        {/* Desktop-only: combined view readouts (canvas size + zoom). */}
        <span
          className="hidden rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 font-mono text-[11px] lg:inline-flex"
          title={`Размер канваса: ${scene.canvasWidth} × ${scene.canvasHeight}px · Зум: ${scene.view.scale.toFixed(2)}x`}
        >
          {scene.canvasWidth}×{scene.canvasHeight} · {scene.view.scale.toFixed(2)}x
        </span>
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
        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 hover:border-white/30 hover:text-white"
            title="Дополнительно"
            aria-label="Дополнительные действия"
            aria-expanded={moreOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {moreOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-md border border-white/10 bg-slate-900 text-xs shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={resetView}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-200 hover:bg-white/5 hover:text-white"
              >
                <RotateCcw className="h-3 w-3" />
                Сброс view
                <span className="ml-auto text-[10px] text-slate-500">zoom + pan</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMoreOpen(false);
                  resetAll();
                }}
                className="flex w-full items-center gap-2 border-t border-white/5 px-3 py-2 text-left text-slate-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <RotateCcw className="h-3 w-3" />
                Сброс сессии
                <span className="ml-auto text-[10px] text-slate-600">опасно</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default StageHeader;
