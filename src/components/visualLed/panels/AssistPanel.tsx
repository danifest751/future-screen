import { useState } from 'react';
import { Check, Eraser, Wand2 } from 'lucide-react';
import { runAssistAnalysis } from '../assistRunner';
import { useActiveScene, useSelectedElement, useVisualLed } from '../state/VisualLedContext';

/**
 * Assist panel — polish the selected screen's corners via edge
 * detection. Analysis captures the canvas ROI around the selected
 * screen, looks for dominant lines / edge-snap refinement, and
 * produces a proposal the user can accept (Применить) or discard
 * (Очистить).
 */
const AssistPanel = () => {
  const scene = useActiveScene();
  const selected = useSelectedElement();
  const { state, dispatch } = useVisualLed();
  const [busy, setBusy] = useState(false);
  const proposal = scene.assist;

  const hasBackground = scene.backgrounds.some((b) => b.id === scene.activeBackgroundId);

  const runAnalysis = async () => {
    if (!selected) return;
    const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-vled-canvas]');
    if (!canvas) return;
    setBusy(true);
    try {
      const result = await runAssistAnalysis(canvas, selected);
      dispatch({ type: 'assist/set', payload: result });
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (!proposal) return;
    dispatch({
      type: 'screen/updateCorners',
      payload: { id: proposal.targetElementId, corners: proposal.corners },
    });
    dispatch({ type: 'assist/set', payload: null });
  };

  const clear = () => dispatch({ type: 'assist/set', payload: null });

  const toggleGuides = () =>
    dispatch({
      type: 'ui/toggle',
      payload: { key: 'showAssistGuides', value: !state.ui.showAssistGuides },
    });

  const disabledAnalysis = !selected || !hasBackground || busy;

  const confBadge = proposal
    ? proposal.confidence === 'high'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
      : proposal.confidence === 'medium'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
        : 'border-red-500/40 bg-red-500/10 text-red-200'
    : '';

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <h2 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <Wand2 className="h-3 w-3" /> Assist
      </h2>
      {!selected ? (
        <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 px-2 py-2 text-[11px] text-slate-500">
          Выбери экран для анализа
        </div>
      ) : !hasBackground ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-2 text-[11px] text-amber-200">
          Загрузи фон — без него нечего анализировать
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void runAnalysis()}
            disabled={disabledAnalysis}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wand2 className="h-3 w-3" />
            {busy ? 'Анализ…' : 'Анализировать'}
          </button>

          {proposal ? (
            <>
              <div className={`rounded-md border px-2 py-1.5 text-[11px] ${confBadge}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold uppercase tracking-wider">
                    {proposal.confidence}
                  </span>
                  <span className="font-mono text-[10px] opacity-80">
                    score {proposal.score.toFixed(2)} · {proposal.source}
                  </span>
                </div>
                <div className="mt-1 text-slate-300">{proposal.reason}</div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={apply}
                  className="flex items-center justify-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  <Check className="h-3 w-3" />
                  Применить
                </button>
                <button
                  type="button"
                  onClick={clear}
                  className="flex items-center justify-center gap-1 rounded-md border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-white hover:border-white/30"
                >
                  <Eraser className="h-3 w-3" />
                  Отмена
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 px-2 py-1.5 text-[11px] text-slate-500">
              Запусти анализ — предложение появится здесь
            </div>
          )}

          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={state.ui.showAssistGuides}
              onChange={toggleGuides}
              className="h-3 w-3 rounded border-white/20 bg-slate-950 accent-brand-500"
            />
            Показывать направляющие
          </label>
        </div>
      )}
    </div>
  );
};

export default AssistPanel;
