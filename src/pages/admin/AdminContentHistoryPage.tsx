import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, RotateCcw, Filter, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useI18n } from '../../context/I18nContext';
import {
  loadCurrentSiteContentSnapshot,
  loadSiteContentKeys,
  loadSiteContentVersions,
  restoreSiteContentVersion,
  type SiteContentSnapshot,
  type SiteContentVersion,
  type SiteContentVersionOperation,
} from '../../services/siteContentVersions';

const operationColor: Record<SiteContentVersionOperation, string> = {
  INSERT: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  UPDATE: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  DELETE: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const formatTimestamp = (iso: string, locale: string): string => {
  try {
    return new Date(iso).toLocaleString(locale, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const truncateEditorId = (id: string | null): string => {
  if (!id) return '—';
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
};

// Compact single-line summary of what's in a snapshot.
const summarizeSnapshot = (v: SiteContentVersion): string => {
  const pieces: string[] = [];
  if (v.title) pieces.push(`title=${JSON.stringify(v.title.slice(0, 40))}`);
  if (v.content) {
    const len = v.content.length;
    pieces.push(`content(${len}ch)`);
  }
  if (v.metaTitle) pieces.push(`meta=${JSON.stringify(v.metaTitle.slice(0, 32))}`);
  if (v.titleEn) pieces.push(`title_en=${JSON.stringify(v.titleEn.slice(0, 40))}`);
  if (v.contentEn) {
    const len = v.contentEn.length;
    pieces.push(`content_en(${len}ch)`);
  }
  if (v.metaTitleEn) pieces.push(`meta_en=${JSON.stringify(v.metaTitleEn.slice(0, 32))}`);
  if (v.isPublished !== null && v.isPublished !== undefined) {
    pieces.push(`published=${v.isPublished}`);
  }
  return pieces.join(' · ') || '— empty —';
};

type RestorePreviewFieldKey = Exclude<keyof SiteContentSnapshot, 'id' | 'key'>;

const restorePreviewFields: Array<{ key: RestorePreviewFieldKey; labelKey: RestorePreviewFieldKey }> = [
  { key: 'title', labelKey: 'title' },
  { key: 'content', labelKey: 'content' },
  { key: 'contentHtml', labelKey: 'contentHtml' },
  { key: 'metaTitle', labelKey: 'metaTitle' },
  { key: 'metaDescription', labelKey: 'metaDescription' },
  { key: 'fontSize', labelKey: 'fontSize' },
  { key: 'titleEn', labelKey: 'titleEn' },
  { key: 'contentEn', labelKey: 'contentEn' },
  { key: 'contentHtmlEn', labelKey: 'contentHtmlEn' },
  { key: 'metaTitleEn', labelKey: 'metaTitleEn' },
  { key: 'metaDescriptionEn', labelKey: 'metaDescriptionEn' },
  { key: 'fontSizeEn', labelKey: 'fontSizeEn' },
  { key: 'isPublished', labelKey: 'isPublished' },
];

const isSamePreviewValue = (
  currentValue: SiteContentSnapshot[RestorePreviewFieldKey] | undefined,
  nextValue: SiteContentVersion[RestorePreviewFieldKey] | undefined
): boolean => (currentValue ?? null) === (nextValue ?? null);

const formatPreviewValue = (
  value: SiteContentSnapshot[RestorePreviewFieldKey] | SiteContentVersion[RestorePreviewFieldKey] | undefined,
  adminLocale: 'ru' | 'en'
): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? (adminLocale === 'ru' ? 'да' : 'yes') : (adminLocale === 'ru' ? 'нет' : 'no');
  if (value.length === 0) return adminLocale === 'ru' ? 'пустая строка' : 'empty string';
  return value.length > 900 ? `${value.slice(0, 900)}…` : value;
};

const AdminContentHistoryPage = () => {
  const { adminLocale } = useI18n();
  const localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';
  const copy = adminLocale === 'ru'
    ? {
        title: 'История изменений контента',
        subtitle: 'Audit-trail правок site_content. Клик «Восстановить» откатывает к выбранному снепшоту (создаёт новую запись в истории).',
        filterLabel: 'Ключ',
        allKeys: 'Все ключи',
        refresh: 'Обновить',
        restoreConfirm: 'Восстановить эту версию? Текущий контент будет перезаписан (новая запись в истории).',
        restoring: 'Восстанавливаю…',
        restoreSuccess: 'Восстановлено',
        restoreError: 'Не удалось восстановить',
        previewLoadError: 'Не удалось загрузить текущий контент для предпросмотра',
        previewTitle: 'Предпросмотр восстановления',
        previewIntro: 'Сравнение показывает, какие поля текущей записи будут заменены значениями из выбранной версии.',
        previewLoading: 'Загружаю текущую версию…',
        previewCurrent: 'Сейчас',
        previewRestored: 'Станет после восстановления',
        previewChanged: 'Изменится',
        previewClose: 'Закрыть предпросмотр',
        previewNoCurrent: 'Текущая запись не найдена. Восстановление создаст запись из выбранного снепшота.',
        previewNoChanges: 'Выбранный снепшот совпадает с текущим контентом. Восстановление создаст новую запись истории без визуальных изменений.',
        previewChangedCount: (n: number) => `Изменится полей: ${n}`,
        loadError: 'Не удалось загрузить историю',
        noVersions: 'Правок пока нет',
        fieldLabels: {
          title: 'Заголовок RU',
          content: 'Текст RU',
          contentHtml: 'HTML RU',
          metaTitle: 'Meta title RU',
          metaDescription: 'Meta description RU',
          fontSize: 'Размер шрифта RU',
          titleEn: 'Заголовок EN',
          contentEn: 'Текст EN',
          contentHtmlEn: 'HTML EN',
          metaTitleEn: 'Meta title EN',
          metaDescriptionEn: 'Meta description EN',
          fontSizeEn: 'Размер шрифта EN',
          isPublished: 'Опубликовано',
        },
        columns: {
          when: 'Когда',
          key: 'Ключ',
          op: 'Операция',
          editor: 'Кем',
          summary: 'Содержимое',
          actions: '',
        },
        operationLabels: {
          INSERT: 'Создано',
          UPDATE: 'Изменено',
          DELETE: 'Удалено',
        },
        keyStats: (n: number) => `${n} ключей с правками`,
      }
    : {
        title: 'Content change history',
        subtitle: 'site_content audit trail. "Restore" rolls back to the selected snapshot (creates a new history entry).',
        filterLabel: 'Key',
        allKeys: 'All keys',
        refresh: 'Refresh',
        restoreConfirm: 'Restore this version? Current content will be overwritten (new history entry).',
        restoring: 'Restoring…',
        restoreSuccess: 'Restored',
        restoreError: 'Restore failed',
        previewLoadError: 'Failed to load current content for preview',
        previewTitle: 'Restore preview',
        previewIntro: 'The comparison shows which fields of the current record will be replaced by the selected snapshot.',
        previewLoading: 'Loading current version…',
        previewCurrent: 'Current',
        previewRestored: 'After restore',
        previewChanged: 'Will change',
        previewClose: 'Close preview',
        previewNoCurrent: 'Current record was not found. Restore will create the record from this snapshot.',
        previewNoChanges: 'The selected snapshot matches current content. Restore will create a new history entry without visible changes.',
        previewChangedCount: (n: number) => `${n} fields will change`,
        loadError: 'Failed to load history',
        noVersions: 'No edits yet',
        fieldLabels: {
          title: 'Title RU',
          content: 'Content RU',
          contentHtml: 'HTML RU',
          metaTitle: 'Meta title RU',
          metaDescription: 'Meta description RU',
          fontSize: 'Font size RU',
          titleEn: 'Title EN',
          contentEn: 'Content EN',
          contentHtmlEn: 'HTML EN',
          metaTitleEn: 'Meta title EN',
          metaDescriptionEn: 'Meta description EN',
          fontSizeEn: 'Font size EN',
          isPublished: 'Published',
        },
        columns: {
          when: 'When',
          key: 'Key',
          op: 'Operation',
          editor: 'By',
          summary: 'Content',
          actions: '',
        },
        operationLabels: {
          INSERT: 'Created',
          UPDATE: 'Updated',
          DELETE: 'Deleted',
        },
        keyStats: (n: number) => `${n} keys with edits`,
      };

  const [keys, setKeys] = useState<
    Array<{ key: string; lastEditedAt: string; lastOperation: SiteContentVersionOperation }>
  >([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [versions, setVersions] = useState<SiteContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<SiteContentVersion | null>(null);
  const [currentSnapshot, setCurrentSnapshot] = useState<SiteContentSnapshot | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [keysRes, versionsRes] = await Promise.all([
        loadSiteContentKeys(),
        loadSiteContentVersions(selectedKey ? { key: selectedKey } : { limit: 100 }),
      ]);
      setKeys(keysRes);
      setVersions(versionsRes);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [copy.loadError, selectedKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleRestore = useCallback(async () => {
    if (!confirmTarget) return;
    setRestoring(true);
    try {
      await restoreSiteContentVersion(confirmTarget);
      toast.success(copy.restoreSuccess);
      setConfirmTarget(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.restoreError);
    } finally {
      setRestoring(false);
    }
  }, [confirmTarget, copy.restoreError, copy.restoreSuccess, reload]);

  const handleOpenRestorePreview = useCallback(async (version: SiteContentVersion) => {
    setConfirmTarget(version);
    setCurrentSnapshot(null);
    setPreviewError(null);
    setPreviewLoading(true);
    try {
      const snapshot = await loadCurrentSiteContentSnapshot(version.key);
      setCurrentSnapshot(snapshot);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : copy.previewLoadError);
    } finally {
      setPreviewLoading(false);
    }
  }, [copy.previewLoadError]);

  const handleCloseRestorePreview = useCallback(() => {
    if (restoring) return;
    setConfirmTarget(null);
    setCurrentSnapshot(null);
    setPreviewError(null);
    setPreviewLoading(false);
  }, [restoring]);

  const keysIndex = useMemo(() => {
    const m = new Map<string, (typeof keys)[number]>();
    keys.forEach((k) => m.set(k.key, k));
    return m;
  }, [keys]);

  const operationStats = useMemo(() => {
    const stats: Record<SiteContentVersionOperation, number> = {
      INSERT: 0,
      UPDATE: 0,
      DELETE: 0,
    };
    versions.forEach((version) => {
      stats[version.operation] += 1;
    });
    return stats;
  }, [versions]);

  const restorePreviewRows = useMemo(() => {
    if (!confirmTarget) return [];
    return restorePreviewFields.map((field) => {
      const currentValue = currentSnapshot?.[field.key];
      const nextValue = confirmTarget[field.key];
      return {
        ...field,
        currentValue,
        nextValue,
        changed: !currentSnapshot || !isSamePreviewValue(currentValue, nextValue),
      };
    });
  }, [confirmTarget, currentSnapshot]);

  const changedRestorePreviewRows = useMemo(
    () => restorePreviewRows.filter((row) => row.changed),
    [restorePreviewRows]
  );

  return (
    <AdminLayout title={copy.title} subtitle={copy.subtitle}>
      <div className="mb-4 rounded-xl border border-white/10 bg-slate-900/50 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              {copy.filterLabel}
            </span>
            <select
              value={selectedKey ?? ''}
              onChange={(e) => setSelectedKey(e.target.value || null)}
              className="min-w-[220px] rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="">{copy.allKeys}</option>
              {keys.map((k) => (
                <option key={k.key} value={k.key}>
                  {k.key} · {formatTimestamp(k.lastEditedAt, localeTag)}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => void reload()}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:border-white/30 hover:text-white disabled:opacity-60"
          >
            <History className="mr-1 inline h-4 w-4" />
            {copy.refresh}
          </button>
          <div className="ml-auto text-xs text-slate-500">{copy.keyStats(keys.length)}</div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(['INSERT', 'UPDATE', 'DELETE'] as SiteContentVersionOperation[]).map((operation) => (
            <span
              key={operation}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${operationColor[operation]}`}
            >
              {copy.operationLabels[operation]}
              <span className="font-mono">{operationStats[operation]}</span>
            </span>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {loadError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50">
        <div className="max-h-[72vh] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-900/95 backdrop-blur">
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">
                  {copy.columns.when}
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">
                  {copy.columns.key}
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">
                  {copy.columns.op}
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">
                  {copy.columns.editor}
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">
                  {copy.columns.summary}
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {loading && versions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  </td>
                </tr>
              ) : versions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                    {copy.noVersions}
                  </td>
                </tr>
              ) : (
                versions.map((v) => (
                  <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-300">
                      {formatTimestamp(v.editedAt, localeTag)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs font-mono text-slate-200">
                      <span className="rounded bg-slate-800/80 px-1.5 py-0.5">{v.key}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${operationColor[v.operation]}`}
                      >
                        {copy.operationLabels[v.operation]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs font-mono text-slate-500">
                      {truncateEditorId(v.editedBy)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      <span className="block max-w-2xl truncate font-mono">{summarizeSnapshot(v)}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {v.operation !== 'DELETE' && (
                        <button
                          onClick={() => void handleOpenRestorePreview(v)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-200 hover:border-amber-400 hover:bg-amber-500/20"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {adminLocale === 'ru' ? 'Восстановить' : 'Restore'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmTarget && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseRestorePreview();
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
            <div className="border-b border-white/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{copy.previewTitle}</h3>
                  <p className="mt-1 max-w-3xl text-sm text-slate-300">{copy.previewIntro}</p>
                </div>
                <button
                  onClick={handleCloseRestorePreview}
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
                  <dd className="font-mono text-slate-200">{truncateEditorId(confirmTarget.editedBy)}</dd>
                </div>
              </dl>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              {previewLoading ? (
                <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-8 text-sm text-slate-300">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                  {copy.previewLoading}
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
                      {changedRestorePreviewRows.map((row) => (
                        <section
                          key={row.key}
                          className="rounded-xl border border-white/10 bg-slate-950/45 p-3"
                        >
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-white">{copy.fieldLabels[row.labelKey]}</h4>
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                              {copy.previewChanged}
                            </span>
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            <div className="min-w-0 rounded-lg border border-white/10 bg-slate-900/70 p-3">
                              <div className="mb-1 text-[11px] font-semibold uppercase text-slate-500">
                                {copy.previewCurrent}
                              </div>
                              <pre className="max-h-40 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-300">
                                {formatPreviewValue(currentSnapshot?.[row.key], adminLocale)}
                              </pre>
                            </div>
                            <div className="min-w-0 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
                              <div className="mb-1 text-[11px] font-semibold uppercase text-amber-300/80">
                                {copy.previewRestored}
                              </div>
                              <pre className="max-h-40 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-amber-50">
                                {formatPreviewValue(row.nextValue, adminLocale)}
                              </pre>
                            </div>
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-5">
              <p className="max-w-2xl text-xs text-slate-400">{copy.restoreConfirm}</p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCloseRestorePreview}
                  disabled={restoring}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/30 hover:text-white disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  {adminLocale === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  onClick={() => void handleRestore()}
                  disabled={restoring || previewLoading || Boolean(previewError)}
                  className="flex items-center gap-1 rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  {restoring
                    ? copy.restoring
                    : adminLocale === 'ru'
                      ? 'Восстановить'
                      : 'Restore'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* keysIndex is kept in scope for future use (diff views, etc.) */}
      <div hidden>{keysIndex.size}</div>
    </AdminLayout>
  );
};

export default AdminContentHistoryPage;
