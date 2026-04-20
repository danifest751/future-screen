/**
 * Custom hooks for Media Library operations
 */

import { useCallback, useState } from 'react';
import { useMediaLibraryQuery, useMediaTagsQuery, useDeleteMediaItemsMutation, useAddTagsMutation, useRemoveTagsMutation, useUpdateMediaItemMutation } from '../queries/mediaLibrary';
import type { MediaFilter, MediaItem } from '../types/media';

export const useMediaLibrary = (filter: MediaFilter = {}) => {
  const { data: mediaItems, isLoading, error, refetch } = useMediaLibraryQuery(filter);
  const { data: allTags, isLoading: isTagsLoading } = useMediaTagsQuery();
  const deleteMutation = useDeleteMediaItemsMutation();
  const addTagsMutation = useAddTagsMutation();
  const removeTagsMutation = useRemoveTagsMutation();
  const updateMutation = useUpdateMediaItemMutation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const selectAll = useCallback(() => {
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
    addTagsToSelected,
    removeTagsFromSelected,
    updateMediaItem,
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
