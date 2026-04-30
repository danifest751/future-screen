import type { AdminContentHistoryContent } from '../../../content/pages/adminContentHistory';

type CompareSelectionBarProps = {
  copy: AdminContentHistoryContent;
  selectedCount: number;
  sameKey: boolean;
  onReset: () => void;
  onOpenCompare: () => void;
};

export const CompareSelectionBar = ({
  copy,
  selectedCount,
  sameKey,
  onReset,
  onOpenCompare,
}: CompareSelectionBarProps) => (
  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
    <span>{copy.compareSelected(selectedCount)}</span>
    {!sameKey && selectedCount === 2 && (
      <span className="text-amber-200">{copy.compareDifferentKeys}</span>
    )}
    <div className="ml-auto flex items-center gap-2">
      <button
        type="button"
        onClick={onReset}
        className="rounded border border-white/10 bg-slate-900/50 px-2 py-1 text-slate-200 hover:border-white/30 hover:text-white"
      >
        {copy.compareReset}
      </button>
      <button
        type="button"
        onClick={onOpenCompare}
        disabled={selectedCount !== 2 || !sameKey}
        className="rounded bg-emerald-500/90 px-2.5 py-1 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {copy.compareAction}
      </button>
    </div>
  </div>
);
