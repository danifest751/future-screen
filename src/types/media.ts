/**
 * Types for Media Library
 * Centralized media storage with tags for cases
 */

export type MediaType = 'image' | 'video';
export type UploadSource = 'admin' | 'telegram';

export interface MediaItem {
  id: string;
  name: string;
  storage_path: string;
  public_url: string;
  type: MediaType;
  mime_type: string;
  size_bytes: number;
  tags: string[];
  width?: number;
  height?: number;
  duration?: number; // in seconds for videos
  thumbnail_url?: string;
  uploaded_by: UploadSource;
  telegram_message_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CaseMediaLink {
  id: string;
  case_id: number;
  media_id: string;
  sort_order: number;
  created_at: string;
  // Joined data
  media?: MediaItem;
}

export interface MediaUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: MediaItem;
}

export interface MediaFilter {
  search?: string;
  tags?: string[];
  type?: MediaType | 'all';
  sortBy?: 'newest' | 'oldest' | 'name' | 'size';
}

export interface MediaBulkAction {
  type: 'delete' | 'add_tags' | 'remove_tags';
  mediaIds: string[];
  tags?: string[];
}

// Form types for creating/updating media
export interface MediaItemInput {
  name: string;
  tags: string[];
}

// Case with media count (for list view)
export interface CaseWithMediaCount {
  slug: string;
  title: string;
  city: string;
  date: string;
  format: string;
  summary: string;
  metrics?: string;
  services: string[];
  imageCount: number;
  videoCount: number;
  tags: string[];
}
