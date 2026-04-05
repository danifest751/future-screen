import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

/**
 * Telegram Bot Webhook Handler
 * Handles file uploads from Telegram bot to media library
 *
 * Storage: Supabase bucket "images"
 * Sessions: Supabase table "telegram_sessions" (persistent across cold starts)
 * Dedup: Supabase table "telegram_processed_messages"
 */

// Database types for media_items table
interface MediaItem {
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

// Lazy Supabase client initialization
let supabase: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    // Prefer service role key (bypasses RLS), fall back to anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Webhook] Missing env vars:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      });
      throw new Error('SUPABASE_URL must be configured along with SUPABASE_SERVICE_ROLE_KEY');
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[Webhook] SUPABASE_SERVICE_ROLE_KEY not set! Session storage and dedup will fail. Add it to Vercel env vars.');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};

interface TelegramUpdate {
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
    caption?: string;
    from?: {
      id: number;
      username?: string;
      first_name?: string;
    };
  };
  callback_query?: {
    id: string;
    from: { id: number };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
}

// ── Session management (Supabase persistent + in-memory fallback) ──────────

type SessionState = 'awaiting_tags' | 'awaiting_files' | 'awaiting_new_tag';

interface Session {
  state: SessionState;
  selectedTags: string[];
}

// In-memory fallback (used when Supabase service_role unavailable)
const sessionCache = new Map<number, Session & { lastActivity: number }>();

const hasServiceRole = () => !!process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSession = async (chatId: number): Promise<Session | null> => {
  // Try Supabase first if service role is configured
  if (hasServiceRole()) {
    try {
      const { data, error } = await getSupabaseClient()
        .from('telegram_sessions')
        .select('state, selected_tags')
        .eq('chat_id', chatId)
        .single();

      if (!error && data) {
        return {
          state: data.state as SessionState,
          selectedTags: data.selected_tags || [],
        };
      }
    } catch (err) {
      console.error('[Session] Supabase read failed, using cache:', err);
    }
  }

  // Fallback to in-memory cache
  const cached = sessionCache.get(chatId);
  if (cached) {
    cached.lastActivity = Date.now();
    return { state: cached.state, selectedTags: cached.selectedTags };
  }
  return null;
};

const setSession = async (chatId: number, session: Session): Promise<void> => {
  // Always update in-memory cache (instant, no network call)
  sessionCache.set(chatId, { ...session, lastActivity: Date.now() });

  // Also persist to Supabase if service role key is configured (survives cold starts)
  if (hasServiceRole()) {
    try {
      await getSupabaseClient()
        .from('telegram_sessions')
        .upsert({
          chat_id: chatId,
          state: session.state,
          selected_tags: session.selectedTags,
          last_activity: Date.now(),
        });
    } catch (err) {
      console.error('[Session] Supabase write failed, session only in memory:', err);
    }
  }
};

const clearSession = async (chatId: number): Promise<void> => {
  // Always clear in-memory cache
  sessionCache.delete(chatId);

  // Also clear from Supabase if service role key is configured
  if (hasServiceRole()) {
    try {
      await getSupabaseClient()
        .from('telegram_sessions')
        .delete()
        .eq('chat_id', chatId);
    } catch (err) {
      console.error('[Session] Supabase delete failed:', err);
    }
  }
};

// ── Deduplication ────────────────────────────────────────────────────────────

const isMessageAlreadyProcessed = async (messageId: number): Promise<boolean> => {
  try {
    const { data } = await getSupabaseClient()
      .from('telegram_processed_messages')
      .select('message_id')
      .eq('message_id', messageId)
      .single();
    return !!data;
  } catch {
    return false;
  }
};

const markMessageAsProcessed = async (messageId: number): Promise<void> => {
  try {
    await getSupabaseClient()
      .from('telegram_processed_messages')
      .insert({ message_id: messageId })
      .select();
  } catch (err) {
    console.error('[Dedup] Failed to mark message:', err);
  }
};

// ── Telegram API helpers ─────────────────────────────────────────────────────

const sendTelegramMessage = async (chatId: number, text: string, options?: { replyMarkup?: unknown }) => {
  const token = process.env.TG_BOT_TOKEN;
  if (!token) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: options?.replyMarkup,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      console.error('[Telegram] sendMessage error:', err);
    }
    return response.ok;
  } catch (err) {
    console.error('[Telegram] Failed to send message:', err);
    return false;
  }
};

const getTelegramFile = async (fileId: string): Promise<{ data: ArrayBuffer } | null> => {
  const token = process.env.TG_BOT_TOKEN;
  if (!token) return null;

  try {
    const fileInfoResponse = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileInfo = await fileInfoResponse.json() as { ok: boolean; result?: { file_path?: string } };

    if (!fileInfo.ok || !fileInfo.result?.file_path) {
      console.error('[Telegram] Failed to get file info:', fileInfo);
      return null;
    }

    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.result.file_path}`;
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      console.error('[Telegram] Failed to download file, status:', fileResponse.status);
      return null;
    }

    const data = await fileResponse.arrayBuffer();
    return { data };
  } catch (err) {
    console.error('[Telegram] Error getting file:', err);
    return null;
  }
};

// ── Tags ─────────────────────────────────────────────────────────────────────

const getAllTags = async (): Promise<string[]> => {
  try {
    const { data } = await getSupabaseClient()
      .from('media_items')
      .select('tags') as { data: Pick<MediaItem, 'tags'>[] | null };

    const allTags = new Set<string>();
    data?.forEach((item) => {
      item.tags?.forEach((tag: string) => {
        if (tag) allTags.add(tag);
      });
    });

    return Array.from(allTags).sort().slice(0, 20);
  } catch {
    return [];
  }
};

// Build tag selection keyboard
const buildTagKeyboard = (allTags: string[], selectedTags: string[]) => {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];

  if (allTags.length > 0) {
    rows.push(allTags.slice(0, 4).map((t) => ({
      text: `${selectedTags.includes(t) ? '✅ ' : ''}${t}`,
      callback_data: `tag:${t}`,
    })));
    if (allTags.length > 4) {
      rows.push(allTags.slice(4, 8).map((t) => ({
        text: `${selectedTags.includes(t) ? '✅ ' : ''}${t}`,
        callback_data: `tag:${t}`,
      })));
    }
  }

  rows.push([{ text: '🏷️ Ввести новый тег', callback_data: 'newtag' }]);
  rows.push([{ text: '⏭️ Пропустить (без тега)', callback_data: 'skip' }]);
  rows.push([{ text: '✅ Готово, загрузить файлы', callback_data: 'done' }]);
  rows.push([{ text: '❌ Отмена', callback_data: 'cancel' }]);

  return { inline_keyboard: rows };
};

// ── Command handlers ─────────────────────────────────────────────────────────

const handleStart = async (chatId: number) => {
  const tags = await getAllTags();
  await setSession(chatId, { state: 'awaiting_tags', selectedTags: [] });

  const keyboard = buildTagKeyboard(tags, []);
  const message = tags.length > 0
    ? '📁 <b>Загрузка файлов в медиа-библиотеку</b>\n\nВыберите теги для файлов (можно несколько).\nИли нажмите <b>⏭️ Пропустить</b> — файлы получат тег <code>untitled</code>.'
    : '📁 <b>Загрузка файлов в медиа-библиотеку</b>\n\nТегов пока нет. Введите новый тег, или нажмите <b>⏭️ Пропустить</b> — файлы получат тег <code>untitled</code>.';

  await sendTelegramMessage(chatId, message, { replyMarkup: keyboard });
};

// ── Callback query handler ───────────────────────────────────────────────────

const handleCallbackQuery = async (update: TelegramUpdate) => {
  const callback = update.callback_query;
  if (!callback?.data || !callback.message) return;

  const chatId = callback.message.chat.id;
  const data = callback.data;
  const session = await getSession(chatId);

  // Answer callback query to remove loading indicator
  const token = process.env.TG_BOT_TOKEN;
  if (token) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callback.id }),
    }).catch(() => {});
  }

  if (data === 'cancel') {
    await clearSession(chatId);
    await sendTelegramMessage(chatId, '❌ Загрузка отменена');
    return;
  }

  if (data === 'newtag') {
    if (!session) {
      await sendTelegramMessage(chatId, '⚠️ Сессия истекла. Начните сначала с /upload');
      return;
    }
    await setSession(chatId, { ...session, state: 'awaiting_new_tag' });
    await sendTelegramMessage(chatId, '🏷️ Введите название нового тега (например: концерт, студия, event):');
    return;
  }

  if (data === 'skip') {
    if (!session) {
      await sendTelegramMessage(chatId, '⚠️ Сессия истекла. Начните сначала с /upload');
      return;
    }
    await setSession(chatId, { ...session, state: 'awaiting_files', selectedTags: [] });
    await sendTelegramMessage(
      chatId,
      `⏭️ Тег пропущен — файлы получат тег <code>untitled</code>.\n\n📤 Отправьте фото или видео для загрузки:\n(можно несколько файлов подряд)`
    );
    return;
  }

  if (data === 'done') {
    if (!session) {
      await sendTelegramMessage(chatId, '⚠️ Сессия истекла. Начните сначала с /upload');
      return;
    }
    await setSession(chatId, { ...session, state: 'awaiting_files' });
    const tagsDisplay = session.selectedTags.length > 0
      ? session.selectedTags.join(', ')
      : '<code>untitled</code> (будет присвоен автоматически)';
    await sendTelegramMessage(
      chatId,
      `🏷️ <b>Теги:</b> ${tagsDisplay}\n\n📤 Отправьте фото или видео для загрузки:\n(можно несколько файлов подряд)`
    );
    return;
  }

  if (data.startsWith('tag:')) {
    const tag = data.slice(4);
    if (!session) {
      await sendTelegramMessage(chatId, '⚠️ Сессия истекла. Начните сначала с /upload');
      return;
    }

    const newTags = session.selectedTags.includes(tag)
      ? session.selectedTags.filter((t) => t !== tag)
      : [...session.selectedTags, tag];

    await setSession(chatId, { ...session, selectedTags: newTags });

    // Update keyboard
    const allTags = await getAllTags();
    const keyboard = buildTagKeyboard(allTags, newTags);

    if (token && callback.message.message_id) {
      await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: callback.message.message_id,
          reply_markup: keyboard,
        }),
      }).catch(() => {});
    }
  }
};

// ── File upload handler ──────────────────────────────────────────────────────

const handleFileUpload = async (update: TelegramUpdate) => {
  const message = update.message;
  if (!message?.chat.id) return;

  const chatId = message.chat.id;
  const session = await getSession(chatId);

  if (!session || session.state !== 'awaiting_files') {
    await sendTelegramMessage(chatId, 'ℹ️ Для загрузки файлов используйте команду /upload');
    return;
  }

  // Determine file type
  let fileInfo: {
    fileId: string;
    fileName: string;
    mimeType: string;
    fileSize?: number;
    width?: number;
    height?: number;
    duration?: number;
  } | null = null;

  if (message.photo && message.photo.length > 0) {
    const photo = message.photo[message.photo.length - 1];
    fileInfo = {
      fileId: photo.file_id,
      fileName: `photo_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      width: photo.width,
      height: photo.height,
    };
  } else if (message.video) {
    fileInfo = {
      fileId: message.video.file_id,
      fileName: `video_${Date.now()}.mp4`,
      mimeType: message.video.mime_type || 'video/mp4',
      fileSize: message.video.file_size,
      width: message.video.width,
      height: message.video.height,
      duration: message.video.duration,
    };
  } else if (message.document) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(message.document.mime_type || '')) {
      await sendTelegramMessage(chatId, '⚠️ Неподдерживаемый формат. Разрешены: JPG, PNG, GIF, WEBP, MP4, WEBM, MOV');
      return;
    }
    fileInfo = {
      fileId: message.document.file_id,
      fileName: message.document.file_name || `file_${Date.now()}`,
      mimeType: message.document.mime_type || 'application/octet-stream',
      fileSize: message.document.file_size,
    };
  }

  if (!fileInfo) {
    await sendTelegramMessage(chatId, '⚠️ Не удалось получить информацию о файле');
    return;
  }

  await sendTelegramMessage(chatId, '⏳ Загрузка файла...');

  // Download from Telegram
  const fileData = await getTelegramFile(fileInfo.fileId);
  if (!fileData) {
    await sendTelegramMessage(chatId, '❌ Ошибка загрузки файла из Telegram');
    return;
  }

  // Generate storage path
  const isVideo = fileInfo.mimeType.startsWith('video/');
  const folder = isVideo ? 'videos' : 'images';
  const ext = fileInfo.fileName.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
  const storagePath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

  // Upload to Supabase Storage (bucket: "images")
  const { error: uploadError } = await getSupabaseClient().storage
    .from('images')
    .upload(storagePath, fileData.data, {
      contentType: fileInfo.mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error('[Storage] Upload error:', uploadError);
    await sendTelegramMessage(chatId, `❌ Ошибка сохранения файла: ${uploadError.message}`);
    return;
  }

  // Get public URL
  const { data: urlData } = getSupabaseClient().storage.from('images').getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // Save to media_items table
  const mediaType = isVideo ? 'video' : 'image';
  const { error: dbError } = await getSupabaseClient().from('media_items').insert([{
    name: fileInfo.fileName,
    storage_path: storagePath,
    public_url: publicUrl,
    type: mediaType,
    mime_type: fileInfo.mimeType,
    size_bytes: fileInfo.fileSize || fileData.data.byteLength,
    tags: session.selectedTags.length > 0 ? session.selectedTags : ['untitled'],
    width: fileInfo.width,
    height: fileInfo.height,
    duration: fileInfo.duration,
    uploaded_by: 'telegram',
    telegram_message_id: message.message_id,
  }] as unknown as MediaItem[]);

  if (dbError) {
    console.error('[DB] Insert error:', dbError);
    await sendTelegramMessage(chatId, `❌ Ошибка сохранения в базу данных: ${dbError.message}`);
    return;
  }

  await sendTelegramMessage(
    chatId,
    `✅ <b>Файл загружен!</b>\n\n` +
    `📂 Путь: <code>${storagePath}</code>\n` +
    `🏷️ <b>Теги:</b> ${session.selectedTags.length > 0 ? session.selectedTags.join(', ') : 'untitled'}\n\n` +
    `Отправьте ещё файлы или используйте /upload для новой сессии.`
  );
};

// ── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.TG_BOT_TOKEN;
  console.log('[Webhook] Request:', req.method, 'Token:', !!token);

  // ── Management endpoints (GET) ──────────────────────────────────────────────
  if (req.method === 'GET') {
    if (!token) return res.status(500).json({ error: 'TG_BOT_TOKEN not configured' });

    if (req.query?.action === 'setWebhook') {
      const webhookUrl = req.query.url as string;
      if (!webhookUrl) return res.status(400).json({ error: 'url query param required' });

      try {
        const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'callback_query'] }),
        });
        return res.status(200).json(await r.json());
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    }

    if (req.query?.action === 'getWebhookInfo') {
      try {
        const r = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        return res.status(200).json(await r.json());
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    }

    return res.status(200).json({ ok: true, message: 'Telegram Webhook is running' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Webhook secret verification ──────────────────────────────────────────────
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (secret !== webhookSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (!token) {
    console.error('[Webhook] TG_BOT_TOKEN not configured!');
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  // ── Process update ───────────────────────────────────────────────────────────
  try {
    const update: TelegramUpdate = req.body;

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      await handleCallbackQuery(update);
      return res.status(200).json({ ok: true });
    }

    // Handle messages
    if (update.message) {
      const { message } = update;
      const chatId = message.chat.id;
      const text = message.text || '';

      // Deduplication check
      const alreadyProcessed = await isMessageAlreadyProcessed(message.message_id);
      if (alreadyProcessed) {
        console.log('[Dedup] Skipping already processed message:', message.message_id);
        return res.status(200).json({ ok: true });
      }
      await markMessageAsProcessed(message.message_id);

      const session = await getSession(chatId);

      // Handle new tag input
      if (session?.state === 'awaiting_new_tag' && text && !text.startsWith('/')) {
        const newTag = text.trim().toLowerCase();
        if (newTag.length > 0 && newTag.length <= 50) {
          const newTags = session.selectedTags.includes(newTag)
            ? session.selectedTags
            : [...session.selectedTags, newTag];
          await setSession(chatId, { ...session, state: 'awaiting_tags', selectedTags: newTags });
          await sendTelegramMessage(
            chatId,
            `✅ Тег "${newTag}" добавлен.\n\n<b>Выбранные теги:</b> ${newTags.join(', ')}\n\nНажмите "Готово" когда закончите выбор.`
          );
        } else {
          await sendTelegramMessage(chatId, '⚠️ Тег должен быть от 1 до 50 символов. Попробуйте ещё раз.');
        }
        return res.status(200).json({ ok: true });
      }

      // Commands
      if (text === '/start' || text === '/upload') {
        await handleStart(chatId);
        return res.status(200).json({ ok: true });
      }

      if (text === '/help') {
        await sendTelegramMessage(
          chatId,
          '📖 <b>Справка по боту</b>\n\n' +
          '/upload — Загрузить файлы в медиа-библиотеку\n' +
          '/help — Показать эту справку\n\n' +
          '<b>Как загрузить файлы:</b>\n' +
          '1. Отправьте /upload\n' +
          '2. Выберите теги или введите новый\n' +
          '3. Нажмите "Готово"\n' +
          '4. Отправьте фото или видео'
        );
        return res.status(200).json({ ok: true });
      }

      // File uploads
      if (message.photo || message.video || message.document) {
        await handleFileUpload(update);
        return res.status(200).json({ ok: true });
      }

      // Default
      await sendTelegramMessage(
        chatId,
        'ℹ️ Отправьте /upload для загрузки файлов или /help для справки'
      );
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[Webhook] Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
