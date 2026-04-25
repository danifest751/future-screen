import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, RotateCcw, Filter, Check, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useI18n } from '../../context/I18nContext';
import {
  loadCurrentSiteContentSnapshot,
  loadPreviousSiteContentVersion,
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

const summarizeSnapshot = (v: SiteContentVersion, adminLocale: 'ru' | 'en'): string => {
  const pieces: string[] = [];
  const charsLabel = adminLocale === 'ru' ? 'симв.' : 'chars';
  const yesLabel = adminLocale === 'ru' ? 'да' : 'yes';
  const noLabel = adminLocale === 'ru' ? 'нет' : 'no';
  const emptyLabel = adminLocale === 'ru' ? 'пусто' : 'empty';

  if (v.title) {
    pieces.push(`${adminLocale === 'ru' ? 'Заголовок RU' : 'Title RU'}: ${JSON.stringify(v.title.slice(0, 40))}`);
  }
  if (v.content) {
    pieces.push(`RU: ${v.content.length} ${charsLabel}`);
  }
  if (v.metaTitle) {
    pieces.push(`Meta RU: ${JSON.stringify(v.metaTitle.slice(0, 32))}`);
  }
  if (v.titleEn) {
    pieces.push(`${adminLocale === 'ru' ? 'Заголовок EN' : 'Title EN'}: ${JSON.stringify(v.titleEn.slice(0, 40))}`);
  }
  if (v.contentEn) {
    pieces.push(`EN: ${v.contentEn.length} ${charsLabel}`);
  }
  if (v.metaTitleEn) {
    pieces.push(`Meta EN: ${JSON.stringify(v.metaTitleEn.slice(0, 32))}`);
  }
  if (v.isPublished !== null && v.isPublished !== undefined) {
    pieces.push(`${adminLocale === 'ru' ? 'Опубликовано' : 'Published'}: ${v.isPublished ? yesLabel : noLabel}`);
  }
  return pieces.join(' · ') || `— ${emptyLabel} —`;
};

type RestorePreviewFieldKey = Exclude<keyof SiteContentSnapshot, 'id' | 'key'>;
type PreviewSnapshot = SiteContentSnapshot | SiteContentVersion | null;

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
  currentValue: ReturnType<typeof getPreviewValue>,
  nextValue: ReturnType<typeof getPreviewValue>
): boolean => (currentValue ?? null) === (nextValue ?? null);

const getPreviewValue = (
  snapshot: PreviewSnapshot,
  key: RestorePreviewFieldKey
): SiteContentSnapshot[RestorePreviewFieldKey] | SiteContentVersion[RestorePreviewFieldKey] | undefined => (
  snapshot ? snapshot[key] : null
);

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
        subtitle: 'Audit-trail правок site_content. Для UPDATE кнопка откатывает выбранную правку к предыдущему снимку, восстановление создаёт новую запись истории.',
        filterLabel: 'Ключ',
        allKeys: 'Все ключи',
        refresh: 'Обновить',
        restoreConfirm: 'Восстановить эту версию? Текущий контент будет перезаписан (новая запись в истории).',
        rollbackConfirm: 'Откатить эту правку? Текущий контент будет заменён состоянием до выбранного изменения.',
        restoring: 'Восстанавливаю…',
        restoreSuccess: 'Восстановлено',
        restoreError: 'Не удалось восстановить',
        previewLoadError: 'Не удалось загрузить текущий контент для предпросмотра',
        diffLoadError: 'Не удалось загрузить снимки для диффа',
        previousVersionMissing: 'Не найден предыдущий снимок для отката этой правки',
        showDiff: 'Показать дифф',
        diffTitle: 'Дифф изменения',
        diffIntro: 'Просмотр того, что изменилось в этой записи истории. Здесь ничего не восстанавливается.',
        diffBefore: 'До изменения',
        diffAfter: 'После изменения',
        diffClose: 'Закрыть',
        diffNoChanges: 'В этой записи не найдено отличий по сохраняемым полям.',
        diffChangedCount: (n: number) => `Изменено полей: ${n}`,
        previewRestoreTitle: 'Предпросмотр восстановления',
        previewRollbackTitle: 'Предпросмотр отката правки',
        previewRestoreIntro: 'Сравнение показывает, какие поля текущей записи будут заменены значениями из выбранной версии.',
        previewRollbackIntro: 'Сравнение показывает, какие поля вернутся к состоянию до выбранного изменения.',
        previewLoading: 'Загружаю текущую версию…',
        previewCurrent: 'Сейчас',
        previewRestored: 'Станет после восстановления',
        previewChanged: 'Изменится',
        previewClose: 'Закрыть предпросмотр',
        previewNoCurrent: 'Текущая запись не найдена. Восстановление создаст запись из выбранного снепшота.',
        previewNoChanges: 'Целевой снимок совпадает с текущим контентом. Новая запись истории будет без визуальных изменений.',
        previewChangedCount: (n: number) => `Изменится полей: ${n}`,
        rowActions: {
          INSERT: 'Восстановить',
          UPDATE: 'Откатить',
          DELETE: 'Восстановить',
        },
        primaryActions: {
          INSERT: 'Восстановить',
          UPDATE: 'Откатить правку',
          DELETE: 'Восстановить',
        },
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
        subtitle: 'site_content audit trail. UPDATE rows can be undone to the previous snapshot; restore writes a new history entry.',
        filterLabel: 'Key',
        allKeys: 'All keys',
        refresh: 'Refresh',
        restoreConfirm: 'Restore this version? Current content will be overwritten (new history entry).',
        rollbackConfirm: 'Undo this edit? Current content will be replaced with the state before the selected change.',
        restoring: 'Restoring…',
        restoreSuccess: 'Restored',
        restoreError: 'Restore failed',
        previewLoadError: 'Failed to load current content for preview',
        diffLoadError: 'Failed to load snapshots for diff',
        previousVersionMissing: 'Previous snapshot for this edit was not found',
        showDiff: 'Show diff',
        diffTitle: 'Change diff',
        diffIntro: 'Read-only view of what changed in this history entry. Nothing is restored here.',
        diffBefore: 'Before change',
        diffAfter: 'After change',
        diffClose: 'Close',
        diffNoChanges: 'No differences were found in saved fields for this entry.',
        diffChangedCount: (n: number) => `${n} fields changed`,
        previewRestoreTitle: 'Restore preview',
        previewRollbackTitle: 'Undo edit preview',
        previewRestoreIntro: 'The comparison shows which fields of the current record will be replaced by the selected snapshot.',
        previewRollbackIntro: 'The comparison shows which fields will return to the state before the selected edit.',
        previewLoading: 'Loading current version…',
        previewCurrent: 'Current',
        previewRestored: 'After restore',
        previewChanged: 'Will change',
        previewClose: 'Close preview',
        previewNoCurrent: 'Current record was not found. Restore will create the record from this snapshot.',
        previewNoChanges: 'The target snapshot matches current content. Restore will create a new history entry without visible changes.',
        previewChangedCount: (n: number) => `${n} fields will change`,
        rowActions: {
          INSERT: 'Restore',
          UPDATE: 'Undo',
          DELETE: 'Restore',
        },
        primaryActions: {
          INSERT: 'Restore',
          UPDATE: 'Undo edit',
          DELETE: 'Restore',
        },
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
  const [restoreTarget, setRestoreTarget] = useState<SiteContentVersion | null>(null);
  const [currentSnapshot, setCurrentSnapshot] = useState<SiteContentSnapshot | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [diffTarget, setDiffTarget] = useState<SiteContentVersion | null>(null);
  const [diffBefore, setDiffBefore] = useState<PreviewSnapshot>(null);
  const [diffAfter, setDiffAfter] = useState<PreviewSnapshot>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
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
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await restoreSiteContentVersion(restoreTarget);
      toast.success(copy.restoreSuccess);
      setConfirmTarget(null);
      setRestoreTarget(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.restoreError);
    } finally {
      setRestoring(false);
    }
  }, [copy.restoreError, copy.restoreSuccess, reload, restoreTarget]);

  const handleOpenRestorePreview = useCallback(async (version: SiteContentVersion) => {
    setConfirmTarget(version);
    setRestoreTarget(null);
    setCurrentSnapshot(null);
    setPreviewError(null);
    setPreviewLoading(true);
    try {
      const [snapshot, previousVersion] = await Promise.all([
        loadCurrentSiteContentSnapshot(version.key),
        version.operation === 'UPDATE' ? loadPreviousSiteContentVersion(version) : Promise.resolve(null),
      ]);
      setCurrentSnapshot(snapshot);
      if (version.operation === 'UPDATE') {
        if (!previousVersion) {
          setPreviewError(copy.previousVersionMissing);
          return;
        }
        setRestoreTarget(previousVersion);
        return;
      }
      setRestoreTarget(version);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : copy.previewLoadError);
    } finally {
      setPreviewLoading(false);
    }
  }, [copy.previewLoadError, copy.previousVersionMissing]);

  const handleCloseRestorePreview = useCallback(() => {
    if (restoring) return;
    setConfirmTarget(null);
    setRestoreTarget(null);
    setCurrentSnapshot(null);
    setPreviewError(null);
    setPreviewLoading(false);
  }, [restoring]);

  const handleOpenDiff = useCallback(async (version: SiteContentVersion) => {
    setDiffTarget(version);
    setDiffBefore(null);
    setDiffAfter(null);
    setDiffError(null);

    if (version.operation === 'INSERT') {
      setDiffAfter(version);
      return;
    }

    if (version.operation === 'DELETE') {
      setDiffBefore(version);
      return;
    }

    setDiffLoading(true);
    try {
      const previousVersion = await loadPreviousSiteContentVersion(version);
      if (!previousVersion) {
        setDiffError(copy.previousVersionMissing);
        return;
      }
      setDiffBefore(previousVersion);
      setDiffAfter(version);
    } catch (err) {
      setDiffError(err instanceof Error ? err.message : copy.diffLoadError);
    } finally {
      setDiffLoading(false);
    }
  }, [copy.diffLoadError, copy.previousVersionMissing]);

  const handleCloseDiff = useCallback(() => {
    setDiffTarget(null);
    setDiffBefore(null);
    setDiffAfter(null);
    setDiffError(null);
    setDiffLoading(false);
  }, []);

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
    if (!restoreTarget) return [];
    return restorePreviewFields.map((field) => {
      const currentValue = currentSnapshot?.[field.key];
      const nextValue = restoreTarget[field.key];
      return {
        ...field,
        currentValue,
        nextValue,
        changed: !currentSnapshot || !isSamePreviewValue(currentValue, nextValue),
      };
    });
  }, [currentSnapshot, restoreTarget]);

  const isRollbackPreview = confirmTarget?.operation === 'UPDATE';

  const changedRestorePreviewRows = useMemo(
    () => restorePreviewRows.filter((row) => row.changed),
    [restorePreviewRows]
  );

  const diffRows = useMemo(() => {
    if (!diffTarget) return [];
    return restorePreviewFields.map((field) => {
      const beforeValue = getPreviewValue(diffBefore, field.key);
      const afterValue = getPreviewValue(diffAfter, field.key);
      return {
        ...field,
        beforeValue,
        afterValue,
        changed: !isSamePreviewValue(beforeValue, afterValue),
      };
    });
  }, [diffAfter, diffBefore, diffTarget]);

  const changedDiffRows = useMemo(
    () => diffRows.filter((row) => row.changed),
    [diffRows]
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
                      <span className="block max-w-2xl truncate">{summarizeSnapshot(v, adminLocale)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => void handleOpenDiff(v)}
                          className="inline-flex items-center gap-1 rounded-lg border border-sky-500/35 bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-200 hover:border-sky-400 hover:bg-sky-500/20"
                        >
                          <Eye className="h-3 w-3" />
                          {copy.showDiff}
                        </button>
                        <button
                          onClick={() => void handleOpenRestorePreview(v)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-200 hover:border-amber-400 hover:bg-amber-500/20"
                        >
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
      </div>

      {diffTarget && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDiff();
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
            <div className="border-b border-white/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{copy.diffTitle}</h3>
                  <p className="mt-1 max-w-3xl text-sm text-slate-300">{copy.diffIntro}</p>
                </div>
                <button
                  onClick={handleCloseDiff}
                  className="rounded-lg border border-white/10 bg-slate-800 p-2 text-slate-300 hover:border-white/30 hover:text-white"
                  aria-label={copy.previewClose}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <dl className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-slate-950/50 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
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
                  <dd className="font-mono text-slate-200">{truncateEditorId(diffTarget.editedBy)}</dd>
                </div>
              </dl>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              {diffLoading ? (
                <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-8 text-sm text-slate-300">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                  {copy.previewLoading}
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
                      {changedDiffRows.map((row) => (
                        <section
                          key={row.key}
                          className="rounded-xl border border-white/10 bg-slate-950/45 p-3"
                        >
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-white">{copy.fieldLabels[row.labelKey]}</h4>
                            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-200">
                              {copy.previewChanged}
                            </span>
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            <div className="min-w-0 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                              <div className="mb-1 text-[11px] font-semibold uppercase text-red-200/80">
                                {copy.diffBefore}
                              </div>
                              <pre className="max-h-40 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-red-50">
                                {formatPreviewValue(row.beforeValue, adminLocale)}
                              </pre>
                            </div>
                            <div className="min-w-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                              <div className="mb-1 text-[11px] font-semibold uppercase text-emerald-200/80">
                                {copy.diffAfter}
                              </div>
                              <pre className="max-h-40 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-emerald-50">
                                {formatPreviewValue(row.afterValue, adminLocale)}
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

            <div className="flex justify-end border-t border-white/10 p-5">
              <button
                onClick={handleCloseDiff}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/30 hover:text-white"
              >
                <X className="h-4 w-4" />
                {copy.diffClose}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <h3 className="text-lg font-semibold text-white">
                    {isRollbackPreview ? copy.previewRollbackTitle : copy.previewRestoreTitle}
                  </h3>
                  <p className="mt-1 max-w-3xl text-sm text-slate-300">
                    {isRollbackPreview ? copy.previewRollbackIntro : copy.previewRestoreIntro}
                  </p>
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
              <p className="max-w-2xl text-xs text-slate-400">
                {isRollbackPreview ? copy.rollbackConfirm : copy.restoreConfirm}
              </p>
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
      )}

      {/* keysIndex is kept in scope for future use (diff views, etc.) */}
      <div hidden>{keysIndex.size}</div>
    </AdminLayout>
  );
};

export default AdminContentHistoryPage;
