// GET /api/visual-led/load?id=<uuid>
// Возвращает state сохранённого проекта. Анонимно — RLS на таблице
// разрешает SELECT всем, но идём через service_role для надёжности
// и независимости от настроек anon API.
//
// Также резолвит signed URL'ы для фоновых изображений в Storage
// (bucket приватный, поэтому клиенту нельзя просто собрать public URL).
// Urls живут 24 часа, этого достаточно для сессии редактирования; при
// повторном открытии ссылки клиент снова дёргает этот endpoint.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { applyCors } from '../_lib/cors.js';

let supabaseAdmin: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing for visual-led/load');
  supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  return supabaseAdmin;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_URL_TTL_SEC = 60 * 60 * 24;

type BackgroundLike = {
  storagePath?: string | null;
  storageBucket?: string | null;
  src?: string;
};

type SceneLike = { backgrounds?: BackgroundLike[] };

async function resolveBackgroundSrcUrls(
  supabase: SupabaseClient,
  state: { scenes?: SceneLike[] },
): Promise<void> {
  const scenes = Array.isArray(state.scenes) ? state.scenes : [];
  for (const scene of scenes) {
    const bgs = Array.isArray(scene.backgrounds) ? scene.backgrounds : [];
    for (const bg of bgs) {
      if (!bg?.storagePath || !bg?.storageBucket) continue;
      try {
        const { data, error } = await supabase.storage
          .from(bg.storageBucket)
          .createSignedUrl(bg.storagePath, SIGNED_URL_TTL_SEC);
        if (!error && data?.signedUrl) {
          bg.src = data.signedUrl;
        }
      } catch (err) {
        console.warn('[visual-led/load] signed url error', err);
      }
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = applyCors(req, res, { methods: 'GET, OPTIONS' });
  if (cors === 'reject') return res.status(403).json({ error: 'Forbidden origin' });
  if (cors === 'preflight') return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const rawId = req.query.id;
  const id = Array.isArray(rawId) ? rawId[0] : String(rawId || '').trim();
  if (!id || !UUID_RE.test(id)) {
    return res.status(400).json({ error: 'Invalid or missing project id' });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('visual_led_projects')
      .select('id, state, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Project not found' });

    const state = (data.state && typeof data.state === 'object' ? data.state : {}) as {
      scenes?: SceneLike[];
    };
    await resolveBackgroundSrcUrls(supabase, state);

    return res.status(200).json({
      ok: true,
      id: data.id,
      state,
      createdAt: data.created_at,
    });
  } catch (err) {
    console.error('[visual-led/load] error', err);
    return res.status(500).json({ error: 'Failed to load project' });
  }
}
