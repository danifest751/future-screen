export type VisualLedSession = {
  id: string;
  session_key: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  page_url: string | null;
  referrer: string | null;
  client_ip: string | null;
  user_agent: string | null;
  timezone: string | null;
  is_admin: boolean;
  summary: Record<string, unknown>;
  // The detail endpoint returns these; the list endpoint omits them.
  utm?: Record<string, unknown> | null;
  viewport?: Record<string, unknown> | null;
  screen?: Record<string, unknown> | null;
  device?: Record<string, unknown> | null;
  accept_language?: string | null;
  admin_user_id?: string | null;
};

export type VisualLedEvent = {
  id: number;
  ts: string;
  event_type: string;
  scene_id: string | null;
  screen_id: string | null;
  payload: Record<string, unknown>;
};

export type VisualLedAsset = {
  id: string;
  created_at: string;
  asset_type: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_bucket: string;
  storage_path: string;
  meta: Record<string, unknown>;
  preview_url?: string | null;
};

export type VisualLedSessionDetail = {
  session: VisualLedSession;
  events: VisualLedEvent[];
  assets: VisualLedAsset[];
};

export type VisualLedSessionListResult = {
  items: VisualLedSession[];
  total: number;
  limit: number;
  offset: number;
};

export type ReportShareItem = {
  id: number;
  at: string;
  url: string;
  scope: string | null;
  previewImage: string | null;
  screensCurrent: number | null;
  scenesTotal: number | null;
  backgroundsTotal: number | null;
};
