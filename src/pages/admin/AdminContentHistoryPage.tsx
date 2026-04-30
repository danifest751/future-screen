import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useI18n } from '../../context/I18nContext';
import {
  loadCurrentSiteContentSnapshot,
  loadEditorProfiles,
  loadPreviousSiteContentVersion,
  loadSiteContentKeys,
  loadSiteContentVersions,
  restoreSiteContentVersion,
  type EditorProfile,
  type SiteContentSnapshot,
  type SiteContentVersion,
  type SiteContentVersionOperation,
} from '../../services/siteContentVersions';
import { getAdminContentHistoryContent } from '../../content/pages/adminContentHistory';
import {
  getPreviewValue,
  isSamePreviewValue,
  restorePreviewFields,
  type PreviewSnapshot,
} from './content-history/contentHistoryUtils';
import { CompareSelectionBar } from './content-history/CompareSelectionBar';
import { ContentHistoryDiffModal } from './content-history/ContentHistoryDiffModal';
import { ContentHistoryTable } from './content-history/ContentHistoryTable';
import { ContentHistoryToolbar } from './content-history/ContentHistoryToolbar';
import { RestorePreviewModal } from './content-history/RestorePreviewModal';

const AdminContentHistoryPage = () => {
  const { adminLocale } = useI18n();
  const localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';
  const copy = getAdminContentHistoryContent(adminLocale);
  const [keys, setKeys] = useState<
    Array<{ key: string; lastEditedAt: string; lastOperation: SiteContentVersionOperation }>
  >([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [versions, setVersions] = useState<SiteContentVersion[]>([]);
  const [editorProfiles, setEditorProfiles] = useState<Map<string, EditorProfile>>(() => new Map());
  const [enabledOps, setEnabledOps] = useState<Set<SiteContentVersionOperation>>(
    () => new Set<SiteContentVersionOperation>(['INSERT', 'UPDATE', 'DELETE'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const PAGE_SIZE = 100;
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

  const hydrateEditorProfiles = useCallback(async (rows: SiteContentVersion[]) => {
    const editorIds = Array.from(
      new Set(rows.map((v) => v.editedBy).filter((id): id is string => Boolean(id)))
    );
    if (editorIds.length === 0) return;
    try {
      const profiles = await loadEditorProfiles(editorIds);
      setEditorProfiles((prev) => {
        const next = new Map(prev);
        for (const profile of profiles) next.set(profile.id, profile);
        return next;
      });
    } catch {
      // Best-effort: render uuid prefix instead of failing the page.
    }
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [keysRes, versionsRes] = await Promise.all([
        loadSiteContentKeys(),
        loadSiteContentVersions(selectedKey ? { key: selectedKey, limit: PAGE_SIZE } : { limit: PAGE_SIZE }),
      ]);
      setKeys(keysRes);
      setVersions(versionsRes);
      setHasMore(versionsRes.length === PAGE_SIZE);
      setEditorProfiles(new Map());
      await hydrateEditorProfiles(versionsRes);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [copy.loadError, hydrateEditorProfiles, selectedKey]);

  const loadMore = useCallback(async () => {
    const last = versions[versions.length - 1];
    if (!last || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await loadSiteContentVersions({
        ...(selectedKey ? { key: selectedKey } : {}),
        limit: PAGE_SIZE,
        before: last.editedAt,
      });
      setVersions((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE);
      await hydrateEditorProfiles(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.loadError);
    } finally {
      setLoadingMore(false);
    }
  }, [copy.loadError, hydrateEditorProfiles, loadingMore, selectedKey, versions]);

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

  const visibleVersions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return versions.filter((version) => {
      if (!enabledOps.has(version.operation)) return false;
      if (!query) return true;
      const haystack = [
        version.key,
        version.title,
        version.content,
        version.metaTitle,
        version.metaDescription,
        version.titleEn,
        version.contentEn,
        version.metaTitleEn,
        version.metaDescriptionEn,
      ]
        .filter((value): value is string => Boolean(value))
        .join('\n')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [enabledOps, searchQuery, versions]);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // Keep only the two most recent picks (FIFO).
      return [...prev, id].slice(-2);
    });
  }, []);

  const compareSelection = useMemo(() => {
    const items = compareIds
      .map((id) => versions.find((v) => v.id === id))
      .filter((v): v is SiteContentVersion => Boolean(v));
    if (items.length !== 2) return { items, sameKey: items.length < 2 };
    return { items, sameKey: items[0].key === items[1].key };
  }, [compareIds, versions]);

  const handleOpenCompare = useCallback(() => {
    const { items, sameKey } = compareSelection;
    if (items.length !== 2 || !sameKey) return;
    const [first, second] = items;
    // Older snapshot is "before", newer is "after".
    const [older, newer] = first.editedAt < second.editedAt ? [first, second] : [second, first];
    setDiffTarget(newer);
    setDiffBefore(older);
    setDiffAfter(newer);
    setDiffError(null);
    setDiffLoading(false);
  }, [compareSelection]);

  const toggleOp = useCallback((op: SiteContentVersionOperation) => {
    setEnabledOps((prev) => {
      const next = new Set(prev);
      if (next.has(op)) {
        next.delete(op);
      } else {
        next.add(op);
      }
      // Never end up with an empty set: toggling the last enabled op
      // re-enables all three to avoid a silent empty list.
      if (next.size === 0) {
        return new Set<SiteContentVersionOperation>(['INSERT', 'UPDATE', 'DELETE']);
      }
      return next;
    });
  }, []);

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
      <ContentHistoryToolbar
        copy={copy}
        keys={keys}
        selectedKey={selectedKey}
        onSelectedKeyChange={setSelectedKey}
        localeTag={localeTag}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onReload={() => void reload()}
        loading={loading}
        enabledOps={enabledOps}
        onToggleOp={toggleOp}
        operationStats={operationStats}
        visibleCount={visibleVersions.length}
        totalCount={versions.length}
      />

      {loadError && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {loadError}
        </div>
      )}

      {compareIds.length > 0 && (
        <CompareSelectionBar
          copy={copy}
          selectedCount={compareSelection.items.length}
          sameKey={compareSelection.sameKey}
          onReset={() => setCompareIds([])}
          onOpenCompare={handleOpenCompare}
        />
      )}

      <ContentHistoryTable
        copy={copy}
        adminLocale={adminLocale}
        localeTag={localeTag}
        loading={loading}
        versions={versions}
        visibleVersions={visibleVersions}
        editorProfiles={editorProfiles}
        compareIds={compareIds}
        onToggleCompare={toggleCompare}
        onOpenDiff={(version) => void handleOpenDiff(version)}
        onOpenRestorePreview={(version) => void handleOpenRestorePreview(version)}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={() => void loadMore()}
      />

      {diffTarget && (
        <ContentHistoryDiffModal
          copy={copy}
          adminLocale={adminLocale}
          localeTag={localeTag}
          diffTarget={diffTarget}
          diffLoading={diffLoading}
          diffError={diffError}
          changedDiffRows={changedDiffRows}
          editorProfiles={editorProfiles}
          onClose={handleCloseDiff}
        />
      )}

      {confirmTarget && (
        <RestorePreviewModal
          copy={copy}
          adminLocale={adminLocale}
          localeTag={localeTag}
          confirmTarget={confirmTarget}
          restoreTarget={restoreTarget}
          currentSnapshot={currentSnapshot}
          changedRestorePreviewRows={changedRestorePreviewRows}
          isRollbackPreview={isRollbackPreview}
          previewLoading={previewLoading}
          previewError={previewError}
          restoring={restoring}
          editorProfiles={editorProfiles}
          onClose={handleCloseRestorePreview}
          onRestore={() => void handleRestore()}
        />
      )}
    </AdminLayout>
  );
};

export default AdminContentHistoryPage;
