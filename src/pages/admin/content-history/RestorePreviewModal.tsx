import { Check, X } from 'lucide-react';
import type { AdminContentHistoryContent } from '../../../content/pages/adminContentHistory';
import { formatEditorLabel, formatEditorTooltip } from '../../../lib/editorLabel';
import { diffJsonStrings } from '../../../lib/jsonDiff';
import type { EditorProfile, SiteContentSnapshot, SiteContentVersion } from '../../../services/siteContentVersions';
import {
  formatPreviewValue,
  formatTimestamp,
  getPreviewValue,
  type RestorePreviewFieldKey,
} from './contentHistoryUtils';
import { JsonDiffPathTable } from './ContentHistoryDiffParts';

type RestorePreviewRow = {
  key: RestorePreviewFieldKey;
  labelKey: RestorePreviewFieldKey;
  currentValue: ReturnType<typeof getPreviewValue>;
  nextValue: ReturnType<typeof getPreviewValue>;
  changed: boolean;
};

type RestorePreviewModalProps = {
  copy: AdminContentHistoryContent;
  adminLocale: 'ru' | 'en';
  localeTag: string;
  confirmTarget: SiteContentVersion;
  restoreTarget: SiteContentVersion | null;
  currentSnapshot: SiteContentSnapshot | null;
  changedRestorePreviewRows: RestorePreviewRow[];
  isRollbackPreview: boolean;
  previewLoading: boolean;
  previewError: string | null;
  restoring: boolean;
  editorProfiles: Map<string, EditorProfile>;
  onClose: () => void;
  onRestore: () => void;
};

export const RestorePreviewModal = ({
  copy,
  adminLocale,
  localeTag,
  confirmTarget,
  restoreTarget,
  currentSnapshot,
  changedRestorePreviewRows,
  isRollbackPreview,
  previewLoading,
  previewError,
  restoring,
  editorProfiles,
  onClose,
  onRestore,
}: RestorePreviewModalProps) => (
  <div
    className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70 p-4"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-white/15 bg-slate-950 shadow-2xl">
      <div className="border-b border-white/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {isRollbackPreview ? copy.previewRollbackTitle : copy.previewRestoreTitle}
            </h3>
            <p className="mt-1 max-w-3xl text-sm text-slate-300">
              {isRollbackPreview ? copy.previewRollbackIntro : copy.previewRestoreIntro}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={restoring}
            className="rounded-lg border border-white/10 bg-slate-800 p-2 text-slate-300 hover:border-white/30 hover:text-white disabled:opacity-60"
            aria-label={copy.previewClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <dl className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-slate-950/50 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex gap-2">
            <dt className="shrink-0 font-mono text-slate-500">key</dt>
            <dd className="truncate font-mono text-slate-200">{confirmTarget.key}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-mono text-slate-500">when</dt>
            <dd className="text-slate-200">{formatTimestamp(confirmTarget.editedAt, localeTag)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-mono text-slate-500">op</dt>
            <dd className="text-slate-200">{copy.operationLabels[confirmTarget.operation]}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-mono text-slate-500">by</dt>
            <dd
              className="text-slate-200"
              title={formatEditorTooltip(confirmTarget.editedBy, confirmTarget.editedBy ? editorProfiles.get(confirmTarget.editedBy) : undefined)}
            >
              {formatEditorLabel(confirmTarget.editedBy, confirmTarget.editedBy ? editorProfiles.get(confirmTarget.editedBy) : undefined)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        {previewLoading ? (
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
            <div className="mb-4 h-4 w-44 animate-pulse rounded bg-slate-800" />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="h-24 animate-pulse rounded-lg bg-slate-800/70" />
              <div className="h-24 animate-pulse rounded-lg bg-slate-800/70" />
            </div>
            <p className="mt-4 text-sm text-slate-400">{copy.previewLoading}</p>
          </div>
        ) : previewError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {previewError}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                {copy.previewChangedCount(changedRestorePreviewRows.length)}
              </span>
              {!currentSnapshot && (
                <span className="text-xs text-slate-400">{copy.previewNoCurrent}</span>
              )}
            </div>

            {changedRestorePreviewRows.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {copy.previewNoChanges}
              </div>
            ) : (
              <div className="space-y-3">
                {changedRestorePreviewRows.map((row) => {
                  const currentRaw = typeof row.currentValue === 'string' ? row.currentValue : null;
                  const nextRaw = typeof row.nextValue === 'string' ? row.nextValue : null;
                  const jsonDiff = (currentRaw !== null || nextRaw !== null)
                    ? diffJsonStrings(currentRaw, nextRaw)
                    : { ok: false, entries: [] };
                  const useJsonDiff = jsonDiff.ok && jsonDiff.entries.length > 0;

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
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                            {copy.previewChanged}
                          </span>
                        </div>
                      </div>
                      {useJsonDiff ? (
                        <JsonDiffPathTable
                          entries={jsonDiff.entries}
                          labels={{
                            path: copy.diffJsonHeaders.path,
                            before: copy.previewCurrent,
                            after: copy.previewRestored,
                            root: copy.diffJsonHeaders.root,
                            kinds: copy.diffJsonKinds,
                          }}
                        />
                      ) : (
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="min-w-0 rounded-lg border border-white/10 bg-slate-900/70 p-3">
                            <div className="mb-1 text-[11px] font-semibold uppercase text-slate-500">{copy.previewCurrent}</div>
                            <pre className="max-h-40 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-300">
                              {formatPreviewValue(currentSnapshot?.[row.key], adminLocale)}
                            </pre>
                          </div>
                          <div className="min-w-0 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
                            <div className="mb-1 text-[11px] font-semibold uppercase text-amber-300/80">{copy.previewRestored}</div>
                            <pre className="max-h-40 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-amber-50">
                              {formatPreviewValue(row.nextValue, adminLocale)}
                            </pre>
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-5">
        <p className="max-w-2xl text-xs text-slate-400">
          {isRollbackPreview ? copy.rollbackConfirm : copy.restoreConfirm}
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={restoring}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/30 hover:text-white disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            {copy.cancel}
          </button>
          <button
            onClick={onRestore}
            disabled={restoring || previewLoading || Boolean(previewError) || !restoreTarget}
            className="flex items-center gap-1 rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {restoring ? copy.restoring : copy.primaryActions[confirmTarget.operation]}
          </button>
        </div>
      </div>
    </div>
  </div>
);
