import ScenesTabs from './ScenesTabs';
import { useActiveScene, useVisualLed } from './state/VisualLedContext';

/**
 * Stage header — title + scene tabs + zoom/viewport tools.
 * Phase 2 keeps zoom/viewport read-only (reset + display); phase 3 wires
 * up real interactions on the canvas.
 */
const StageHeader = () => {
  const scene = useActiveScene();
  const { dispatch } = useVisualLed();

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
        <span className="font-mono text-[11px]">
          zoom: {scene.view.scale.toFixed(2)}x
        </span>
      </div>
    </header>
  );
};

export default StageHeader;
