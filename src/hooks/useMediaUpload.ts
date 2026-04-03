/**
 * Hook for uploading media files to Supabase Storage
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { compressImages, isImageFile, formatFileSize } from '../lib/imageCompression';
import { useCreateMediaItemMutation } from '../queries/mediaLibrary';
import type { MediaItem, MediaUploadProgress, MediaType } from '../types/media';

export interface UploadOptions {
  tags?: string[];
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  item?: MediaItem;
  error?: string;
}

const getMediaType = (file: File): MediaType => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  // Default to image for unknown types
  return 'image';
};

const generateFilePath = (file: File): string => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isVideo = !isImageFile(file);
  const folder = isVideo ? 'videos' : 'images';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `${folder}/${timestamp}-${random}.${ext}`;
};

export const useMediaUpload = () => {
  const [uploads, setUploads] = useState<MediaUploadProgress[]>([]);
  const createMediaMutation = useCreateMediaItemMutation();

  const updateUploadProgress = useCallback((file: File, updates: Partial<MediaUploadProgress>) => {
    setUploads((prev) => {
      const index = prev.findIndex((u) => u.file === file);
      if (index === -1) {
        return [...prev, { file, progress: 0, status: 'pending', ...updates } as MediaUploadProgress];
      }
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  const uploadSingleFile = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    try {
      updateUploadProgress(file, { status: 'uploading', progress: 0 });

      // Compress images if needed
      let fileToUpload = file;
      if (isImageFile(file)) {
        updateUploadProgress(file, { status: 'processing', progress: 10 });
        const compressed = await compressImages([file], {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
        });
        fileToUpload = compressed[0] || file;
      }

      updateUploadProgress(file, { status: 'uploading', progress: 30 });

      // Generate storage path
      const filePath = generateFilePath(file);
      const bucket = 'media';

      // Check if bucket exists, fallback to 'images' if not
      let targetBucket = bucket;
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some((b) => b.name === bucket);
        if (!bucketExists) {
          // Fallback to existing 'images' bucket
          targetBucket = 'images';
        }
      } catch {
        targetBucket = 'images';
      }

      updateUploadProgress(file, { status: 'uploading', progress: 50 });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(filePath, fileToUpload, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      updateUploadProgress(file, { status: 'uploading', progress: 80 });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      updateUploadProgress(file, { status: 'uploading', progress: 90 });

      // Create media item record
      const mediaType = getMediaType(file);
      const newItem: Omit<MediaItem, 'id' | 'created_at' | 'updated_at'> = {
        name: file.name,
        storage_path: filePath,
        public_url: publicUrl,
        type: mediaType,
        mime_type: file.type,
        size_bytes: fileToUpload.size,
        tags: options.tags || [],
        uploaded_by: 'admin',
      };

      // For images, try to get dimensions
      if (mediaType === 'image') {
        try {
          const dimensions = await getImageDimensions(fileToUpload);
          newItem.width = dimensions.width;
          newItem.height = dimensions.height;
        } catch {
          // Ignore dimension errors
        }
      }

      const createdItem = await createMediaMutation.mutateAsync(newItem);

      updateUploadProgress(file, {
        status: 'completed',
        progress: 100,
        result: createdItem,
      });

      return { success: true, item: createdItem };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      updateUploadProgress(file, {
        status: 'error',
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, [createMediaMutation, updateUploadProgress]);

  const uploadFiles = useCallback(async (
    files: FileList | File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return [];

    // Initialize uploads
    setUploads(fileArray.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    })));

    // Upload files sequentially to avoid overwhelming the server
    const results: UploadResult[] = [];
    for (const file of fileArray) {
      const result = await uploadSingleFile(file, options);
      results.push(result);
      options.onProgress?.(Math.round((results.length / fileArray.length) * 100));
    }

    return results;
  }, [uploadSingleFile]);

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  const removeUpload = useCallback((file: File) => {
    setUploads((prev) => prev.filter((u) => u.file !== file));
  }, []);

  return {
    uploads,
    isUploading: uploads.some((u) => u.status === 'uploading' || u.status === 'processing'),
    uploadFiles,
    uploadSingleFile,
    clearUploads,
    removeUpload,
    completedCount: uploads.filter((u) => u.status === 'completed').length,
    errorCount: uploads.filter((u) => u.status === 'error').length,
    totalCount: uploads.length,
  };
};

// Helper to get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

export const getAcceptedFileTypes = (): string => {
  return 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime';
};

export const isValidFileType = (file: File): boolean => {
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];
  return validTypes.includes(file.type);
};

export const formatUploadStatus = (status: MediaUploadProgress['status']): string => {
  switch (status) {
    case 'pending':
      return 'Ожидает';
    case 'uploading':
      return 'Загрузка';
    case 'processing':
      return 'Обработка';
    case 'completed':
      return 'Готово';
    case 'error':
      return 'Ошибка';
    default:
      return 'Неизвестно';
  }
};
