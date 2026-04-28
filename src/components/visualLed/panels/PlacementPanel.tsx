import { useEffect, useState } from 'react';
import { MousePointer2 } from 'lucide-react';
import { checkBackWallDistance, getScreenAssemblyDepth, getScreenPhysicalSize } from '../../../lib/visualLed/floorPlanGeometry';
import CollapsiblePanel from '../CollapsiblePanel';
import { useActiveScene, useSelectedElement, useVisualLed } from '../state/VisualLedContext';

const PlacementPanel = () => {
  const scene = useActiveScene();
  const selected = useSelectedElement();
  const { dispatch } = useVisualLed();

  const [xDraft, setXDraft] = useState('');
  const [yDraft, setYDraft] = useState('');
  const [rotDraft, setRotDraft] = useState('');
  const [heightDraft, setHeightDraft] = useState('');

  useEffect(() => {
    if (!selected?.placement) {
      setXDraft('');
      setYDraft('');
      setRotDraft('');
      setHeightDraft('');
      return;
    }
    setXDraft(selected.placement.x.toFixed(2));
    setYDraft(selected.placement.y.toFixed(2));
    setRotDraft(selected.placement.rotation.toFixed(0));
    setHeightDraft(selected.placement.height.toFixed(2));
  }, [selected?.id, selected?.placement]);

  const apply = () => {
    if (!selected || !selected.placement) return;
    const x = Number(xDraft);
    const y = Number(yDraft);
    const rotation = Number(rotDraft);
    const height = Number(heightDraft);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(rotation) || !Number.isFinite(height)) return;
    dispatch({
      type: 'screen/updatePlacement',
      payload: { id: selected.id, patch: { x, y, rotation, height } },
    });
  };

  const setMountType = (mountType: 'suspended' | 'floor') => {
    if (!selected || !selected.placement) return;
    dispatch({
      type: 'screen/updatePlacement',
      payload: { id: selected.id, patch: { mountType } },
    });
  };

  if (!selected || !selected.placement) {
    return (
      <CollapsiblePanel id="placement" title="Размещение" icon={<MousePointer2 className="h-3 w-3" />} defaultOpen={false}>
        <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 px-2 py-2 text-[11px] text-slate-500">
          Экран не выбран или не размещён на плане
        </div>
      </CollapsiblePanel>
    );
  }

  const size = getScreenPhysicalSize(selected);
  const widthM = size?.width ?? 2;
  const depthM = getScreenAssemblyDepth(selected.placement.mountType);

  let violation: { valid: boolean; minDist: number } | null = null;
  if (scene.venue) {
    violation = checkBackWallDistance(
      selected.placement,
      widthM,
      depthM,
      scene.venue.walls,
      scene.venue.partitions,
      1.2,
    );
  }

  return (
    <CollapsiblePanel id="placement" title="Размещение" icon={<MousePointer2 className="h-3 w-3" />} defaultOpen>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          <label className="text-[11px] text-slate-300">
            X, м
            <input
              type="number"
              step="0.1"
              value={xDraft}
              onChange={(e) => setXDraft(e.target.value)}
              onBlur={apply}
              className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="text-[11px] text-slate-300">
            Y, м
            <input
              type="number"
              step="0.1"
              value={yDraft}
              onChange={(e) => setYDraft(e.target.value)}
              onBlur={apply}
              className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="text-[11px] text-slate-300">
            Поворот, °
            <input
              type="number"
              step="1"
              value={rotDraft}
              onChange={(e) => setRotDraft(e.target.value)}
              onBlur={apply}
              className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="text-[11px] text-slate-300">
            Высота, м
            <input
              type="number"
              step="0.1"
              min="0"
              value={heightDraft}
              onChange={(e) => setHeightDraft(e.target.value)}
              onBlur={apply}
              className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMountType('floor')}
            className={`flex-1 rounded-md border px-2 py-1 text-xs transition ${
              selected.placement.mountType === 'floor'
                ? 'border-brand-400 bg-brand-500/20 text-white'
                : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/30'
            }`}
          >
            Напольное
          </button>
          <button
            type="button"
            onClick={() => setMountType('suspended')}
            className={`flex-1 rounded-md border px-2 py-1 text-xs transition ${
              selected.placement.mountType === 'suspended'
                ? 'border-brand-400 bg-brand-500/20 text-white'
                : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/30'
            }`}
          >
            Подвес
          </button>
        </div>

        {violation && !violation.valid && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-200">
            Задняя стенка экрана ближе 1.2 м до стены
            (расстояние {violation.minDist.toFixed(2)} м)
          </div>
        )}

        {violation && violation.valid && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-200">
            Расстояние до стены: {violation.minDist.toFixed(2)} м
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
};

export default PlacementPanel;
