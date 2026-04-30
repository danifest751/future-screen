import { Eye, History, RotateCcw, Search } from 'lucide-react';
import type { AdminContentHistoryContent } from '../../../content/pages/adminContentHistory';
import { formatEditorLabel, formatEditorTooltip } from '../../../lib/editorLabel';
import type { EditorProfile, SiteContentVersion } from '../../../services/siteContentVersions';
import { formatTimestamp, operationColor, summarizeSnapshot } from './contentHistoryUtils';

type ContentHistoryTableProps = {
  copy: AdminContentHistoryContent;
  adminLocale: 'ru' | 'en';
  localeTag: string;
  loading: boolean;
  versions: SiteContentVersion[];
  visibleVersions: SiteContentVersion[];
  editorProfiles: Map<string, EditorProfile>;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onOpenDiff: (version: SiteContentVersion) => void;
  onOpenRestorePreview: (version: SiteContentVersion) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

export const ContentHistoryTable = ({
  copy,
  adminLocale,
  localeTag,
  loading,
  versions,
  visibleVersions,
  editorProfiles,
  compareIds,
  onToggleCompare,
  onOpenDiff,
  onOpenRestorePreview,
  hasMore,
  loadingMore,
  onLoadMore,
}: ContentHistoryTableProps) => (
  <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35 shadow-2xl shadow-black/10">
    <div className="max-h-[72vh] overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-slate-900/95 backdrop-blur">
          <tr className="border-b border-white/10">
            <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">{copy.columns.when}</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">{copy.columns.key}</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">{copy.columns.op}</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">{copy.columns.editor}</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">{copy.columns.summary}</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {loading && versions.length === 0 ? (
            Array.from({ length: 7 }).map((_, index) => (
              <tr key={'history-loading-' + index} className="border-b border-white/5">
                <td className="px-3 py-3"><div className="h-3 w-20 animate-pulse rounded bg-slate-800" /></td>
                <td className="px-3 py-3"><div className="h-5 w-28 animate-pulse rounded bg-slate-800" /></td>
                <td className="px-3 py-3"><div className="h-5 w-20 animate-pulse rounded-full bg-slate-800" /></td>
                <td className="px-3 py-3"><div className="h-3 w-24 animate-pulse rounded bg-slate-800" /></td>
                <td className="px-3 py-3"><div className="h-3 w-full max-w-xl animate-pulse rounded bg-slate-800" /></td>
                <td className="px-3 py-3"><div className="ml-auto h-7 w-40 animate-pulse rounded bg-slate-800" /></td>
              </tr>
            ))
          ) : versions.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                <History className="mx-auto mb-3 h-7 w-7 text-slate-600" />
                <span className="text-sm text-slate-400">{copy.noVersions}</span>
              </td>
            </tr>
          ) : visibleVersions.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                <Search className="mx-auto mb-3 h-7 w-7 text-slate-600" />
                <span className="mx-auto block max-w-md text-sm text-slate-400">{copy.emptyAfterFilter}</span>
              </td>
            </tr>
          ) : (
            visibleVersions.map((v) => (
              <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-300">{formatTimestamp(v.editedAt, localeTag)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs font-mono text-slate-200"><span className="rounded bg-slate-800/80 px-1.5 py-0.5">{v.key}</span></td>
                <td className="px-3 py-2">
                  <span className={'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ' + operationColor[v.operation]}>
                    {copy.operationLabels[v.operation]}
                  </span>
                </td>
                <td
                  className="whitespace-nowrap px-3 py-2 text-xs text-slate-300"
                  title={formatEditorTooltip(v.editedBy, v.editedBy ? editorProfiles.get(v.editedBy) : undefined)}
                >
                  {formatEditorLabel(v.editedBy, v.editedBy ? editorProfiles.get(v.editedBy) : undefined)}
                </td>
                <td className="px-3 py-2 text-xs text-slate-400"><span className="block max-w-2xl truncate">{summarizeSnapshot(v, adminLocale)}</span></td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-white/10 bg-slate-900/60 px-1.5 py-1 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-100" title={copy.compareCheckbox}>
                      <input type="checkbox" className="h-3 w-3 accent-emerald-500" checked={compareIds.includes(v.id)} onChange={() => onToggleCompare(v.id)} />
                      {copy.compareShort}
                    </label>
                    <button onClick={() => onOpenDiff(v)} className="inline-flex items-center gap-1 rounded-lg border border-sky-500/35 bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-200 hover:border-sky-400 hover:bg-sky-500/20">
                      <Eye className="h-3 w-3" />
                      {copy.showDiff}
                    </button>
                    <button onClick={() => onOpenRestorePreview(v)} className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-200 hover:border-amber-400 hover:bg-amber-500/20">
                      <RotateCcw className="h-3 w-3" />
                      {copy.rowActions[v.operation]}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    {versions.length > 0 && (
      <div className="flex items-center justify-center border-t border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
        {hasMore ? (
          <button type="button" onClick={onLoadMore} disabled={loadingMore} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:border-white/30 hover:text-white disabled:opacity-60">
            {loadingMore ? copy.loadingMore : copy.loadMore}
          </button>
        ) : (
          <span>{copy.endOfHistory}</span>
        )}
      </div>
    )}
  </div>
);
