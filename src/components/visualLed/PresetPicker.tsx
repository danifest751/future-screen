import { Sparkles } from 'lucide-react';
import type { VisualLedPreset } from '../../lib/visualLed/presets';
import { calculatePresetPrice, formatRubPrice } from '../../lib/visualLed/pricing';
import { useVisualLed } from './state/VisualLedContext';
import { useVisualLedConfig } from '../../hooks/useVisualLedConfig';

interface PresetPickerProps {
  /**
   * Called after a successful preset pick or skip. The onboarding gate
   * doesn't pass this (it has nothing to close); the in-editor switcher
   * passes a callback that closes its modal.
   */
  onAfterPick?: () => void;
  /** Hide the page-level header when rendered inside a modal. */
  compact?: boolean;
}

/**
 * Preset grid — used in two places:
 *   1. Onboarding gate (full-page, no `onAfterPick`) — shown when
 *      `isOnboardingMode` is true on the empty canvas.
 *   2. In-editor switcher (compact + onAfterPick), wrapped by
 *      `PresetSwitcherModal` so the user can swap presets without
 *      losing their work.
 *
 * "Свой вариант" sets a null preset and just clears the gate — same canvas
 * as before, just no preset multiplier.
 */
const PresetPicker = ({ onAfterPick, compact = false }: PresetPickerProps) => {
  const { dispatch } = useVisualLed();
  const { presets } = useVisualLedConfig();

  const handlePick = (preset: VisualLedPreset) => {
    dispatch({
      type: 'preset/apply',
      payload: {
        slug: preset.slug,
        backgroundUrl: preset.background,
        backgroundName: preset.title.ru,
      },
    });
    onAfterPick?.();
  };

  const handleSkip = () => {
    // "Свой вариант" — flip the onboarding gate without picking a real
    // preset. We use a sentinel slug `__custom__`; getPreset() returns
    // null for it, so the price selector falls back to the cheapest
    // preset's coefficients (and `isEstimated = true`).
    dispatch({
      type: 'preset/apply',
      payload: {
        slug: '__custom__',
        backgroundUrl: '',
        backgroundName: 'Свой вариант',
      },
    });
    onAfterPick?.();
  };

  return (
    <div className={compact ? 'w-full' : 'mx-auto w-full max-w-6xl px-3 py-6'}>
      {compact ? null : (
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Выберите тип события
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Подберите похожий пресет — увидите примерную стоимость и сможете
            уточнить размеры экрана. Все цены — ориентир, итог уточнит менеджер.
          </p>
        </header>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {presets.map((preset) => {
          const priceFrom = calculatePresetPrice(preset);
          return (
            <button
              key={preset.slug}
              type="button"
              onClick={() => handlePick(preset)}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900 text-left transition hover:border-brand-500/50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-slate-950">
                <img
                  src={preset.preview}
                  alt={preset.title.ru}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-white">{preset.title.ru}</h3>
                  <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-200">
                    {preset.areaM2} м²
                  </span>
                </div>
                <p className="text-xs text-slate-400">{preset.description.ru}</p>
                <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-white/5 pt-2">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    от
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {formatRubPrice(priceFrom)}
                    <span className="ml-1 text-xs font-normal text-slate-400">/ день</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleSkip}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-slate-900/40 p-8 text-center transition hover:border-brand-500/50 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <Sparkles className="h-8 w-8 text-slate-500" />
          <div className="text-base font-semibold text-white">Свой вариант</div>
          <div className="max-w-[14rem] text-xs text-slate-400">
            Откройте чистый холст и соберите сцену с нуля.
          </div>
        </button>
      </div>

      {compact ? null : (
        <p className="mt-6 text-center text-[11px] text-slate-500">
          Иллюстрации — концепция, итоговый вид зависит от площадки. Цена —
          ориентир для предварительного расчёта.
        </p>
      )}
    </div>
  );
};

export default PresetPicker;
