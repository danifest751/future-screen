import { Monitor, Plus, Trash2, X } from 'lucide-react';
import CollapsiblePanel from '../CollapsiblePanel';
import { useActiveScene, useVisualLed } from '../state/VisualLedContext';

/**
 * Screens panel — add new screens via the 4-click placement tool and
 * pick/delete existing ones from the list.
 */
const ScreensPanel = () => {
  const scene = useActiveScene();
  const { state, dispatch } = useVisualLed();

  const placing = state.tool?.mode === 'place4';
  const placingCount = state.tool?.points.length ?? 0;

  const startPlace = () => {
    dispatch({ type: 'tool/start', payload: { mode: 'place4', points: [] } });
  };
  const cancel = () => dispatch({ type: 'tool/cancel' });

  return (
    <CollapsiblePanel
      id="screens"
      title="Экраны"
      icon={<Monitor className="h-3 w-3" />}
      defaultOpen={false}
    >
      {!placing ? (
        <button
          type="button"
          onClick={startPlace}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-500/80 px-3 py-1.5 text-xs font-semibold text-white transition duration-150 hover:bg-brand-500 active:translate-y-[1px] active:scale-[0.99]"
        >
          <Plus className="h-3 w-3" />
          Добавить экран
        </button>
      ) : (
        <button
          type="button"
          onClick={cancel}
          className="flex w-full items-center justify-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 hover:border-red-400 hover:bg-red-500/20"
        >
          <X className="h-3 w-3" />
          Отмена · {placingCount}/4
        </button>
      )}

      <div
        className={`mt-2 rounded-md px-2 py-1 text-[11px] ${
          placing
            ? 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
            : 'border border-white/10 bg-slate-950/40 text-slate-400'
        }`}
      >
        {placing
          ? 'Кликни 4 угла будущего экрана на фоне'
          : `Экранов в сцене: ${scene.elements.length}`}
      </div>

      {scene.elements.length > 0 ? (
        <div className="mt-2 space-y-1">
          {scene.elements.map((el, idx) => {
            const isSel = el.id === scene.selectedElementId;
            return (
              <div
                key={el.id}
                className={`flex items-center justify-between gap-1 rounded-md border px-2 py-1 text-[11px] ${
                  isSel
                    ? 'border-brand-400 bg-brand-500/10 text-white'
                    : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/25 hover:text-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'screen/select', payload: { id: el.id } })}
                  className="flex-1 truncate text-left"
                  title={el.name || `Экран ${idx + 1}`}
                >
                  {el.name || `Экран ${idx + 1}`}
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'screen/delete', payload: { id: el.id } })}
                  className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                  title="Удалить экран"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </CollapsiblePanel>
  );
};

export default ScreensPanel;
