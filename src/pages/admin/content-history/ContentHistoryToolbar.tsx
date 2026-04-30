import { Filter, History, Search, X } from 'lucide-react';
import { AdminPageToolbar } from '../../../components/admin/ui';
import type { AdminContentHistoryContent } from '../../../content/pages/adminContentHistory';
import type { SiteContentVersionOperation } from '../../../services/siteContentVersions';
import { formatTimestamp, operationColor } from './contentHistoryUtils';

type ContentKeyOption = {
  key: string;
  lastEditedAt: string;
  lastOperation: SiteContentVersionOperation;
};

type ContentHistoryToolbarProps = {
  copy: AdminContentHistoryContent;
  keys: ContentKeyOption[];
  selectedKey: string | null;
  onSelectedKeyChange: (key: string | null) => void;
  localeTag: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onReload: () => void;
  loading: boolean;
  enabledOps: Set<SiteContentVersionOperation>;
  onToggleOp: (operation: SiteContentVersionOperation) => void;
  operationStats: Record<SiteContentVersionOperation, number>;
  visibleCount: number;
  totalCount: number;
};

const operations: SiteContentVersionOperation[] = ['INSERT', 'UPDATE', 'DELETE'];

export const ContentHistoryToolbar = ({
  copy,
  keys,
  selectedKey,
  onSelectedKeyChange,
  localeTag,
  searchQuery,
  onSearchQueryChange,
  onReload,
  loading,
  enabledOps,
  onToggleOp,
  operationStats,
  visibleCount,
  totalCount,
}: ContentHistoryToolbarProps) => (
  <AdminPageToolbar
    className="rounded-2xl bg-slate-950/35 shadow-2xl shadow-black/10"
    hint={copy.keyStats(keys.length)}
    filters={
      <>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          <span className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            {copy.filterLabel}
          </span>
          <select
            value={selectedKey ?? ''}
            onChange={(e) => onSelectedKeyChange(e.target.value || null)}
            className="min-w-[220px] rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-sm text-white focus:border-emerald-400/70 focus:outline-none"
          >
            <option value="">{copy.allKeys}</option>
            {keys.map((k) => (
              <option key={k.key} value={k.key}>
                {k.key} ? {formatTimestamp(k.lastEditedAt, localeTag)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm text-slate-300">
          <span className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            {copy.searchLabel}
          </span>
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 pr-8 text-sm text-white focus:border-emerald-400/70 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                aria-label={copy.searchClear}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </label>
      </>
    }
    actions={
      <button
        onClick={onReload}
        disabled={loading}
        className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:border-white/30 hover:text-white disabled:opacity-60"
      >
        <History className="mr-1 inline h-4 w-4" />
        {copy.refresh}
      </button>
    }
    secondary={
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">{copy.opFilterHint}:</span>
        {operations.map((operation) => {
          const enabled = enabledOps.has(operation);
          return (
            <button
              key={operation}
              type="button"
              onClick={() => onToggleOp(operation)}
              aria-pressed={enabled}
              className={
                enabled
                  ? 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ' + operationColor[operation]
                  : 'inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-900 px-2 py-0.5 text-xs text-slate-500 transition hover:border-white/20 hover:text-slate-300'
              }
            >
              {copy.operationLabels[operation]}
              <span className="font-mono">{operationStats[operation]}</span>
            </button>
          );
        })}
        <span className="ml-auto text-[11px] text-slate-500">
          {copy.showingFiltered(visibleCount, totalCount)}
        </span>
      </div>
    }
  />
);
