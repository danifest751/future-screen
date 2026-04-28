import { Monitor, Plus, Trash2 } from 'lucide-react';
import { getScreenPhysicalSize } from '../../../lib/visualLed/floorPlanGeometry';
import CollapsiblePanel from '../CollapsiblePanel';
import { useActiveScene, useVisualLed } from '../state/VisualLedContext';

const FloorPlanScreensPanel = () => {
  const scene = useActiveScene();
  const { dispatch } = useVisualLed();

  const placeScreen = (id: string) => {
    const el = scene.elements.find((e) => e.id === id);
    if (!el) return;
    const size = getScreenPhysicalSize(el);
    const venue = scene.venue;
    const cx = venue ? venue.width / 2 : 5;
    const cy = venue ? venue.depth / 2 : 4;
    dispatch({
      type: 'screen/setPlacement',
      payload: {
        id,
        placement: {
          x: cx,
          y: cy,
          rotation: 0,
          height: size ? 0 : 0,
          mountType: 'floor',
        },
      },
    });
  };

  const removePlacement = (id: string) => {
    dispatch({ type: 'screen/setPlacement', payload: { id, placement: null } });
  };

  return (
    <CollapsiblePanel id="fp-screens" title="Экраны на плане" icon={<Monitor className="h-3 w-3" />} defaultOpen>
      {scene.elements.length === 0 ? (
        <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 px-2 py-2 text-[11px] text-slate-500">
          Нет экранов в сцене. Создай их в визуализаторе.
        </div>
      ) : (
        <div className="space-y-1">
          {scene.elements.map((el) => {
            const size = getScreenPhysicalSize(el);
            const hasSize = size !== null;
            const isPlaced = Boolean(el.placement);
            return (
              <div
                key={el.id}
                className={`flex items-center justify-between gap-1 rounded-md border px-2 py-1 text-[11px] ${
                  isPlaced
                    ? 'border-brand-400/30 bg-brand-500/10 text-white'
                    : 'border-white/10 bg-slate-950/40 text-slate-300'
                }`}
              >
                <div className="flex flex-col">
                  <span className="truncate">{el.name}</span>
                  {!hasSize && (
                    <span className="text-[10px] text-amber-300">Нет размеров</span>
                  )}
                  {isPlaced && hasSize && (
                    <span className="text-[10px] text-slate-400">
                      {el.placement!.x.toFixed(1)}; {el.placement!.y.toFixed(1)}м ·{' '}
                      {el.placement!.mountType === 'suspended' ? 'Подвес' : 'Напол'}
                    </span>
                  )}
                </div>
                {isPlaced ? (
                  <button
                    type="button"
                    onClick={() => removePlacement(el.id)}
                    className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                    title="Убрать с плана"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => placeScreen(el.id)}
                    disabled={!hasSize}
                    className="rounded p-0.5 text-slate-400 hover:bg-brand-500/20 hover:text-brand-300 disabled:cursor-not-allowed disabled:opacity-30"
                    title={hasSize ? 'Разместить на плане' : 'Задай кабинетную сетку или масштаб'}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CollapsiblePanel>
  );
};

export default FloorPlanScreensPanel;
