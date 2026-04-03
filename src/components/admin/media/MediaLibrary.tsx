import { useState, useMemo } from 'react';
import { Search, Upload, Image, Film, Grid, List, X } from 'lucide-react';
import { useMediaLibrary } from '../../../hooks/useMediaLibrary';
import type { MediaFilter, MediaItem } from '../../../types/media';
import MediaCard from './MediaCard';
import MediaTagFilter from './MediaTagFilter';
import MediaBulkActions from './MediaBulkActions';
import MediaUploadModal from './MediaUploadModal';
import { ConfirmModal } from '../ui';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    addTagsToSelected,
    removeTagsFromSelected,
    updateMediaItem,
    refetch,
  } = useMediaLibrary(filter);

  // Use external or internal selection
  const effectiveSelectedIds = selectable
    ? new Set(selectedIds)
    : localSelectedIds;

  const handleToggleSelect = (id: string) => {
    if (selectable) {
      // For external selection mode
      const media = mediaItems.find((m) => m.id === id);
      if (media && onSelect) {
        onSelect(media);
      }
    } else {
      toggleSelection(id);
    }
  };

  const handleDeleteSingle = async () => {
    if (!deletingMedia) return;
    await deleteSelected();
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

    // Apply search filter
    if (filter.search?.trim()) {
      const search = filter.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    // Apply type filter
    if (filter.type && filter.type !== 'all') {
      items = items.filter((item) => item.type === filter.type);
    }

    return items;
  }, [mediaItems, filter]);

  return (
    <>
      {/* Upload Modal */}
      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={() => {
          refetch();
          setIsUploadModalOpen(false);
        }}
        defaultTags={filter.tags}
      />

      {/* Edit Modal */}
      <ConfirmModal
        open={!!editingMedia}
        title="Редактировать медиафайл"
        description={
          editingMedia ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-400">Название</label>
                <input
                  type="text"
                  value={editingMedia.name}
                  onChange={(e) =>
                    setEditingMedia({ ...editingMedia, name: e.target.value })
                  }
                  className="w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Теги (через запятую)</label>
                <input
                  type="text"
                  value={editingMedia.tags.join(', ')}
                  onChange={(e) =>
                    setEditingMedia({
                      ...editingMedia,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  className="w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          ) : ''
        }
        confirmText="Сохранить"
        cancelText="Отмена"
        onCancel={() => setEditingMedia(null)}
        onConfirm={handleEditSave}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deletingMedia}
        danger
        title="Удалить файл?"
        description={`Файл "${deletingMedia?.name}" будет удален без возможности восстановления.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setDeletingMedia(null)}
        onConfirm={handleDeleteSingle}
      />

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-slate-800 p-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              placeholder="Поиск по названию или тегам..."
              className="w-full rounded-lg border border-white/10 bg-slate-900 py-2 pl-10 pr-9 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
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

          {/* Tag Filter */}
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <MediaTagFilter
              allTags={allTags}
              selectedTags={filter.tags || []}
              onChange={(tags) => setFilter({ ...filter, tags })}
            />
          </div>

          {/* Type Filter */}
          <div className="flex rounded-lg border border-white/10 bg-slate-900 p-1">
            <button
              onClick={() => setFilter({ ...filter, type: 'all' })}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                filter.type === 'all'
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter({ ...filter, type: 'image' })}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                filter.type === 'image'
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Только изображения"
            >
              <Image size={16} />
            </button>
            <button
              onClick={() => setFilter({ ...filter, type: 'video' })}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                filter.type === 'video'
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Только видео"
            >
              <Film size={16} />
            </button>
          </div>

          {/* Sort */}
          <select
            value={filter.sortBy}
            onChange={(e) =>
              setFilter({ ...filter, sortBy: e.target.value as MediaFilter['sortBy'] })
            }
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-300 focus:border-brand-500 focus:outline-none"
          >
            <option value="newest">Новые сначала</option>
            <option value="oldest">Старые сначала</option>
            <option value="name">По названию</option>
            <option value="size">По размеру</option>
          </select>

          {/* View Mode */}
          <div className="flex rounded-lg border border-white/10 bg-slate-900 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List size={16} />
            </button>
          </div>

          {/* Upload Button */}
          {showUploadButton && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-400"
            >
              <Upload size={16} />
              Загрузить
            </button>
          )}
        </div>

        {/* Bulk Actions */}
        {!selectable && (
          <MediaBulkActions
            selectedCount={effectiveSelectedIds.size}
            totalCount={filteredItems.length}
            allTags={allTags}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onDelete={deleteSelected}
            onAddTags={addTagsToSelected}
            onRemoveTags={removeTagsFromSelected}
            isDeleting={isDeleting}
          />
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            {isLoading ? 'Загрузка...' : `Найдено: ${filteredItems.length}`}
          </span>
          {allTags.length > 0 && (
            <span>Всего тегов: {allTags.length}</span>
          )}
        </div>

        {/* Grid/List */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-slate-800 p-4">
              <Image size={32} className="text-slate-500" />
            </div>
            <p className="text-lg font-medium text-slate-300">Медиафайлы не найдены</p>
            <p className="text-sm text-slate-500">
              {filter.search || filter.tags?.length
                ? 'Попробуйте изменить параметры фильтра'
                : 'Загрузите первые файлы, нажав кнопку выше'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredItems.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                isSelected={effectiveSelectedIds.has(media.id)}
                onToggleSelect={() => handleToggleSelect(media.id)}
                onEdit={!selectable ? setEditingMedia : undefined}
                onDelete={!selectable ? setDeletingMedia : undefined}
                selectable={true}
                showActions={!selectable}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((media) => (
              <div
                key={media.id}
                onClick={() => handleToggleSelect(media.id)}
                className={`
                  flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors
                  ${effectiveSelectedIds.has(media.id)
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-white/10 bg-slate-800 hover:border-white/20'
                  }
                `}
              >
                <img
                  src={media.public_url}
                  alt={media.name}
                  className="h-12 w-12 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{media.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{media.type === 'image' ? 'Изображение' : 'Видео'}</span>
                    <span>•</span>
                    <span>{new Date(media.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {media.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
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
