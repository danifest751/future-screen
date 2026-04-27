import { useState } from 'react';
import { Phone, RefreshCw } from 'lucide-react';
import { formatRubPrice } from '../../lib/visualLed/pricing';
import PresetSwitcherModal from './PresetSwitcherModal';
import { selectActivePreset, selectProjectEstimate } from './state/selectors';
import { useVisualLed } from './state/VisualLedContext';
import { useVisualLedConfig } from '../../hooks/useVisualLedConfig';

interface PriceHeaderProps {
  onRequestQuote: () => void;
}

/**
 * Sticky live-price strip shown in editing mode. Hosts the headline
 * "от N ₽ / день", the area used in the calc, the chosen preset name,
 * and the "Узнать точнее" CTA that opens QuoteRequestModal.
 *
 * Pricing comes from the pure selector — no React state of its own,
 * so it never desyncs from screens/preset changes.
 */
const PriceHeader = ({ onRequestQuote }: PriceHeaderProps) => {
  const { state } = useVisualLed();
  const { presets } = useVisualLedConfig();
  const estimate = selectProjectEstimate(state, presets);
  const preset = selectActivePreset(state, presets);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <>
      {/*
        Layout strategy:
          <sm  (phone): flex-col, every block takes full width — price /
                       chips / CTA stack vertically. Avoids the
                       iPhone-7 case where preset chip overlapped
                       "от 250 000 ₽".
          sm+         : flex-row, price flex-1, chips align right, CTA shrink-0.
      */}
      <div className="sticky top-0 z-20 mb-2 flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-lg backdrop-blur sm:flex-row sm:flex-wrap sm:items-center md:flex-nowrap">
        <div className="min-w-0 sm:flex-1">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">
            Ориентир стоимости
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <div className="text-2xl font-bold text-white sm:text-3xl">
              {formatRubPrice(estimate.priceFrom, true)}
            </div>
            <div className="text-xs text-slate-400">/ день</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 sm:justify-end">
          <button
            type="button"
            onClick={() => setSwitcherOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[11px] text-brand-200 transition hover:border-brand-400 hover:bg-brand-500/20 hover:text-white"
            title="Сменить пресет — фон и ориентир цены поменяются, экраны на сцене сохранятся"
          >
            {preset ? preset.title.ru : 'Свой вариант'}
            <RefreshCw className="h-3 w-3 opacity-70" />
          </button>
          <span className="rounded-full border border-white/10 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
            {estimate.areaM2.toFixed(estimate.areaM2 % 1 === 0 ? 0 : 1)} м²
          </span>
          {estimate.isEstimated && (
            <span
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200"
              title="Цена посчитана от площади пресета. Уточнится после редактирования или после заявки."
            >
              ориентир
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onRequestQuote}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/60 active:translate-y-[1px] active:scale-[0.99] sm:w-auto sm:shrink-0 sm:text-base"
        >
          <Phone className="h-4 w-4" />
          Узнать точнее
        </button>
      </div>
      <PresetSwitcherModal open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
};

export default PriceHeader;
