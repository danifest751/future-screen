import { useEffect, useMemo, useState } from 'react';
import { Edit2, Film, Grid, Image, Info, List, Play, Search, Trash2, Upload, X } from 'lucide-react';
import { mediaLibraryContent } from '../../../content/components/mediaLibrary';
import { useMediaLibrary } from '../../../hooks/useMediaLibrary';
import type { MediaFilter, MediaItem } from '../../../types/media';
import { ConfirmModal } from '../ui';
import MediaBulkActions from './MediaBulkActions';
import MediaCard from './MediaCard';
import MediaTagFilter from './MediaTagFilter';
import MediaUploadModal from './MediaUploadModal';
import MediaDetailsModal from './MediaDetailsModal';
import { loadMediaUsage, type MediaUsageEntry } from '../../../services/mediaUsage';

interface MediaLibraryProps {
  onSelect?: (media: MediaItem) => void;
  selectable?: boolean;
  selectedIds?: string[];
  showUploadButton?: boolean;
}

export const MediaLibrary = ({
  onSelect,
  selectable = false,
  selectedIds = [],
  showUploadButton = true,
}: MediaLibraryProps) => {
  const [filter, setFilter] = useState<MediaFilter>({
    search: '',
    tags: [],
    type: 'all',
    sortBy: 'newest',
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [deletingMedia, setDeletingMedia] = useState<MediaItem | null>(null);
  const [viewingMedia, setViewingMedia] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteUsage, setDeleteUsage] = useState<MediaUsageEntry[] | null>(null);
  const [deleteUsageLoading, setDeleteUsageLoading] = useState(false);
  const [detailsMedia, setDetailsMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (!deletingMedia) {
      setDeleteUsage(null);
      setDeleteUsageLoading(false);
      return;
    }
    let cancelled = false;
    setDeleteUsageLoading(true);
    loadMediaUsage([deletingMedia.id])
      .then((map) => {
        if (cancelled) return;
        setDeleteUsage(map.get(deletingMedia.id) ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        // Best-effort: missing usage info shouldn't block delete; we just
        // don't surface a warning.
        setDeleteUsage(null);
      })
      .finally(() => {
        if (!cancelled) setDeleteUsageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deletingMedia]);
  const queryFilter = useMemo<MediaFilter>(() => ({
    search: '',
    tags: filter.tags,
    type: filter.type,
    sortBy: filter.sortBy,
  }), [filter.sortBy, filter.tags, filter.type]);

  const {
    mediaItems,
    allTags,
    selectedIds: localSelectedIds,
    isLoading,
    isDeleting,
    toggleSelection,
    selectAll,
    deselectAll,
    deleteSelected,
    deleteMediaItems,
    addTagsToSelected,
    removeTagsFromSelected,
    updateMediaItem,
    refetch,
  } = useMediaLibrary(queryFilter);

  const effectiveSelectedIds = selectable ? new Set(selectedIds) : localSelectedIds;

  const handleToggleSelect = (id: string) => {
    if (selectable) {
      const media = mediaItems.find((item) => item.id === id);
      if (media && onSelect) {
        onSelect(media);
      }
    } else {
      toggleSelection(id);
    }
  };

  const handleDeleteSingle = async () => {
    if (!deletingMedia) return;
    await deleteMediaItems([deletingMedia.id]);
    setDeletingMedia(null);
  };

  const handleEditSave = async () => {
    if (!editingMedia) return;
    await updateMediaItem(editingMedia.id, {
      name: editingMedia.name,
      tags: editingMedia.tags,
    });
    setEditingMedia(null);
  };

  const filteredItems = useMemo(() => {
    let items = [...mediaItems];

    if (filter.search?.trim()) {
      const search = filter.search.toLowerCase();
      items = items.filter(
        (item) => item.name.toLowerCase().includes(search) || item.tags.some((tag) => tag.toLowerCase().includes(search)),
      );
    }

    if (filter.type && filter.type !== 'all') {
      items = items.filter((item) => item.type === filter.type);
    }

    return items;
  }, [mediaItems, filter]);

  return (
    <>
      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={() => {
          refetch();
          setIsUploadModalOpen(false);
        }}
        defaultTags={filter.tags}
      />

      <MediaDetailsModal
        media={detailsMedia}
        onClose={() => setDetailsMedia(null)}
        copy={mediaLibraryContent.details}
        formatDate={(iso) => new Date(iso).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}
      />

      <ConfirmModal
        open={!!editingMedia}
        title={mediaLibraryContent.editModal.title}
        description={
          editingMedia ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-400">{mediaLibraryContent.editModal.nameLabel}</label>
                <input
                  type="text"
                  value={editingMedia.name}
                  onChange={(event) => setEditingMedia({ ...editingMedia, name: event.target.value })}
                  className="w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">{mediaLibraryContent.editModal.tagsLabel}</label>
                <input
                  type="text"
                  value={editingMedia.tags.join(', ')}
                  onChange={(event) =>
                    setEditingMedia({
                      ...editingMedia,
                      tags: event.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            ''
          )
        }
        confirmText={mediaLibraryContent.editModal.confirmText}
        cancelText={mediaLibraryContent.editModal.cancelText}
        onCancel={() => setEditingMedia(null)}
        onConfirm={handleEditSave}
      />

      <ConfirmModal
        open={!!deletingMedia}
        danger
        title={mediaLibraryContent.deleteModal.title}
        description={
          deletingMedia ? (
            <div className="space-y-3">
              <p>{mediaLibraryContent.deleteModal.description(deletingMedia.name)}</p>
              {deleteUsageLoading ? (
                <p className="text-xs text-slate-400">{mediaLibraryContent.usage.checking}</p>
              ) : deleteUsage && deleteUsage.length > 0 ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <div className="font-medium text-amber-100">
                    {mediaLibraryContent.usage.inUsePlural(deleteUsage.length)}
                  </div>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-amber-100/90">
                    {deleteUsage.slice(0, 5).map((entry) => (
                      <li key={entry.caseId}>
                        {entry.caseTitle ?? entry.caseSlug ?? `case #${entry.caseId}`}
                      </li>
                    ))}
                    {deleteUsage.length > 5 && (
                      <li>+{deleteUsage.length - 5}…</li>
                    )}
                  </ul>
                  <div className="mt-1.5 text-[11px] text-amber-200/80">
                    {mediaLibraryContent.usage.cascadeWarning}
                  </div>
                </div>
              ) : deleteUsage !== null ? (
                <p className="text-xs text-emerald-300">{mediaLibraryContent.usage.notUsed}</p>
              ) : null}
            </div>
          ) : ''
        }
        confirmText={mediaLibraryContent.deleteModal.confirmText}
        cancelText={mediaLibraryContent.deleteModal.cancelText}
        onCancel={() => setDeletingMedia(null)}
        onConfirm={handleDeleteSingle}
      />

      {viewingMedia?.type === 'video' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setViewingMedia(null)}>
          <div className="relative max-h-full max-w-4xl rounded-lg bg-black">
            <button
              onClick={() => setViewingMedia(null)}
              className="absolute right-2 top-2 z-10 rounded bg-black/50 p-1 text-white hover:bg-black/70"
            >
              <X size={20} />
            </button>
            <video src={viewingMedia.public_url} controls className="max-h-[80vh] max-w-full rounded-lg" autoPlay />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-start gap-2 rounded-lg border border-white/10 bg-slate-800 p-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={filter.search}
              onChange={(event) => setFilter({ ...filter, search: event.target.value })}
              placeholder={mediaLibraryContent.toolbar.searchPlaceholder}
              className="w-full rounded-lg border border-white/10 bg-slate-900 py-1.5 pl-10 pr-9 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
            />
            {filter.search && (
              <button
                onClick={() => setFilter({ ...filter, search: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <MediaTagFilter allTags={allTags} selectedTags={filter.tags || []} onChange={(tags) => setFilter({ ...filter, tags })} />
          </div>

          <div className="flex rounded-lg border border-white/10 bg-slate-900 p-1">
            <button
              onClick={() => setFilter({ ...filter, type: 'all' })}
              className={`rounded px-2.5 py-1 text-sm transition-colors ${
                filter.type === 'all' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {mediaLibraryContent.toolbar.typeAll}
            </button>
            <button
              onClick={() => setFilter({ ...filter, type: 'image' })}
              className={`rounded px-2.5 py-1 text-sm transition-colors ${
                filter.type === 'image' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title={mediaLibraryContent.toolbar.imagesOnlyTitle}
            >
              <Image size={16} />
            </button>
            <button
              onClick={() => setFilter({ ...filter, type: 'video' })}
              className={`rounded px-2.5 py-1 text-sm transition-colors ${
                filter.type === 'video' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title={mediaLibraryContent.toolbar.videosOnlyTitle}
            >
              <Film size={16} />
            </button>
          </div>

          <select
            value={filter.sortBy}
            onChange={(event) => setFilter({ ...filter, sortBy: event.target.value as MediaFilter['sortBy'] })}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:border-brand-500 focus:outline-none"
          >
            <option value="newest">{mediaLibraryContent.toolbar.sortNewest}</option>
            <option value="oldest">{mediaLibraryContent.toolbar.sortOldest}</option>
            <option value="name">{mediaLibraryContent.toolbar.sortName}</option>
            <option value="size">{mediaLibraryContent.toolbar.sortSize}</option>
          </select>

          <div className="flex rounded-lg border border-white/10 bg-slate-900 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-1 transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1 transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <List size={16} />
            </button>
          </div>

          {showUploadButton && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400"
            >
              <Upload size={16} />
              {mediaLibraryContent.toolbar.upload}
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/60 px-2 py-1.5 text-xs">
            <span className="text-slate-500">{mediaLibraryContent.quickTags.title}:</span>
            {allTags.slice(0, 8).map((tag) => {
              const active = (filter.tags ?? []).includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const current = filter.tags ?? [];
                    setFilter({
                      ...filter,
                      tags: active ? current.filter((t) => t !== tag) : [...current, tag],
                    });
                  }}
                  className={`rounded-full border px-2 py-0.5 transition ${
                    active
                      ? 'border-brand-500 bg-brand-500/20 text-white'
                      : 'border-white/10 bg-slate-900 text-slate-300 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {(filter.tags?.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => setFilter({ ...filter, tags: [] })}
                className="ml-auto rounded-full border border-white/10 bg-slate-900 px-2 py-0.5 text-slate-400 hover:border-white/30 hover:text-white"
              >
                {mediaLibraryContent.quickTags.clear}
              </button>
            )}
          </div>
        )}

        {!selectable && (
          <MediaBulkActions
            selectedCount={effectiveSelectedIds.size}
            totalCount={filteredItems.length}
            allTags={allTags}
            onSelectAll={() => selectAll(filteredItems.map((item) => item.id))}
            onDeselectAll={deselectAll}
            onDelete={deleteSelected}
            onAddTags={addTagsToSelected}
            onRemoveTags={removeTagsFromSelected}
            isDeleting={isDeleting}
          />
        )}

        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{isLoading ? mediaLibraryContent.results.loading : mediaLibraryContent.results.found(filteredItems.length)}</span>
          {allTags.length > 0 && <span>{mediaLibraryContent.results.totalTags(allTags.length)}</span>}
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-slate-800 p-4">
              <Image size={32} className="text-slate-500" />
            </div>
            <p className="text-lg font-medium text-slate-300">{mediaLibraryContent.empty.title}</p>
            <p className="text-sm text-slate-500">
              {filter.search || filter.tags?.length ? mediaLibraryContent.empty.filteredDescription : mediaLibraryContent.empty.initialDescription}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {filteredItems.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                isSelected={effectiveSelectedIds.has(media.id)}
                onToggleSelect={() => handleToggleSelect(media.id)}
                onEdit={!selectable ? setEditingMedia : undefined}
                onDelete={!selectable ? setDeletingMedia : undefined}
                onShowDetails={!selectable ? setDetailsMedia : undefined}
                selectable
                showActions={!selectable}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredItems.map((media) => (
              <div
                key={media.id}
                onClick={() => handleToggleSelect(media.id)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                  effectiveSelectedIds.has(media.id) ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-slate-800 hover:border-white/20'
                }`}
              >
                {media.type === 'image' ? (
                  <img src={media.public_url} alt={media.name} className="h-10 w-12 rounded object-cover" />
                ) : (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setViewingMedia(media);
                    }}
                    className="group relative flex h-10 w-12 items-center justify-center rounded bg-slate-700 transition-colors hover:bg-slate-600"
                  >
                    <Film size={20} className="text-slate-400" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <Play size={14} className="text-white" fill="white" />
                    </div>
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{media.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{media.type === 'image' ? mediaLibraryContent.list.image : mediaLibraryContent.list.video}</span>
                    <span>{mediaLibraryContent.list.separator}</span>
                    <span>{new Date(media.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {media.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                      {tag}
                    </span>
                  ))}
                  {media.tags.length > 3 && <span className="text-xs text-slate-500">+{media.tags.length - 3}</span>}
                  {!selectable && (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDetailsMedia(media);
                        }}
                        className="ml-2 rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                        title={mediaLibraryContent.details.triggerTitle}
                      >
                        <Info size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditingMedia(media);
                        }}
                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                        title={mediaLibraryContent.editModal.title}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeletingMedia(media);
                        }}
                        className="rounded p-1 text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-100"
                        title={mediaLibraryContent.deleteModal.title}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MediaLibrary;
