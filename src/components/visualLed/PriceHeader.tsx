import { Phone } from 'lucide-react';
import { formatRubPrice } from '../../lib/visualLed/pricing';
import { selectActivePreset, selectProjectEstimate } from './state/selectors';
import { useVisualLed } from './state/VisualLedContext';

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
  const estimate = selectProjectEstimate(state);
  const preset = selectActivePreset(state);

  return (
    <div className="sticky top-0 z-20 mb-2 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-lg backdrop-blur sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">
          Ориентир стоимости
        </div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <div className="text-2xl font-bold text-white sm:text-3xl">
            {formatRubPrice(estimate.priceFrom, true)}
          </div>
          <div className="text-xs text-slate-400">/ день</div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 text-xs text-slate-400 sm:items-end">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {preset && (
            <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[11px] text-brand-200">
              {preset.title.ru}
            </span>
          )}
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
      </div>

      <button
        type="button"
        onClick={onRequestQuote}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/60 sm:text-base"
      >
        <Phone className="h-4 w-4" />
        Узнать точнее
      </button>
    </div>
  );
};

export default PriceHeader;
