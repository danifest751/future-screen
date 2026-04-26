import { Expand, Plus, Wand2 } from 'lucide-react';
import {
  CABINET_SIDE_M,
  autoFillCabinets,
  cabinetsToTargetSize,
  getElementSizeMeters,
  scaleQuadToMetric,
  type Quad,
  type ScreenElement,
} from '../../lib/visualLed';
import { uid } from './state/initialState';
import { useActiveScene, useSelectedElement, useVisualLed } from './state/VisualLedContext';

/**
 * Floating toolbar over the canvas — the "easy mode" entry point.
 *
 * "+ Экран" drops a 2×2-cabinet screen at the canvas centre so a
 * first-time user doesn't have to discover the 4-click placement tool
 * in the (collapsed) ScreensPanel. Auto / Fit are surfaced here too so
 * the same toolbar covers the full create-then-tune flow without
 * opening any sidebar panels.
 *
 * The 4-click placement tool stays in ScreensPanel for advanced cases
 * where the user needs to match an angled surface in the photo.
 */
const QuickAddToolbar = () => {
  const scene = useActiveScene();
  const selected = useSelectedElement();
  const { dispatch } = useVisualLed();

  const addScreenAtCenter = () => {
    // Default footprint: 2×2 cabinets = 1m × 1m. Translates to pixels
    // via the scale calibration when present; falls back to ~1/8 of
    // canvas width so the screen is visible even before calibration.
    const pxPerMeter = scene.scaleCalib?.pxPerMeter ?? scene.canvasWidth / 8;
    const sizePx = pxPerMeter * (2 * CABINET_SIDE_M);

    const cx = scene.canvasWidth / 2;
    const cy = scene.canvasHeight / 2;
    const half = sizePx / 2;
    const corners: Quad = [
      { x: cx - half, y: cy - half },
      { x: cx + half, y: cy - half },
      { x: cx + half, y: cy + half },
      { x: cx - half, y: cy + half },
    ];

    const newScreen: ScreenElement = {
      id: uid('scr'),
      name: `Экран ${scene.elements.length + 1}`,
      corners,
      videoId: null,
      cabinetPlan: { cols: 2, rows: 2, cabinetSide: CABINET_SIDE_M, pitch: '2.6' },
    };
    dispatch({ type: 'screen/add', payload: newScreen });
  };

  // Auto: re-fit cabinet cols/rows to the current screen size in metres.
  const canAuto = Boolean(selected && scene.scaleCalib);
  const autoFitSelected = () => {
    if (!selected || !scene.scaleCalib) return;
    const size = getElementSizeMeters(selected.corners, scene.scaleCalib);
    if (!size) return;
    const plan = autoFillCabinets(size, selected.cabinetPlan?.pitch ?? '2.6');
    dispatch({
      type: 'screen/update',
      payload: { id: selected.id, patch: { cabinetPlan: plan } },
    });
  };

  // Fit: rescale the quad so its real-world size matches the cabinet plan exactly.
  const canFit = Boolean(selected?.cabinetPlan && scene.scaleCalib);
  const fitToCabinets = () => {
    if (!selected?.cabinetPlan || !scene.scaleCalib) return;
    const target = cabinetsToTargetSize(selected.cabinetPlan);
    const currentSize = getElementSizeMeters(selected.corners, scene.scaleCalib);
    if (!currentSize) return;
    const newCorners = scaleQuadToMetric(selected.corners, currentSize, target);
    dispatch({
      type: 'screen/updateCorners',
      payload: { id: selected.id, corners: newCorners },
    });
  };

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={addScreenAtCenter}
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-brand-400/40 bg-brand-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
        title="Добавить экран по центру (2×2 кабинета — растягивай за углы, кабинеты подстроятся сами)"
      >
        <Plus className="h-3.5 w-3.5" />
        Экран
      </button>
      <div className="pointer-events-auto flex gap-1">
        <button
          type="button"
          onClick={autoFitSelected}
          disabled={!canAuto}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-200 backdrop-blur transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          title={
            scene.scaleCalib
              ? 'Подобрать число кабинетов под текущий размер экрана'
              : 'Сначала задай масштаб, чтобы Auto знал размер в метрах'
          }
        >
          <Wand2 className="h-3 w-3" />
          Auto
        </button>
        <button
          type="button"
          onClick={fitToCabinets}
          disabled={!canFit}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-200 backdrop-blur transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          title={
            scene.scaleCalib
              ? 'Подогнать размер экрана под текущее число кабинетов'
              : 'Нужен масштаб + cabinet plan'
          }
        >
          <Expand className="h-3 w-3" />
          Fit
        </button>
      </div>
    </div>
  );
};

export default QuickAddToolbar;
