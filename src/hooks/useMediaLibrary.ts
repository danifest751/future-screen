/**
 * Custom hooks for Media Library operations
 */

import { useCallback, useEffect, useState } from 'react';
import { useMediaLibraryQuery, useMediaTagsQuery, useDeleteMediaItemsMutation, useAddTagsMutation, useRemoveTagsMutation, useUpdateMediaItemMutation } from '../queries/mediaLibrary';
import type { MediaFilter, MediaItem } from '../types/media';

const EMPTY_MEDIA_ITEMS: MediaItem[] = [];

export const useMediaLibrary = (filter: MediaFilter = {}) => {
  const pageSize = 96;
  const [page, setPage] = useState(0);
  const { data: mediaPage, isLoading, error, refetch } = useMediaLibraryQuery(filter, {
    limit: (page + 1) * pageSize,
    offset: 0,
  });
  const { data: allTags, isLoading: isTagsLoading } = useMediaTagsQuery();
  const deleteMutation = useDeleteMediaItemsMutation();
  const addTagsMutation = useAddTagsMutation();
  const removeTagsMutation = useRemoveTagsMutation();
  const updateMutation = useUpdateMediaItemMutation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const mediaItems = mediaPage?.items ?? EMPTY_MEDIA_ITEMS;
  const totalCount = mediaPage?.total ?? mediaItems.length;

  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
  }, [filter.search, filter.sortBy, filter.tags, filter.type]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids?: string[]) => {
    if (ids) {
      setSelectedIds(new Set(ids));
      return;
    }

    if (mediaItems) {
      setSelectedIds(new Set(mediaItems.map((item) => item.id)));
    }
  }, [mediaItems]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await deleteMutation.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds, deleteMutation]);

  const deleteMediaItems = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    await deleteMutation.mutateAsync(ids);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, [deleteMutation]);

  const addTagsToSelected = useCallback(async (tags: string[]) => {
    if (selectedIds.size === 0 || tags.length === 0) return;
    await addTagsMutation.mutateAsync({ mediaIds: Array.from(selectedIds), tags });
  }, [selectedIds, addTagsMutation]);

  const removeTagsFromSelected = useCallback(async (tags: string[]) => {
    if (selectedIds.size === 0 || tags.length === 0) return;
    await removeTagsMutation.mutateAsync({ mediaIds: Array.from(selectedIds), tags });
  }, [selectedIds, removeTagsMutation]);

  const updateMediaItem = useCallback(async (id: string, updates: Partial<MediaItem>) => {
    await updateMutation.mutateAsync({ id, ...updates });
  }, [updateMutation]);

  return {
    mediaItems: mediaItems || [],
    totalCount,
    hasMore: mediaItems.length < totalCount,
    allTags: allTags || [],
    selectedIds,
    isLoading: isLoading || isTagsLoading,
    error: error?.message || null,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    toggleSelection,
    selectAll,
    deselectAll,
    deleteSelected,
    deleteMediaItems,
    addTagsToSelected,
    removeTagsFromSelected,
    updateMediaItem,
    loadMore: () => setPage((value) => value + 1),
    refetch,
  };
};

export const useMediaSelection = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const select = useCallback((id: string) => {
    setSelectedIds((prev) => new Set(prev).add(id));
  }, []);

  const deselect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const setMultiple = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  return {
    selectedIds,
    selectedArray: Array.from(selectedIds),
    hasSelection: selectedIds.size > 0,
    selectionCount: selectedIds.size,
    toggle,
    select,
    deselect,
    clear,
    setMultiple,
    isSelected: useCallback((id: string) => selectedIds.has(id), [selectedIds]),
  };
};
