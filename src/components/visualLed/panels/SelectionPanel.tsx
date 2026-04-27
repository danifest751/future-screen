import { useEffect, useState } from 'react';
import { Check, MousePointer2, Pencil, Trash2, X } from 'lucide-react';
import { getElementSizeMeters, scaleQuadToMetric } from '../../../lib/visualLed';
import CollapsiblePanel from '../CollapsiblePanel';
import { useActiveScene, useSelectedElement, useVisualLed } from '../state/VisualLedContext';

/**
 * Selection panel — shows size + resize controls for the currently
 * selected screen. Needs a scale calibration to convert pixel corners
 * into metric inputs.
 */
const SelectionPanel = () => {
  const scene = useActiveScene();
  const selected = useSelectedElement();
  const { dispatch } = useVisualLed();
  const [widthDraft, setWidthDraft] = useState('');
  const [heightDraft, setHeightDraft] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');

  // Sync the drafts whenever the selection or its current size changes.
  useEffect(() => {
    if (!selected || !scene.scaleCalib) {
      setWidthDraft('');
      setHeightDraft('');
      return;
    }
    const size = getElementSizeMeters(selected.corners, scene.scaleCalib);
    if (!size) return;
    setWidthDraft(size.width.toFixed(2));
    setHeightDraft(size.height.toFixed(2));
  }, [scene.scaleCalib, selected]);

  // Cancel an in-flight rename if the selection changes — otherwise the
  // input would commit a name onto a different screen on blur.
  useEffect(() => {
    setRenaming(false);
    setRenameDraft('');
  }, [selected?.id]);

  const applySize = () => {
    if (!selected || !scene.scaleCalib) return;
    const targetW = Number(widthDraft);
    const targetH = Number(heightDraft);
    if (!Number.isFinite(targetW) || !Number.isFinite(targetH)) return;
    if (targetW <= 0 || targetH <= 0) return;
    const current = getElementSizeMeters(selected.corners, scene.scaleCalib);
    if (!current) return;
    const nextCorners = scaleQuadToMetric(selected.corners, current, {
      width: targetW,
      height: targetH,
    });
    dispatch({
      type: 'screen/updateCorners',
      payload: { id: selected.id, corners: nextCorners },
    });
  };

  const startRename = () => {
    if (!selected) return;
    setRenameDraft(selected.name);
    setRenaming(true);
  };

  const commitRename = () => {
    if (!selected) {
      setRenaming(false);
      return;
    }
    const next = renameDraft.trim();
    if (next && next !== selected.name) {
      dispatch({
        type: 'screen/update',
        payload: { id: selected.id, patch: { name: next } },
      });
    }
    setRenaming(false);
  };

  const cancelRename = () => {
    setRenaming(false);
    setRenameDraft('');
  };

  const remove = () => {
    if (!selected) return;
    dispatch({ type: 'screen/delete', payload: { id: selected.id } });
  };

  return (
    <CollapsiblePanel
      id="selection"
      title="Выбранный экран"
      icon={<MousePointer2 className="h-3 w-3" />}
      defaultOpen
    >
      {!selected ? (
        <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 px-2 py-2 text-[11px] text-slate-500">
          Экран не выбран
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-slate-950/40 px-2 py-1.5 text-xs">
            {renaming ? (
              <>
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitRename();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelRename();
                    }
                  }}
                  className="min-w-0 flex-1 rounded border border-white/10 bg-slate-950 px-1.5 py-0.5 text-xs text-white outline-none focus:border-brand-500"
                  aria-label="Новое имя экрана"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={commitRename}
                    className="rounded p-0.5 text-emerald-300 hover:bg-emerald-500/20"
                    title="Сохранить (Enter)"
                    aria-label="Сохранить имя"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={cancelRename}
                    className="rounded p-0.5 text-slate-400 hover:bg-white/10 hover:text-white"
                    title="Отмена (Esc)"
                    aria-label="Отменить переименование"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="truncate text-slate-200">{selected.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={startRename}
                    className="rounded p-0.5 text-slate-400 hover:bg-white/10 hover:text-white"
                    title="Переименовать"
                    aria-label="Переименовать экран"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                    title="Удалить"
                    aria-label="Удалить экран"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </div>

          {!scene.scaleCalib ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">
              Задай масштаб, чтобы изменять размер в метрах
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                <label className="text-[11px] text-slate-300">
                  Ширина, м
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={widthDraft}
                    onChange={(e) => setWidthDraft(e.target.value)}
                    className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </label>
                <label className="text-[11px] text-slate-300">
                  Высота, м
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={heightDraft}
                    onChange={(e) => setHeightDraft(e.target.value)}
                    className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={applySize}
                className="w-full rounded-md border border-white/15 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition duration-150 hover:border-white/30 active:translate-y-[1px] active:scale-[0.99]"
              >
                Применить размер
              </button>
            </>
          )}
        </div>
      )}
    </CollapsiblePanel>
  );
};

export default SelectionPanel;
