import { X } from 'lucide-react';
import type { AdminContentHistoryContent } from '../../../content/pages/adminContentHistory';
import { formatEditorLabel, formatEditorTooltip } from '../../../lib/editorLabel';
import { diffJsonStrings } from '../../../lib/jsonDiff';
import type { EditorProfile, SiteContentVersion } from '../../../services/siteContentVersions';
import {
  formatDiffText,
  formatTimestamp,
  getPreviewValue,
  splitDiffText,
  type RestorePreviewFieldKey,
} from './contentHistoryUtils';
import { HighlightedDiffText, JsonDiffPathTable } from './ContentHistoryDiffParts';

type DiffRow = {
  key: RestorePreviewFieldKey;
  labelKey: RestorePreviewFieldKey;
  beforeValue: ReturnType<typeof getPreviewValue>;
  afterValue: ReturnType<typeof getPreviewValue>;
  changed: boolean;
};

type ContentHistoryDiffModalProps = {
  copy: AdminContentHistoryContent;
  adminLocale: 'ru' | 'en';
  localeTag: string;
  diffTarget: SiteContentVersion;
  diffLoading: boolean;
  diffError: string | null;
  changedDiffRows: DiffRow[];
  editorProfiles: Map<string, EditorProfile>;
  onClose: () => void;
};

export const ContentHistoryDiffModal = ({
  copy,
  adminLocale,
  localeTag,
  diffTarget,
  diffLoading,
  diffError,
  changedDiffRows,
  editorProfiles,
  onClose,
}: ContentHistoryDiffModalProps) => (
  <div
    className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70 p-3"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="flex h-[calc(100vh-1.5rem)] max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col rounded-2xl border border-white/15 bg-slate-950 shadow-2xl">
      <div className="shrink-0 border-b border-white/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{copy.diffTitle}</h3>
            <p className="mt-1 max-w-3xl text-sm text-slate-300">{copy.diffIntro}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-slate-800 p-2 text-slate-300 hover:border-white/30 hover:text-white"
            aria-label={copy.previewClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <dl className="mt-3 grid gap-2 rounded-lg border border-white/10 bg-slate-950/50 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex gap-2">
            <dt className="shrink-0 font-mono text-slate-500">key</dt>
            <dd className="truncate font-mono text-slate-200">{diffTarget.key}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-mono text-slate-500">when</dt>
            <dd className="text-slate-200">{formatTimestamp(diffTarget.editedAt, localeTag)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-mono text-slate-500">op</dt>
            <dd className="text-slate-200">{copy.operationLabels[diffTarget.operation]}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-mono text-slate-500">by</dt>
            <dd
              className="text-slate-200"
              title={formatEditorTooltip(diffTarget.editedBy, diffTarget.editedBy ? editorProfiles.get(diffTarget.editedBy) : undefined)}
            >
              {formatEditorLabel(diffTarget.editedBy, diffTarget.editedBy ? editorProfiles.get(diffTarget.editedBy) : undefined)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {diffLoading ? (
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
            <div className="mb-4 h-4 w-44 animate-pulse rounded bg-slate-800" />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="h-24 animate-pulse rounded-lg bg-slate-800/70" />
              <div className="h-24 animate-pulse rounded-lg bg-slate-800/70" />
            </div>
            <p className="mt-4 text-sm text-slate-400">{copy.previewLoading}</p>
          </div>
        ) : diffError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {diffError}
          </div>
        ) : (
          <div className="space-y-3">
            <span className="inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-200">
              {copy.diffChangedCount(changedDiffRows.length)}
            </span>

            {changedDiffRows.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {copy.diffNoChanges}
              </div>
            ) : (
              <div className="space-y-3">
                {changedDiffRows.map((row) => {
                  const beforeRaw = typeof row.beforeValue === 'string' ? row.beforeValue : null;
                  const afterRaw = typeof row.afterValue === 'string' ? row.afterValue : null;
                  const jsonDiff = (beforeRaw !== null || afterRaw !== null)
                    ? diffJsonStrings(beforeRaw, afterRaw)
                    : { ok: false, entries: [] };
                  const useJsonDiff = jsonDiff.ok && jsonDiff.entries.length > 0;

                  const beforeText = formatDiffText(row.beforeValue, adminLocale);
                  const afterText = formatDiffText(row.afterValue, adminLocale);
                  const diffText = splitDiffText(beforeText, afterText);

                  return (
                    <section key={row.key} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">{copy.fieldLabels[row.labelKey]}</h4>
                        <div className="flex items-center gap-1.5">
                          {useJsonDiff && (
                            <span className="rounded-full border border-slate-500/35 bg-slate-800/70 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                              {copy.diffJsonBadge} ? {copy.diffJsonPathsCount(jsonDiff.entries.length)}
                            </span>
                          )}
                          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-200">
                            {copy.previewChanged}
                          </span>
                        </div>
                      </div>
                      {useJsonDiff ? (
                        <JsonDiffPathTable
                          entries={jsonDiff.entries}
                          labels={{
                            path: copy.diffJsonHeaders.path,
                            before: copy.diffJsonHeaders.before,
                            after: copy.diffJsonHeaders.after,
                            root: copy.diffJsonHeaders.root,
                            kinds: copy.diffJsonKinds,
                          }}
                        />
                      ) : (
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="min-w-0 overflow-auto rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-50">
                            <div className="mb-1 text-[11px] font-semibold uppercase text-red-200/80">{copy.diffBefore}</div>
                            <HighlightedDiffText parts={diffText.before} tone="before" />
                          </div>
                          <div className="min-w-0 overflow-auto rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-50">
                            <div className="mb-1 text-[11px] font-semibold uppercase text-emerald-200/80">{copy.diffAfter}</div>
                            <HighlightedDiffText parts={diffText.after} tone="after" />
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/10 bg-slate-950 p-4">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/30 hover:text-white"
          >
            <X className="h-4 w-4" />
            {copy.diffClose}
          </button>
        </div>
      </div>
    </div>
  </div>
);
