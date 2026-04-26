import { useState } from 'react';
import { Ruler, X } from 'lucide-react';
import CollapsiblePanel from '../CollapsiblePanel';
import { selectActivePreset } from '../state/selectors';
import { useActiveScene, useVisualLed } from '../state/VisualLedContext';

/**
 * Scale calibration panel. User enters a known real-world length (in
 * metres) that exists on the image, then clicks "Старт" to activate
 * the 2-click scale tool. Canvas handles the actual point collection.
 *
 * For preset scenes we suggest 1.75 m as the default — that's the AI
 * human's height in every hero, the most reliable reference object the
 * user has. Calibrating at the human's depth is the most accurate way
 * to get sensible screen sizes; anything further (wall) appears smaller
 * per metre due to perspective.
 */
const ScalePanel = () => {
  const scene = useActiveScene();
  const { state, dispatch } = useVisualLed();
  const preset = selectActivePreset(state);
  const usingPreset = preset !== null;
  const [knownLength, setKnownLength] = useState(usingPreset ? '1.75' : '2');

  const toolActive = state.tool?.mode === 'scale2';
  const toolPoints = state.tool?.points.length ?? 0;

  const start = () => {
    dispatch({ type: 'tool/start', payload: { mode: 'scale2', points: [] } });
  };
  const cancel = () => dispatch({ type: 'tool/cancel' });

  const status = scene.scaleCalib
    ? `Масштаб: ${scene.scaleCalib.pxPerMeter.toFixed(1)} px/м`
    : toolActive
      ? `Выбери точки: ${toolPoints}/2`
      : 'Масштаб не задан';

  return (
    <CollapsiblePanel
      id="scale"
      title="Масштаб"
      icon={<Ruler className="h-3 w-3" />}
      defaultOpen
    >
      <p className="mb-2 text-[11px] text-slate-500">
        Введи известную длину в метрах, нажми «Старт» и кликни 2 точки на изображении.
      </p>
      {usingPreset ? (
        <p className="mb-2 rounded-md border border-brand-500/30 bg-brand-500/10 px-2 py-1.5 text-[11px] text-brand-100">
          В кадре есть человек ≈ 1.75 м — самый надёжный ориентир. Кликни в макушку и в стопы.
        </p>
      ) : null}
      <label className="mb-2 block text-[11px] text-slate-300">
        Длина, м
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={knownLength}
          onChange={(e) => setKnownLength(e.target.value)}
          data-length-input="true"
          className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
        />
      </label>
      {!toolActive ? (
        <button
          type="button"
          onClick={start}
          className="w-full rounded-md bg-brand-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500"
        >
          Старт
        </button>
      ) : (
        <button
          type="button"
          onClick={cancel}
          className="flex w-full items-center justify-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 hover:border-red-400 hover:bg-red-500/20"
        >
          <X className="h-3 w-3" />
          Отмена
        </button>
      )}
      <div
        className={`mt-2 rounded-md px-2 py-1 text-[11px] ${
          scene.scaleCalib
            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            : toolActive
              ? 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
              : 'border border-white/10 bg-slate-950/40 text-slate-500'
        }`}
      >
        {status}
      </div>
    </CollapsiblePanel>
  );
};

export default ScalePanel;
