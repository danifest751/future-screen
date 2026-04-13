import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

/**
 * Telegram Bot Webhook Handler
 * Upload flow:
 * 1) /upload
 * 2) Choose tags
 * 3) Send photos/videos
 */

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
  };
  callback_query?: {
    id: string;
    from: { id: number };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
}

type SessionState = 'awaiting_tags' | 'awaiting_files' | 'awaiting_new_tag';

interface Session {
  state: SessionState;
  selectedTags: string[];
}

let supabase: SupabaseClient | null = null;
const sessionCache = new Map<number, Session & { lastActivity: number }>();

const SESSION_EXPIRED_MESSAGE =
  '⚠️ Сессия истекла.\n\nНажмите /upload и начните заново. Я подскажу каждый шаг.';

const CANCELLED_MESSAGE =
  '❌ Загрузка отменена.\n\nКогда будете готовы, отправьте /upload.';

const START_HELP_MESSAGE =
  '💡 Нужна помощь? Отправьте /help, там есть пошаговая инструкция.';

const SUPPORTED_FORMATS = 'JPG, PNG, GIF, WEBP, MP4, WEBM, MOV';

const hasServiceRole = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key) must be configured');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};

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
    console.error('[Telegram] sendMessage failed:', err);
    return false;
  }
};

const answerCallbackQuery = async (callbackQueryId: string) => {
  const token = process.env.TG_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  }).catch(() => {});
};

const getSession = async (chatId: number): Promise<Session | null> => {
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
      console.error('[Session] Supabase read failed, fallback to memory:', err);
    }
  }

  const cached = sessionCache.get(chatId);
  if (cached) {
    cached.lastActivity = Date.now();
    return { state: cached.state, selectedTags: cached.selectedTags };
  }
  return null;
};

const setSession = async (chatId: number, session: Session): Promise<void> => {
  sessionCache.set(chatId, { ...session, lastActivity: Date.now() });

  if (hasServiceRole()) {
    try {
      await getSupabaseClient().from('telegram_sessions').upsert({
        chat_id: chatId,
        state: session.state,
        selected_tags: session.selectedTags,
        last_activity: Date.now(),
      });
    } catch (err) {
      console.error('[Session] Supabase write failed:', err);
    }
  }
};

const clearSession = async (chatId: number): Promise<void> => {
  sessionCache.delete(chatId);

  if (hasServiceRole()) {
    try {
      await getSupabaseClient().from('telegram_sessions').delete().eq('chat_id', chatId);
    } catch (err) {
      console.error('[Session] Supabase delete failed:', err);
    }
  }
};

const isMessageAlreadyProcessed = async (messageId: number): Promise<boolean> => {
  try {
    const { data } = await getSupabaseClient()
      .from('telegram_processed_messages')
      .select('message_id')
      .eq('message_id', messageId)
      .single();
    return Boolean(data);
  } catch {
    return false;
  }
};

const markMessageAsProcessed = async (messageId: number): Promise<void> => {
  try {
    await getSupabaseClient().from('telegram_processed_messages').insert({ message_id: messageId }).select();
  } catch (err) {
    console.error('[Dedup] Failed to mark message:', err);
  }
};

const getAllTags = async (): Promise<string[]> => {
  try {
    const { data } = await getSupabaseClient().from('media_items').select('tags') as {
      data: Pick<MediaItem, 'tags'>[] | null;
    };

    const tags = new Set<string>();
    data?.forEach((item) => {
      item.tags?.forEach((tag) => {
        const normalized = String(tag || '').trim().toLowerCase();
        if (normalized) tags.add(normalized);
      });
    });

    return Array.from(tags).sort().slice(0, 20);
  } catch {
    return [];
  }
};

const formatSelectedTags = (tags: string[]) => (tags.length > 0 ? tags.join(', ') : '<code>untitled</code>');

const buildTagKeyboard = (allTags: string[], selectedTags: string[]) => {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];

  if (allTags.length > 0) {
    rows.push(
      allTags.slice(0, 4).map((tag) => ({
        text: `${selectedTags.includes(tag) ? '✅ ' : ''}${tag}`,
        callback_data: `tag:${tag}`,
      })),
    );
    if (allTags.length > 4) {
      rows.push(
        allTags.slice(4, 8).map((tag) => ({
          text: `${selectedTags.includes(tag) ? '✅ ' : ''}${tag}`,
          callback_data: `tag:${tag}`,
        })),
      );
    }
  }

  rows.push([{ text: '🏷️ Добавить новый тег', callback_data: 'newtag' }]);
  rows.push([{ text: '⏭️ Без тега (будет untitled)', callback_data: 'skip' }]);
  rows.push([{ text: '✅ Теги выбраны, перейти к загрузке', callback_data: 'done' }]);
  rows.push([{ text: '❌ Отменить', callback_data: 'cancel' }]);

  return { inline_keyboard: rows };
};

const getTelegramFile = async (fileId: string): Promise<{ data: ArrayBuffer } | null> => {
  const token = process.env.TG_BOT_TOKEN;
  if (!token) return null;

  try {
    const fileInfoResponse = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileInfo = await fileInfoResponse.json() as { ok: boolean; result?: { file_path?: string } };
    if (!fileInfo.ok || !fileInfo.result?.file_path) return null;

    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.result.file_path}`;
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) return null;

    const data = await fileResponse.arrayBuffer();
    return { data };
  } catch (err) {
    console.error('[Telegram] getFile failed:', err);
    return null;
  }
};

const handleStart = async (chatId: number) => {
  const tags = await getAllTags();
  await setSession(chatId, { state: 'awaiting_tags', selectedTags: [] });

  const message =
    '📥 <b>Загрузка фото/видео в медиатеку</b>\n\n' +
    '<b>Сейчас шаг 1 из 3: выберите теги</b>\n' +
    '1. Нажмите готовые теги или добавьте новый.\n' +
    '2. Нажмите <b>✅ Теги выбраны, перейти к загрузке</b>.\n' +
    '3. Отправьте фото или видео в чат.\n\n' +
    `📎 Поддерживаемые форматы: ${SUPPORTED_FORMATS}\n` +
    '📝 Если тег не нужен, нажмите <b>⏭️ Без тега</b> (файл получит <code>untitled</code>).';

  await sendTelegramMessage(chatId, message, { replyMarkup: buildTagKeyboard(tags, []) });
};

const handleCallbackQuery = async (update: TelegramUpdate) => {
  const callback = update.callback_query;
  if (!callback?.data || !callback.message) return;

  await answerCallbackQuery(callback.id);

  const chatId = callback.message.chat.id;
  const data = callback.data;
  const session = await getSession(chatId);

  if (data === 'cancel') {
    await clearSession(chatId);
    await sendTelegramMessage(chatId, CANCELLED_MESSAGE);
    return;
  }

  if (!session) {
    await sendTelegramMessage(chatId, SESSION_EXPIRED_MESSAGE);
    return;
  }

  if (data === 'newtag') {
    await setSession(chatId, { ...session, state: 'awaiting_new_tag' });
    await sendTelegramMessage(
      chatId,
      '🏷️ <b>Шаг 1 из 3: новый тег</b>\n\n' +
      'Напишите название тега одним сообщением.\n' +
      'Примеры: <code>концерт</code>, <code>сцена</code>, <code>backstage</code>.\n\n' +
      'После этого вы вернетесь к выбору тегов.',
    );
    return;
  }

  if (data === 'skip') {
    await setSession(chatId, { ...session, state: 'awaiting_files', selectedTags: [] });
    await sendTelegramMessage(
      chatId,
      '⏭️ <b>Тег пропущен</b> (будет <code>untitled</code>).\n\n' +
      '<b>Сейчас шаг 3 из 3: отправьте файл</b>\n' +
      `📎 Форматы: ${SUPPORTED_FORMATS}\n` +
      '📤 Просто отправьте фото/видео в этот чат.\n\n' +
      START_HELP_MESSAGE,
    );
    return;
  }

  if (data === 'done') {
    await setSession(chatId, { ...session, state: 'awaiting_files' });
    await sendTelegramMessage(
      chatId,
      '✅ <b>Теги сохранены</b>\n' +
      `🏷️ Выбрано: ${formatSelectedTags(session.selectedTags)}\n\n` +
      '<b>Сейчас шаг 3 из 3: отправьте файл</b>\n' +
      `📎 Форматы: ${SUPPORTED_FORMATS}\n` +
      '📤 Можно отправить несколько файлов подряд.\n\n' +
      START_HELP_MESSAGE,
    );
    return;
  }

  if (data.startsWith('tag:')) {
    const tag = data.slice(4);
    const nextTags = session.selectedTags.includes(tag)
      ? session.selectedTags.filter((t) => t !== tag)
      : [...session.selectedTags, tag];

    await setSession(chatId, { ...session, selectedTags: nextTags });

    const token = process.env.TG_BOT_TOKEN;
    if (token && callback.message.message_id) {
      const allTags = await getAllTags();
      await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: callback.message.message_id,
          reply_markup: buildTagKeyboard(allTags, nextTags),
        }),
      }).catch(() => {});
    }
  }
};

const handleFileUpload = async (update: TelegramUpdate) => {
  const message = update.message;
  if (!message?.chat.id) return;

  const chatId = message.chat.id;
  const session = await getSession(chatId);

  if (!session) {
    await sendTelegramMessage(chatId, SESSION_EXPIRED_MESSAGE);
    return;
  }

  if (session.state !== 'awaiting_files') {
    if (session.state === 'awaiting_new_tag') {
      await sendTelegramMessage(
        chatId,
        '✍️ Сейчас вы на шаге ввода тега.\n\nСначала отправьте текст тега, затем переходите к загрузке файлов.',
      );
      return;
    }

    await sendTelegramMessage(
      chatId,
      'ℹ️ Сначала нужно выбрать теги.\n\nНажмите /upload и пройдите шаги по кнопкам.',
    );
    return;
  }

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
    const allowed = new Set([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ]);

    const mimeType = message.document.mime_type || '';
    if (!allowed.has(mimeType)) {
      await sendTelegramMessage(
        chatId,
        '⚠️ Этот формат не поддерживается.\n\n' +
        `Разрешены: ${SUPPORTED_FORMATS}\n\n` +
        'Попробуйте отправить файл в одном из этих форматов.',
      );
      return;
    }

    fileInfo = {
      fileId: message.document.file_id,
      fileName: message.document.file_name || `file_${Date.now()}`,
      mimeType: mimeType || 'application/octet-stream',
      fileSize: message.document.file_size,
    };
  }

  if (!fileInfo) {
    await sendTelegramMessage(
      chatId,
      '⚠️ Я не смог распознать вложение.\n\nОтправьте фото или видео.',
    );
    return;
  }

  await sendTelegramMessage(chatId, '⏳ Принял файл. Загружаю в медиатеку...');

  const telegramFile = await getTelegramFile(fileInfo.fileId);
  if (!telegramFile) {
    await sendTelegramMessage(
      chatId,
      '❌ Не удалось скачать файл с серверов Telegram.\n\nПопробуйте отправить файл еще раз.',
    );
    return;
  }

  const isVideo = fileInfo.mimeType.startsWith('video/');
  const folder = isVideo ? 'videos' : 'images';
  const ext = fileInfo.fileName.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
  const storagePath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error: uploadError } = await getSupabaseClient().storage
    .from('images')
    .upload(storagePath, telegramFile.data, {
      contentType: fileInfo.mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error('[Storage] Upload error:', uploadError);
    await sendTelegramMessage(
      chatId,
      '❌ Не удалось сохранить файл в хранилище.\n' +
      `Причина: <code>${uploadError.message}</code>\n\n` +
      'Попробуйте еще раз или обратитесь к администратору.',
    );
    return;
  }

  const { data: urlData } = getSupabaseClient().storage.from('images').getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  const { error: dbError } = await getSupabaseClient().from('media_items').insert([{
    name: fileInfo.fileName,
    storage_path: storagePath,
    public_url: publicUrl,
    type: isVideo ? 'video' : 'image',
    mime_type: fileInfo.mimeType,
    size_bytes: fileInfo.fileSize || telegramFile.data.byteLength,
    tags: session.selectedTags.length > 0 ? session.selectedTags : ['untitled'],
    width: fileInfo.width,
    height: fileInfo.height,
    duration: fileInfo.duration,
    uploaded_by: 'telegram',
    telegram_message_id: message.message_id,
  }] as unknown as MediaItem[]);

  if (dbError) {
    console.error('[DB] Insert error:', dbError);
    await sendTelegramMessage(
      chatId,
      '❌ Файл загрузился, но не записался в базу.\n' +
      `Причина: <code>${dbError.message}</code>\n\n` +
      'Сообщите администратору.',
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    '✅ <b>Готово! Файл успешно добавлен в медиатеку.</b>\n\n' +
    `📁 Путь: <code>${storagePath}</code>\n` +
    `🏷️ Теги: ${formatSelectedTags(session.selectedTags)}\n\n` +
    '📤 Можете отправить следующий файл прямо сейчас.\n' +
    '🔁 Для новой сессии с другими тегами используйте /upload.',
  );
};

const sendHelp = async (chatId: number) => {
  const message =
    '📘 <b>Как загрузить фото/видео в медиатеку</b>\n\n' +
    '<b>Коротко:</b>\n' +
    '1. Отправьте <code>/upload</code>\n' +
    '2. Выберите теги (или пропустите)\n' +
    '3. Нажмите кнопку перехода к загрузке\n' +
    '4. Отправьте фото/видео в чат\n\n' +
    '<b>Что можно отправлять:</b>\n' +
    `📎 ${SUPPORTED_FORMATS}\n\n` +
    '<b>Полезные команды:</b>\n' +
    '• <code>/upload</code> — начать новую загрузку\n' +
    '• <code>/help</code> — показать эту справку\n\n' +
    'Если запутались — просто отправьте <code>/upload</code>, бот проведет по шагам.';

  await sendTelegramMessage(
    chatId,
    `${message}\n\n• <code>/stats</code> — краткий отчет по визуализациям`,
  );
};

const parseTelegramCommand = (text: string): string | null => {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) return null;

  const match = trimmed.match(/^\/([a-z0-9_]+)(?:@[a-z0-9_]+)?(?:\s|$)/i);
  if (!match) return null;
  return `/${match[1].toLowerCase()}`;
};

const YEKT_OFFSET_MINUTES = 5 * 60;

const toYektLocal = (date: Date): Date => new Date(date.getTime() + YEKT_OFFSET_MINUTES * 60 * 1000);
const toUtcFromYektLocal = (date: Date): Date => new Date(date.getTime() - YEKT_OFFSET_MINUTES * 60 * 1000);

const getStatsPeriodStarts = (now = new Date()) => {
  const local = toYektLocal(now);

  const dayStartLocal = new Date(local);
  dayStartLocal.setUTCHours(0, 0, 0, 0);

  const weekStartLocal = new Date(dayStartLocal);
  const weekDayMonBased = (weekStartLocal.getUTCDay() + 6) % 7;
  weekStartLocal.setUTCDate(weekStartLocal.getUTCDate() - weekDayMonBased);

  const monthStartLocal = new Date(dayStartLocal);
  monthStartLocal.setUTCDate(1);

  return {
    now,
    dayStart: toUtcFromYektLocal(dayStartLocal),
    weekStart: toUtcFromYektLocal(weekStartLocal),
    monthStart: toUtcFromYektLocal(monthStartLocal),
  };
};

const inStatsPeriod = (date: Date, start: Date, end: Date) => date >= start && date <= end;

const sendVisualizationStats = async (chatId: number) => {
  try {
    const periods = getStatsPeriodStarts();
    const supabase = getSupabaseClient();

    const [{ data: sessions, error: sessionsError }, { data: events, error: eventsError }] = await Promise.all([
      supabase
        .from('visual_led_sessions')
        .select('started_at, duration_sec')
        .gte('started_at', periods.monthStart.toISOString()),
      supabase
        .from('visual_led_events')
        .select('ts, event_type, payload')
        .in('event_type', ['report_shared', 'background_uploaded', 'assist_applied'])
        .gte('ts', periods.monthStart.toISOString()),
    ]);

    if (sessionsError) throw sessionsError;
    if (eventsError) throw eventsError;

    const ranges = [
      { label: 'Сегодня', start: periods.dayStart },
      { label: 'Неделя', start: periods.weekStart },
      { label: 'Месяц', start: periods.monthStart },
    ] as const;

    const now = periods.now;
    const rows = ranges.map((range) => {
      const sessionsInRange = (sessions || []).filter((item) =>
        inStatsPeriod(new Date(item.started_at), range.start, now),
      );
      const eventsInRange = (events || []).filter((item) => inStatsPeriod(new Date(item.ts), range.start, now));

      const sharedReports = eventsInRange.filter(
        (item) =>
          item.event_type === 'report_shared' &&
          typeof item.payload === 'object' &&
          item.payload !== null &&
          (item.payload as Record<string, unknown>).status === 'success',
      ).length;
      const backgrounds = eventsInRange.filter((item) => item.event_type === 'background_uploaded').length;
      const assistApplied = eventsInRange.filter((item) => item.event_type === 'assist_applied').length;

      const durationValues = sessionsInRange
        .map((item) => item.duration_sec)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0);
      const avgDuration =
        durationValues.length > 0
          ? Math.round(durationValues.reduce((acc, value) => acc + value, 0) / durationValues.length)
          : 0;

      return {
        label: range.label,
        sessions: sessionsInRange.length,
        sharedReports,
        backgrounds,
        assistApplied,
        avgDuration,
      };
    });

    const message =
      '📊 <b>Отчет по визуализациям</b>\n<i>Asia/Yekaterinburg</i>\n\n' +
      rows
        .map(
          (row) =>
            `<b>${row.label}</b>\n` +
            `• Сессии: <b>${row.sessions}</b>\n` +
            `• Поделились отчетом: <b>${row.sharedReports}</b>\n` +
            `• Загружено фонов: <b>${row.backgrounds}</b>\n` +
            `• Assist применен: <b>${row.assistApplied}</b>\n` +
            `• Ср. длительность: <b>${row.avgDuration}s</b>`,
        )
        .join('\n\n');

    await sendTelegramMessage(chatId, message);
  } catch (err) {
    console.error('[Stats] failed:', err);
    await sendTelegramMessage(chatId, '❌ Не удалось собрать статистику. Попробуйте позже.');
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.TG_BOT_TOKEN;

  if (req.method === 'GET') {
    if (!token) return res.status(500).json({ error: 'TG_BOT_TOKEN not configured' });

    if (req.query?.action === 'setWebhook') {
      const webhookUrl = req.query.url as string;
      if (!webhookUrl) return res.status(400).json({ error: 'url query param required' });

      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'callback_query'] }),
        });
        return res.status(200).json(await response.json());
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    }

    if (req.query?.action === 'getWebhookInfo') {
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        return res.status(200).json(await response.json());
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    }

    return res.status(200).json({ ok: true, message: 'Telegram webhook is running' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (secret !== webhookSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (!token) {
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  try {
    const update: TelegramUpdate = req.body;

    if (update.callback_query) {
      await handleCallbackQuery(update);
      return res.status(200).json({ ok: true });
    }

    if (!update.message) {
      return res.status(200).json({ ok: true });
    }

    const { message } = update;
    const chatId = message.chat.id;
    const text = message.text || '';
    const command = parseTelegramCommand(text);

    const alreadyProcessed = await isMessageAlreadyProcessed(message.message_id);
    if (alreadyProcessed) {
      return res.status(200).json({ ok: true });
    }
    await markMessageAsProcessed(message.message_id);

    const session = await getSession(chatId);

    if (session?.state === 'awaiting_new_tag' && text && !text.startsWith('/')) {
      const newTag = text.trim().toLowerCase();
      if (newTag.length === 0 || newTag.length > 50) {
        await sendTelegramMessage(
          chatId,
          '⚠️ Тег должен быть от 1 до 50 символов.\n\nПример: <code>концерт</code>',
        );
        return res.status(200).json({ ok: true });
      }

      const nextTags = session.selectedTags.includes(newTag)
        ? session.selectedTags
        : [...session.selectedTags, newTag];

      await setSession(chatId, { state: 'awaiting_tags', selectedTags: nextTags });

      await sendTelegramMessage(
        chatId,
        `✅ Новый тег добавлен: <b>${newTag}</b>\n` +
        `🏷️ Сейчас выбрано: ${formatSelectedTags(nextTags)}\n\n` +
        'Нажмите кнопку <b>✅ Теги выбраны, перейти к загрузке</b> в сообщении выше.',
      );

      return res.status(200).json({ ok: true });
    }

    if (command === '/start' || command === '/upload') {
      await handleStart(chatId);
      return res.status(200).json({ ok: true });
    }

    if (command === '/help') {
      await sendHelp(chatId);
      return res.status(200).json({ ok: true });
    }

    if (command === '/stats') {
      await sendVisualizationStats(chatId);
      return res.status(200).json({ ok: true });
    }

    if (message.photo || message.video || message.document) {
      await handleFileUpload(update);
      return res.status(200).json({ ok: true });
    }

    if (session?.state === 'awaiting_files') {
      await sendTelegramMessage(
        chatId,
        '📤 Сейчас ожидаю файл.\n\nПожалуйста, отправьте фото или видео.',
      );
      return res.status(200).json({ ok: true });
    }

    await sendTelegramMessage(
      chatId,
      '👋 Чтобы загрузить фото/видео, отправьте /upload\n\n' + START_HELP_MESSAGE,
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[Webhook] Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
