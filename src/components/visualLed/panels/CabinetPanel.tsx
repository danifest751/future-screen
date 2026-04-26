import { Grid3x3, Plus, Minus, Trash2, Expand, Wand2 } from 'lucide-react';
import {
  autoFillCabinets,
  cabinetsToTargetSize,
  getCabinetStats,
  getElementSizeMeters,
  getPixelsPerCabinetSide,
  normalizePitch,
  scaleQuadToMetric,
  tweakCols,
  tweakRows,
  type CabinetPlan,
} from '../../../lib/visualLed';
import { useActiveScene, useSelectedElement, useVisualLed } from '../state/VisualLedContext';

/**
 * Cabinet planner — lay out 0.5m × 0.5m modules over the selected screen,
 * tweak the grid column/row count, auto-fit, and preview the resulting
 * resolution for the chosen pixel pitch.
 */
const CabinetPanel = () => {
  const scene = useActiveScene();
  const selected = useSelectedElement();
  const { state, dispatch } = useVisualLed();

  const plan = selected?.cabinetPlan ?? null;
  const size = selected ? getElementSizeMeters(selected.corners, scene.scaleCalib) : null;
  const stats = getCabinetStats(plan, size);

  const setPlan = (next: CabinetPlan | null) => {
    if (!selected) return;
    dispatch({ type: 'screen/setCabinetPlan', payload: { id: selected.id, plan: next } });
  };

  const pitch = normalizePitch(plan?.pitch);
  const pxPerCab = getPixelsPerCabinetSide(pitch);

  const onPitchChange = (nextPitch: string) => {
    if (!selected) return;
    if (plan) {
      setPlan({ ...plan, pitch: normalizePitch(nextPitch) });
    }
  };

  const runAutoFill = () => {
    if (!selected || !size) return;
    setPlan(autoFillCabinets(size, pitch));
  };

  const runFitScreen = () => {
    if (!selected || !plan || !scene.scaleCalib) return;
    const current = size;
    if (!current) return;
    const target = cabinetsToTargetSize(plan);
    const nextCorners = scaleQuadToMetric(selected.corners, current, target);
    dispatch({
      type: 'screen/updateCorners',
      payload: { id: selected.id, corners: nextCorners },
    });
  };

  const toggleGrid = () => {
    dispatch({
      type: 'ui/toggle',
      payload: { key: 'showCabinetGrid', value: !state.ui.showCabinetGrid },
    });
  };

  const disabled = !selected;
  const needScale = !scene.scaleCalib;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <h2 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <Grid3x3 className="h-3 w-3" /> Кабинеты 0.5 × 0.5
      </h2>

      {disabled ? (
        <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 px-2 py-2 text-[11px] text-slate-500">
          Выбери экран
        </div>
      ) : needScale ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-2 text-[11px] text-amber-200">
          Задай масштаб — без него нельзя посчитать кабинеты
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-[11px] text-slate-300">
            Pixel pitch
            <select
              value={pitch}
              onChange={(e) => onPitchChange(e.target.value)}
              className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="2.6">P2.6 · 192×192 px/кабинет</option>
              <option value="1.9">P1.9 · 256×256 px/кабинет</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={runAutoFill}
              className="flex items-center justify-center gap-1 rounded-md bg-brand-500/80 px-2 py-1 text-[11px] font-semibold text-white hover:bg-brand-500"
              title={
                'Auto: подобрать сетку 0.5×0.5 м под текущий размер экрана.\n' +
                'Считаем по полным кабинетам — частичный кабинет на границе НЕ ставится\n' +
                '(половинку нельзя физически смонтировать). Колонки/ряды можно потом\n' +
                'докрутить вручную кнопками +/−.'
              }
            >
              <Wand2 className="h-3 w-3" />
              Auto
            </button>
            <button
              type="button"
              onClick={runFitScreen}
              disabled={!plan}
              className="flex items-center justify-center gap-1 rounded-md border border-white/15 bg-slate-900 px-2 py-1 text-[11px] text-white hover:border-white/30 disabled:opacity-50"
              title={
                'Fit: подогнать сам экран под текущую сетку кабинетов.\n' +
                'Обратная операция к Auto — если ты вручную задал нужные cols×rows,\n' +
                'эта кнопка изменит размеры экрана так, чтобы сетка села ровно.\n' +
                'Полезно когда нужны точные кратные 0.5 м габариты.'
              }
            >
              <Expand className="h-3 w-3" />
              Fit
            </button>
          </div>

          {plan ? (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex items-center gap-0.5 rounded-md border border-white/10 bg-slate-950/50 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => setPlan(tweakCols(plan, -1))}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white"
                    title="Убрать колонку"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="flex-1 text-center text-slate-200">
                    {plan.cols} <span className="text-[9px] text-slate-500">кол</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPlan(tweakCols(plan, 1))}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white"
                    title="Добавить колонку"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-0.5 rounded-md border border-white/10 bg-slate-950/50 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => setPlan(tweakRows(plan, -1))}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white"
                    title="Убрать ряд"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="flex-1 text-center text-slate-200">
                    {plan.rows} <span className="text-[9px] text-slate-500">ряд</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPlan(tweakRows(plan, 1))}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white"
                    title="Добавить ряд"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div
                className={`rounded-md border px-2 py-1 text-[11px] ${
                  stats && stats.overflowCount > 0
                    ? 'border-red-500/30 bg-red-500/10 text-red-200'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                }`}
              >
                {stats ? (
                  <>
                    <div>
                      Кабинетов: <b>{stats.totalCount}</b>{' '}
                      <span className="text-slate-400">
                        ({stats.cols}×{stats.rows})
                      </span>
                    </div>
                    <div className="text-slate-300">
                      Разрешение: {plan.cols * pxPerCab} × {plan.rows * pxPerCab} px
                    </div>
                    {stats.overflowCount > 0 ? (
                      <div className="mt-0.5 text-[10px]">
                        Вне области: {stats.overflowCount}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>Кабинеты: {plan.cols}×{plan.rows}</>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPlan(null)}
                className="flex w-full items-center justify-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-200 hover:border-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="h-3 w-3" />
                Убрать кабинеты
              </button>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 px-2 py-1.5 text-[11px] text-slate-500">
              Нажми «Auto» — подберём сетку под размер экрана
            </div>
          )}

          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={state.ui.showCabinetGrid}
              onChange={toggleGrid}
              className="h-3 w-3 rounded border-white/20 bg-slate-950 accent-brand-500"
            />
            Показывать сетку
          </label>
        </div>
      )}
    </div>
  );
};

export default CabinetPanel;
