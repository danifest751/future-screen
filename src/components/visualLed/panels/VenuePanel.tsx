import { useState, type KeyboardEvent } from 'react';
import { Building2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { FloorPlanObjectKind } from '../../../lib/visualLed';
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

  const selectedObject = scene.selectedFloorPlanObject;
  const isSelectedObject = (kind: FloorPlanObjectKind, id: string) =>
    selectedObject?.kind === kind && selectedObject.id === id;
  const selectObject = (kind: FloorPlanObjectKind, id: string) =>
    dispatch({ type: 'floorPlan/selectObject', payload: { kind, id } });
  const itemClass = (selected: boolean) =>
    `rounded border px-2 py-1 text-[11px] transition ${
      selected
        ? 'border-amber-300/70 bg-amber-400/15 text-white shadow-[0_0_0_1px_rgba(251,191,36,0.28)]'
        : 'border-white/5 bg-slate-950/40 text-slate-300 hover:border-white/15 hover:bg-slate-900/60'
    }`;
  const onObjectKeyDown = (event: KeyboardEvent, kind: FloorPlanObjectKind, id: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectObject(kind, id);
  };

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
        { id: uid('wall'), x1: 0, y1: 0, x2: w, y2: 0, thickness: 0.2 },
        { id: uid('wall'), x1: w, y1: 0, x2: w, y2: d, thickness: 0.2 },
        { id: uid('wall'), x1: w, y1: d, x2: 0, y2: d, thickness: 0.2 },
        { id: uid('wall'), x1: 0, y1: d, x2: 0, y2: 0, thickness: 0.2 },
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
  const removePartition = (id: string) => dispatch({ type: 'venue/partition/remove', payload: { id } });
  const removeColumn = (id: string) => dispatch({ type: 'venue/column/remove', payload: { id } });
  const removeDoor = (id: string) => dispatch({ type: 'venue/door/remove', payload: { id } });
  const removeWindow = (id: string) => dispatch({ type: 'venue/window/remove', payload: { id } });

  const updateDoor = (id: string, patch: { offset?: number; width?: number; swing?: 'left' | 'right'; swingSide?: 'inside' | 'outside' }) =>
    dispatch({
      type: 'venue/door/update',
      payload: { id, patch },
    });

  const updateWindow = (id: string, patch: { offset?: number; width?: number }) =>
    dispatch({
      type: 'venue/window/update',
      payload: { id, patch },
    });

  const updateStageHeight = (height: number) => {
    if (!venue?.stage) return;
    dispatch({ type: 'venue/stage/set', payload: { ...venue.stage, height } });
  };

  if (!venue) {
    return (
      <CollapsiblePanel id="venue" title="Помещение" icon={<Building2 className="h-3 w-3" />} defaultOpen>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            <label className="text-[11px] text-slate-300">
              Ширина, м
              <input
                type="number" min="1" step="0.5" value={widthDraft}
                onChange={(e) => setWidthDraft(e.target.value)}
                className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="text-[11px] text-slate-300">
              Глубина, м
              <input
                type="number" min="1" step="0.5" value={depthDraft}
                onChange={(e) => setDepthDraft(e.target.value)}
                className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="text-[11px] text-slate-300">
              Высота, м
              <input
                type="number" min="1" step="0.5" value={heightDraft}
                onChange={(e) => setHeightDraft(e.target.value)}
                className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
          </div>
          <button
            type="button" onClick={createVenue}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-500/80 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-500 active:translate-y-[1px] active:scale-[0.99]"
          >
            <Plus className="h-3 w-3" /> Создать план
          </button>
        </div>
      </CollapsiblePanel>
    );
  }

  return (
    <CollapsiblePanel id="venue" title="Помещение" icon={<Building2 className="h-3 w-3" />} defaultOpen>
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400">
          <div className="rounded border border-white/5 bg-slate-950/40 px-2 py-1">Ширина: <span className="text-slate-200">{venue.width}м</span></div>
          <div className="rounded border border-white/5 bg-slate-950/40 px-2 py-1">Глубина: <span className="text-slate-200">{venue.depth}м</span></div>
          <div className="rounded border border-white/5 bg-slate-950/40 px-2 py-1">Высота: <span className="text-slate-200">{venue.height}м</span></div>
        </div>

        {venue.walls.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Стены</div>
            <div className="space-y-1">
              {venue.walls.map((w, i) => (
                <div
                  key={w.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelectedObject('wall', w.id)}
                  onClick={() => selectObject('wall', w.id)}
                  onKeyDown={(event) => onObjectKeyDown(event, 'wall', w.id)}
                  className={`flex cursor-pointer items-center justify-between ${itemClass(isSelectedObject('wall', w.id))}`}
                >
                  <span>Стена {i + 1} · {Math.hypot(w.x2 - w.x1, w.y2 - w.y1).toFixed(2)}м</span>
                  <button type="button" onClick={(event) => { event.stopPropagation(); removeWall(w.id); }} className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300" title="Удалить"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {venue.partitions.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Перегородки</div>
            <div className="space-y-1">
              {venue.partitions.map((p, i) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelectedObject('partition', p.id)}
                  onClick={() => selectObject('partition', p.id)}
                  onKeyDown={(event) => onObjectKeyDown(event, 'partition', p.id)}
                  className={`flex cursor-pointer items-center justify-between ${itemClass(isSelectedObject('partition', p.id))}`}
                >
                  <span>Перегородка {i + 1} · {Math.hypot(p.x2 - p.x1, p.y2 - p.y1).toFixed(2)}м</span>
                  <button type="button" onClick={(event) => { event.stopPropagation(); removePartition(p.id); }} className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300" title="Удалить"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {venue.columns.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Колонны</div>
            <div className="space-y-1">
              {venue.columns.map((c, i) => (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelectedObject('column', c.id)}
                  onClick={() => selectObject('column', c.id)}
                  onKeyDown={(event) => onObjectKeyDown(event, 'column', c.id)}
                  className={`flex cursor-pointer items-center justify-between ${itemClass(isSelectedObject('column', c.id))}`}
                >
                  <span>Колонна {i + 1} · {c.diameter}м</span>
                  <button type="button" onClick={(event) => { event.stopPropagation(); removeColumn(c.id); }} className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300" title="Удалить"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {venue.doors.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Двери</div>
            <div className="space-y-1">
              {venue.doors.map((d, i) => (
                <div
                  key={d.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelectedObject('door', d.id)}
                  onClick={() => selectObject('door', d.id)}
                  onKeyDown={(event) => onObjectKeyDown(event, 'door', d.id)}
                  className={`cursor-pointer py-1.5 ${itemClass(isSelectedObject('door', d.id))}`}
                >
                  <div className="mb-1 flex items-center justify-between text-slate-300">
                    <span>
                      Дверь {i + 1} · {d.swing === 'right' ? 'петля справа' : 'петля слева'} ·{' '}
                      {(d.swingSide ?? 'inside') === 'inside' ? 'внутрь' : 'наружу'}
                    </span>
                    <button type="button" onClick={(event) => { event.stopPropagation(); removeDoor(d.id); }} className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300" title="Удалить"><Trash2 className="h-3 w-3" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-1" onClick={(event) => event.stopPropagation()}>
                    <label className="text-[10px] text-slate-400">
                      Смещение, м
                      <input type="number" step="0.1" value={d.offset.toFixed(2)}
                        onChange={(e) => updateDoor(d.id, { offset: Number(e.target.value) })}
                        className="mt-0.5 w-full rounded border border-white/10 bg-slate-950 px-1 py-0.5 text-[11px] text-white focus:border-brand-500 focus:outline-none"
                      />
                    </label>
                    <label className="text-[10px] text-slate-400">
                      Ширина, м
                      <input type="number" step="0.1" min="0.3" value={d.width.toFixed(2)}
                        onChange={(e) => updateDoor(d.id, { width: Number(e.target.value) })}
                        className="mt-0.5 w-full rounded border border-white/10 bg-slate-950 px-1 py-0.5 text-[11px] text-white focus:border-brand-500 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-1" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => updateDoor(d.id, { swing: 'left' })}
                      aria-pressed={(d.swing ?? 'left') === 'left'}
                      className={`inline-flex items-center justify-center gap-1 rounded border px-2 py-1 text-[10px] transition ${
                        (d.swing ?? 'left') === 'left'
                          ? 'border-amber-300/50 bg-amber-400/15 text-amber-100'
                          : 'border-white/10 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <RotateCcw className="h-3 w-3" /> Влево
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDoor(d.id, { swing: 'right' })}
                      aria-pressed={d.swing === 'right'}
                      className={`inline-flex items-center justify-center gap-1 rounded border px-2 py-1 text-[10px] transition ${
                        d.swing === 'right'
                          ? 'border-amber-300/50 bg-amber-400/15 text-amber-100'
                          : 'border-white/10 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <RotateCcw className="h-3 w-3 scale-x-[-1]" /> Вправо
                    </button>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => updateDoor(d.id, { swingSide: 'inside' })}
                      aria-pressed={(d.swingSide ?? 'inside') === 'inside'}
                      className={`rounded border px-2 py-1 text-[10px] transition ${
                        (d.swingSide ?? 'inside') === 'inside'
                          ? 'border-amber-300/50 bg-amber-400/15 text-amber-100'
                          : 'border-white/10 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      Внутрь
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDoor(d.id, { swingSide: 'outside' })}
                      aria-pressed={d.swingSide === 'outside'}
                      className={`rounded border px-2 py-1 text-[10px] transition ${
                        d.swingSide === 'outside'
                          ? 'border-amber-300/50 bg-amber-400/15 text-amber-100'
                          : 'border-white/10 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      Наружу
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {venue.windows.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Окна</div>
            <div className="space-y-1">
              {venue.windows.map((win, i) => (
                <div
                  key={win.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelectedObject('window', win.id)}
                  onClick={() => selectObject('window', win.id)}
                  onKeyDown={(event) => onObjectKeyDown(event, 'window', win.id)}
                  className={`cursor-pointer py-1.5 ${itemClass(isSelectedObject('window', win.id))}`}
                >
                  <div className="mb-1 flex items-center justify-between text-slate-300">
                    <span>Окно {i + 1}</span>
                    <button type="button" onClick={(event) => { event.stopPropagation(); removeWindow(win.id); }} className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300" title="Удалить"><Trash2 className="h-3 w-3" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-1" onClick={(event) => event.stopPropagation()}>
                    <label className="text-[10px] text-slate-400">
                      Смещение, м
                      <input type="number" step="0.1" value={win.offset.toFixed(2)}
                        onChange={(e) => updateWindow(win.id, { offset: Number(e.target.value) })}
                        className="mt-0.5 w-full rounded border border-white/10 bg-slate-950 px-1 py-0.5 text-[11px] text-white focus:border-brand-500 focus:outline-none"
                      />
                    </label>
                    <label className="text-[10px] text-slate-400">
                      Ширина, м
                      <input type="number" step="0.1" min="0.3" value={win.width.toFixed(2)}
                        onChange={(e) => updateWindow(win.id, { width: Number(e.target.value) })}
                        className="mt-0.5 w-full rounded border border-white/10 bg-slate-950 px-1 py-0.5 text-[11px] text-white focus:border-brand-500 focus:outline-none"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {venue.stage && (
          <div className="space-y-1">
            <div
              role="button"
              tabIndex={0}
              aria-pressed={isSelectedObject('stage', venue.stage.id)}
              onClick={() => selectObject('stage', venue.stage!.id)}
              onKeyDown={(event) => onObjectKeyDown(event, 'stage', venue.stage!.id)}
              className={`flex cursor-pointer items-center justify-between ${itemClass(isSelectedObject('stage', venue.stage.id))}`}
            >
              <span>Сцена · {venue.stage.width.toFixed(1)}×{venue.stage.depth.toFixed(1)}м</span>
              <button type="button" onClick={(event) => { event.stopPropagation(); dispatch({ type: 'venue/stage/set', payload: null }); }} className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300" title="Удалить"><Trash2 className="h-3 w-3" /></button>
            </div>
            <label className="text-[11px] text-slate-400">
              Высота сцены, м
              <input
                type="number" step="0.1" min="0" value={venue.stage.height.toFixed(2)}
                onChange={(e) => updateStageHeight(Number(e.target.value))}
                className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
};

export default VenuePanel;
