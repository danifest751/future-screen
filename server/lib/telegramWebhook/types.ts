export interface MediaItem {
  id?: string;
  name: string;
  storage_path: string;
  public_url: string;
  type: 'image' | 'video';
  mime_type: string;
  size_bytes?: number;
  tags: string[];
  width?: number;
  height?: number;
  duration?: number;
  uploaded_by?: string;
  telegram_message_id?: number;
  created_at?: string;
}

export interface TelegramUpdate {
  update_id?: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
    photo?: Array<{
      file_id: string;
      file_unique_id: string;
      width: number;
      height: number;
    }>;
    video?: {
      file_id: string;
      file_unique_id: string;
      width?: number;
      height?: number;
      duration?: number;
      mime_type?: string;
      file_size?: number;
    };
    document?: {
      file_id: string;
      file_unique_id: string;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
  };
  callback_query?: {
    id: string;
    from: { id: number };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
}

export type SessionState = 'awaiting_tags' | 'awaiting_files' | 'awaiting_new_tag';

export interface Session {
  state: SessionState;
  selectedTags: string[];
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface TelegramFileInfo {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
}
