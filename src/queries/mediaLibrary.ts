/**
 * React Query hooks for Media Library
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { MediaItem, MediaFilter, CaseMediaLink } from '../types/media';

// ============================================
// Query Keys
// ============================================
export const mediaQueryKeys = {
  all: ['media'] as const,
  lists: () => [...mediaQueryKeys.all, 'list'] as const,
  list: (filter: MediaFilter) => [...mediaQueryKeys.lists(), filter] as const,
  details: () => [...mediaQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...mediaQueryKeys.details(), id] as const,
  tags: () => [...mediaQueryKeys.all, 'tags'] as const,
  caseMedia: (caseId: number) => [...mediaQueryKeys.all, 'case', caseId] as const,
};

// ============================================
// Queries
// ============================================

/**
 * Get all media items with optional filtering
 */
export function useMediaLibraryQuery(filter: MediaFilter = {}) {
  return useQuery({
    queryKey: mediaQueryKeys.list(filter),
    queryFn: async () => {
      let query = supabase
        .from('media_items')
        .select('*');

      // Apply type filter
      if (filter.type && filter.type !== 'all') {
        query = query.eq('type', filter.type);
      }

      // Apply search filter
      if (filter.search?.trim()) {
        query = query.ilike('name', `%${filter.search.trim()}%`);
      }

      // Apply tags filter
      if (filter.tags && filter.tags.length > 0) {
        // Use overlap operator for tag matching
        query = query.contains('tags', filter.tags);
      }

      // Apply sorting
      switch (filter.sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'size':
          query = query.order('size_bytes', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as MediaItem[];
    },
  });
}

/**
 * Get a single media item by ID
 */
export function useMediaItemQuery(id: string | undefined) {
  return useQuery({
    queryKey: mediaQueryKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as MediaItem;
    },
    enabled: !!id,
  });
}

/**
 * Get all unique tags from media items
 */
export function useMediaTagsQuery() {
  return useQuery({
    queryKey: mediaQueryKeys.tags(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_items')
        .select('tags');

      if (error) throw error;

      // Extract unique tags
      const allTags = new Set<string>();
      data?.forEach((item) => {
        item.tags?.forEach((tag: string) => {
          if (tag) allTags.add(tag);
        });
      });

      return Array.from(allTags).sort();
    },
  });
}

/**
 * Get media items linked to a specific case
 */
export function useCaseMediaQuery(caseId: number | undefined) {
  return useQuery({
    queryKey: mediaQueryKeys.caseMedia(caseId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_media_links')
        .select(`
          *,
          media:media_id (*)
        `)
        .eq('case_id', caseId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as CaseMediaLink[];
    },
    enabled: !!caseId,
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Create a new media item (metadata only, file uploaded separately)
 */
export function useCreateMediaItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Omit<MediaItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('media_items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;
      return data as MediaItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.tags() });
    },
  });
}

/**
 * Update media item metadata
 */
export function useUpdateMediaItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MediaItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('media_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as MediaItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.tags() });
    },
  });
}

/**
 * Delete media items by IDs
 */
export function useDeleteMediaItemsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Get storage paths for cleanup
      const { data: items } = await supabase
        .from('media_items')
        .select('storage_path')
        .in('id', ids);

      // Delete from database
      const { error } = await supabase
        .from('media_items')
        .delete()
        .in('id', ids);

      if (error) throw error;

      // Return storage paths for cleanup
      return items?.map((i) => i.storage_path) || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.tags() });
    },
  });
}

/**
 * Bulk add tags to media items
 */
export function useAddTagsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaIds, tags }: { mediaIds: string[]; tags: string[] }) => {
      const { data: items, error: fetchError } = await supabase
        .from('media_items')
        .select('id, tags')
        .in('id', mediaIds);

      if (fetchError) throw fetchError;

      // Update each item with merged tags
      const updates = items?.map((item) => {
        const currentTags = item.tags || [];
        const newTags = [...new Set([...currentTags, ...tags])];
        return supabase
          .from('media_items')
          .update({ tags: newTags })
          .eq('id', item.id);
      }) || [];

      await Promise.all(updates);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.tags() });
    },
  });
}

/**
 * Bulk remove tags from media items
 */
export function useRemoveTagsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaIds, tags }: { mediaIds: string[]; tags: string[] }) => {
      const { data: items, error: fetchError } = await supabase
        .from('media_items')
        .select('id, tags')
        .in('id', mediaIds);

      if (fetchError) throw fetchError;

      // Update each item with tags removed
      const updates = items?.map((item) => {
        const currentTags = item.tags || [];
        const newTags = currentTags.filter((t: string) => !tags.includes(t));
        return supabase
          .from('media_items')
          .update({ tags: newTags })
          .eq('id', item.id);
      }) || [];

      await Promise.all(updates);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.tags() });
    },
  });
}

/**
 * Link media to a case
 */
export function useLinkMediaToCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, mediaIds }: { caseId: number; mediaIds: string[] }) => {
      // Get current max sort order
      const { data: existing } = await supabase
        .from('case_media_links')
        .select('sort_order')
        .eq('case_id', caseId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const startOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      // Create links
      const links = mediaIds.map((mediaId, index) => ({
        case_id: caseId,
        media_id: mediaId,
        sort_order: startOrder + index,
      }));

      const { error } = await supabase
        .from('case_media_links')
        .insert(links);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.caseMedia(variables.caseId) });
    },
  });
}

/**
 * Unlink media from a case
 */
export function useUnlinkMediaFromCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, mediaIds }: { caseId: number; mediaIds: string[] }) => {
      const { error } = await supabase
        .from('case_media_links')
        .delete()
        .eq('case_id', caseId)
        .in('media_id', mediaIds);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.caseMedia(variables.caseId) });
    },
  });
}

/**
 * Reorder case media
 */
export function useReorderCaseMediaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, mediaIds }: { caseId: number; mediaIds: string[] }) => {
      // Update sort_order for each link
      const updates = mediaIds.map((mediaId, index) =>
        supabase
          .from('case_media_links')
          .update({ sort_order: index })
          .eq('case_id', caseId)
          .eq('media_id', mediaId)
      );

      await Promise.all(updates);
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.caseMedia(variables.caseId) });
    },
  });
}
