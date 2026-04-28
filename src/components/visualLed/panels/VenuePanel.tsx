import { useState } from 'react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import CollapsiblePanel from '../CollapsiblePanel';
import { useActiveScene, useVisualLed } from '../state/VisualLedContext';
import { uid } from '../state/initialState';

const VenuePanel = () => {
  const scene = useActiveScene();
  const { dispatch } = useVisualLed();
  const venue = scene.venue;

  const [widthDraft, setWidthDraft] = useState('10');
  const [depthDraft, setDepthDraft] = useState('8');
  const [heightDraft, setHeightDraft] = useState('3.5');

  const createVenue = () => {
    const w = Number(widthDraft);
    const d = Number(depthDraft);
    const h = Number(heightDraft);
    if (!Number.isFinite(w) || w <= 0) return;
    if (!Number.isFinite(d) || d <= 0) return;
    if (!Number.isFinite(h) || h <= 0) return;

    const venue = {
      width: w,
      depth: d,
      height: h,
      walls: [
        {
          id: uid('wall'),
          x1: 0,
          y1: 0,
          x2: w,
          y2: 0,
          thickness: 0.2,
        },
        {
          id: uid('wall'),
          x1: w,
          y1: 0,
          x2: w,
          y2: d,
          thickness: 0.2,
        },
        {
          id: uid('wall'),
          x1: w,
          y1: d,
          x2: 0,
          y2: d,
          thickness: 0.2,
        },
        {
          id: uid('wall'),
          x1: 0,
          y1: d,
          x2: 0,
          y2: 0,
          thickness: 0.2,
        },
      ],
      doors: [],
      windows: [],
      partitions: [],
      columns: [],
      stage: null,
    };
    dispatch({ type: 'venue/set', payload: venue });
  };

  const removeWall = (id: string) => dispatch({ type: 'venue/wall/remove', payload: { id } });
  const removePartition = (id: string) =>
    dispatch({ type: 'venue/partition/remove', payload: { id } });
  const removeColumn = (id: string) => dispatch({ type: 'venue/column/remove', payload: { id } });
  const removeDoor = (id: string) => dispatch({ type: 'venue/door/remove', payload: { id } });
  const removeWindow = (id: string) => dispatch({ type: 'venue/window/remove', payload: { id } });

  if (!venue) {
    return (
      <CollapsiblePanel id="venue" title="Помещение" icon={<Building2 className="h-3 w-3" />} defaultOpen>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            <label className="text-[11px] text-slate-300">
              Ширина, м
              <input
                type="number"
                min="1"
                step="0.5"
                value={widthDraft}
                onChange={(e) => setWidthDraft(e.target.value)}
                className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="text-[11px] text-slate-300">
              Глубина, м
              <input
                type="number"
                min="1"
                step="0.5"
                value={depthDraft}
                onChange={(e) => setDepthDraft(e.target.value)}
                className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="text-[11px] text-slate-300">
              Высота, м
              <input
                type="number"
                min="1"
                step="0.5"
                value={heightDraft}
                onChange={(e) => setHeightDraft(e.target.value)}
                className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={createVenue}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-500/80 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-500 active:translate-y-[1px] active:scale-[0.99]"
          >
            <Plus className="h-3 w-3" />
            Создать план
          </button>
        </div>
      </CollapsiblePanel>
    );
  }

  return (
    <CollapsiblePanel id="venue" title="Помещение" icon={<Building2 className="h-3 w-3" />} defaultOpen>
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400">
          <div className="rounded border border-white/5 bg-slate-950/40 px-2 py-1">
            Ширина: <span className="text-slate-200">{venue.width}м</span>
          </div>
          <div className="rounded border border-white/5 bg-slate-950/40 px-2 py-1">
            Глубина: <span className="text-slate-200">{venue.depth}м</span>
          </div>
          <div className="rounded border border-white/5 bg-slate-950/40 px-2 py-1">
            Высота: <span className="text-slate-200">{venue.height}м</span>
          </div>
        </div>

        {venue.walls.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Стены
            </div>
            <div className="space-y-1">
              {venue.walls.map((w, i) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded border border-white/5 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-300"
                >
                  <span>
                    Стена {i + 1} · {Math.hypot(w.x2 - w.x1, w.y2 - w.y1).toFixed(2)}м
                  </span>
                  <button
                    type="button"
                    onClick={() => removeWall(w.id)}
                    className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                    title="Удалить"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {venue.partitions.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Перегородки
            </div>
            <div className="space-y-1">
              {venue.partitions.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded border border-white/5 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-300"
                >
                  <span>
                    Перегородка {i + 1} · {Math.hypot(p.x2 - p.x1, p.y2 - p.y1).toFixed(2)}м
                  </span>
                  <button
                    type="button"
                    onClick={() => removePartition(p.id)}
                    className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                    title="Удалить"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {venue.columns.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Колонны
            </div>
            <div className="space-y-1">
              {venue.columns.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded border border-white/5 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-300"
                >
                  <span>
                    Колонна {i + 1} · {c.diameter}м
                  </span>
                  <button
                    type="button"
                    onClick={() => removeColumn(c.id)}
                    className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                    title="Удалить"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {venue.doors.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Двери
            </div>
            <div className="space-y-1">
              {venue.doors.map((d, i) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded border border-white/5 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-300"
                >
                  <span>
                    Дверь {i + 1} · {d.width}м
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDoor(d.id)}
                    className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                    title="Удалить"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {venue.windows.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Окна
            </div>
            <div className="space-y-1">
              {venue.windows.map((win, i) => (
                <div
                  key={win.id}
                  className="flex items-center justify-between rounded border border-white/5 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-300"
                >
                  <span>
                    Окно {i + 1} · {win.width}м
                  </span>
                  <button
                    type="button"
                    onClick={() => removeWindow(win.id)}
                    className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                    title="Удалить"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {venue.stage && (
          <div className="flex items-center justify-between rounded border border-white/5 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-300">
            <span>
              Сцена · {venue.stage.width}×{venue.stage.depth}м
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'venue/stage/set', payload: null })}
              className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
              title="Удалить"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
};

export default VenuePanel;
