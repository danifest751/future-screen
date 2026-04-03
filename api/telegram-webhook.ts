import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

/**
 * Telegram Bot Webhook Handler
 * Handles file uploads from Telegram bot to media library
 */

// Supabase client with service role
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface TelegramUpdate {
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

// In-memory user state store (in production, use Redis or database)
const userStates = new Map<number, {
  state: 'idle' | 'awaiting_tags' | 'awaiting_files';
  selectedTags: string[];
  lastActivity: number;
}>();

// Cleanup old states every hour
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  for (const [chatId, state] of userStates.entries()) {
    if (now - state.lastActivity > oneHour) {
      userStates.delete(chatId);
    }
  }
}, 60 * 60 * 1000);

const getUserState = (chatId: number) => {
  const state = userStates.get(chatId);
  if (state) {
    state.lastActivity = Date.now();
  }
  return state;
};

const setUserState = (chatId: number, state: { state: 'idle' | 'awaiting_tags' | 'awaiting_files'; selectedTags: string[] }) => {
  userStates.set(chatId, { ...state, lastActivity: Date.now() });
};

const clearUserState = (chatId: number) => {
  userStates.delete(chatId);
};

// Send message to Telegram chat
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
    return response.ok;
  } catch (err) {
    console.error('[Telegram] Failed to send message:', err);
    return false;
  }
};

// Get file from Telegram
const getTelegramFile = async (fileId: string): Promise<{ url: string; data: ArrayBuffer } | null> => {
  const token = process.env.TG_BOT_TOKEN;
  if (!token) return null;

  try {
    // Get file info
    const fileInfoResponse = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileInfo = await fileInfoResponse.json() as { ok: boolean; result?: { file_path?: string } };

    if (!fileInfo.ok || !fileInfo.result?.file_path) {
      console.error('[Telegram] Failed to get file info:', fileInfo);
      return null;
    }

    const filePath = fileInfo.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    // Download file
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      console.error('[Telegram] Failed to download file');
      return null;
    }

    const data = await fileResponse.arrayBuffer();
    return { url: fileUrl, data };
  } catch (err) {
    console.error('[Telegram] Error getting file:', err);
    return null;
  }
};

// Get all unique tags from database
const getAllTags = async (): Promise<string[]> => {
  try {
    const { data } = await supabase
      .from('media_items')
      .select('tags');

    const allTags = new Set<string>();
    data?.forEach((item) => {
      item.tags?.forEach((tag: string) => {
        if (tag) allTags.add(tag);
      });
    });

    return Array.from(allTags).sort().slice(0, 20); // Limit to 20 tags
  } catch {
    return [];
  }
};

// Handle /start and /upload commands
const handleStart = async (chatId: number) => {
  const tags = await getAllTags();
  setUserState(chatId, { state: 'awaiting_tags', selectedTags: [] });

  const keyboard = {
    inline_keyboard: [
      tags.slice(0, 4).map((tag) => ({ text: tag, callback_data: `tag:${tag}` })),
      tags.slice(4, 8).map((tag) => ({ text: tag, callback_data: `tag:${tag}` })),
      [{ text: '✅ Готово, загрузить файлы', callback_data: 'done' }],
      [{ text: '❌ Отмена', callback_data: 'cancel' }],
    ].filter((row) => row.length > 0),
  };

  await sendTelegramMessage(
    chatId,
    '📁 <b>Загрузка файлов в медиа-библиотеку</b>\n\n' +
    'Выберите теги для файлов (можно несколько):',
    { replyMarkup: keyboard }
  );
};

// Handle callback queries (tag selection)
const handleCallbackQuery = async (update: TelegramUpdate) => {
  const callback = update.callback_query;
  if (!callback?.data || !callback.message) return;

  const chatId = callback.message.chat.id;
  const data = callback.data;
  const state = getUserState(chatId);

  // Answer callback query
  const token = process.env.TG_BOT_TOKEN;
  if (token) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callback.id }),
    });
  }

  if (data === 'cancel') {
    clearUserState(chatId);
    await sendTelegramMessage(chatId, '❌ Загрузка отменена');
    return;
  }

  if (data === 'done') {
    if (!state || state.selectedTags.length === 0) {
      await sendTelegramMessage(chatId, '⚠️ Выберите хотя бы один тег');
      return;
    }
    setUserState(chatId, { ...state, state: 'awaiting_files' });
    await sendTelegramMessage(
      chatId,
      `🏷️ <b>Теги:</b> ${state.selectedTags.join(', ')}\n\n` +
      '📤 Отправьте фото или видео для загрузки:\n' +
      '(можно несколько файлов подряд)'
    );
    return;
  }

  if (data.startsWith('tag:')) {
    const tag = data.slice(4);
    if (!state) {
      await sendTelegramMessage(chatId, '⚠️ Сессия истекла. Начните сначала с /upload');
      return;
    }

    const newTags = state.selectedTags.includes(tag)
      ? state.selectedTags.filter((t) => t !== tag)
      : [...state.selectedTags, tag];

    setUserState(chatId, { ...state, selectedTags: newTags });

    // Update keyboard
    const allTags = await getAllTags();
    const keyboard = {
      inline_keyboard: [
        allTags.slice(0, 4).map((t) => ({
          text: `${newTags.includes(t) ? '✅ ' : ''}${t}`,
          callback_data: `tag:${t}`,
        })),
        allTags.slice(4, 8).map((t) => ({
          text: `${newTags.includes(t) ? '✅ ' : ''}${t}`,
          callback_data: `tag:${t}`,
        })),
        [{ text: '✅ Готово, загрузить файлы', callback_data: 'done' }],
        [{ text: '❌ Отмена', callback_data: 'cancel' }],
      ].filter((row) => row.length > 0),
    };

    const token = process.env.TG_BOT_TOKEN;
    if (token && callback.message.message_id) {
      await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: callback.message.message_id,
          reply_markup: keyboard,
        }),
      });
    }
  }
};

// Handle file upload
const handleFileUpload = async (update: TelegramUpdate) => {
  const message = update.message;
  if (!message?.chat.id) return;

  const chatId = message.chat.id;
  const state = getUserState(chatId);

  if (!state || state.state !== 'awaiting_files') {
    await sendTelegramMessage(
      chatId,
      'ℹ️ Для загрузки файлов используйте команду /upload'
    );
    return;
  }

  // Determine file type and get file info
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
    // Get the largest photo
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
    // Check if it's an allowed file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(message.document.mime_type || '')) {
      await sendTelegramMessage(
        chatId,
        '⚠️ Неподдерживаемый формат файла. Разрешены: JPG, PNG, GIF, WEBP, MP4, WEBM, MOV'
      );
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

  // Send processing message
  const processingMsg = await sendTelegramMessage(chatId, '⏳ Загрузка файла...');

  // Get file from Telegram
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

  // Upload to Supabase Storage
  const bucket = 'media';
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileData.data, {
      contentType: fileInfo.mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error('[Storage] Upload error:', uploadError);
    await sendTelegramMessage(chatId, '❌ Ошибка сохранения файла');
    return;
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // Create media item record
  const mediaType = isVideo ? 'video' : 'image';
  const { error: dbError } = await supabase.from('media_items').insert({
    name: fileInfo.fileName,
    storage_path: storagePath,
    public_url: publicUrl,
    type: mediaType,
    mime_type: fileInfo.mimeType,
    size_bytes: fileInfo.fileSize || fileData.data.byteLength,
    tags: state.selectedTags,
    width: fileInfo.width,
    height: fileInfo.height,
    duration: fileInfo.duration,
    uploaded_by: 'telegram',
    telegram_message_id: message.message_id,
  });

  if (dbError) {
    console.error('[DB] Insert error:', dbError);
    await sendTelegramMessage(chatId, '❌ Ошибка сохранения в базу данных');
    return;
  }

  // Success message
  await sendTelegramMessage(
    chatId,
    `✅ <b>Файл загружен!</b>\n\n` +
    `<b>Теги:</b> ${state.selectedTags.join(', ')}\n\n` +
    `Отправьте еще файлы или используйте /upload для новой сессии.`
  );
};

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook secret if configured
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (secret !== webhookSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const update: TelegramUpdate = req.body;

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      await handleCallbackQuery(update);
      return res.status(200).json({ ok: true });
    }

    // Handle messages
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || '';

      // Handle commands
      if (text === '/start' || text === '/upload') {
        await handleStart(chatId);
        return res.status(200).json({ ok: true });
      }

      if (text === '/help') {
        await sendTelegramMessage(
          chatId,
          '📖 <b>Справка по боту</b>\n\n' +
          '/upload - Загрузить файлы в медиа-библиотеку\n' +
          '/help - Показать эту справку\n\n' +
          '<b>Как загрузить файлы:</b>\n' +
          '1. Отправьте /upload\n' +
          '2. Выберите теги\n' +
          '3. Отправьте фото или видео\n' +
          '4. Файлы автоматически сохранятся'
        );
        return res.status(200).json({ ok: true });
      }

      // Handle file uploads
      if (update.message.photo || update.message.video || update.message.document) {
        await handleFileUpload(update);
        return res.status(200).json({ ok: true });
      }

      // Default response
      await sendTelegramMessage(
        chatId,
        'ℹ️ Отправьте /upload для загрузки файлов или /help для справки'
      );
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
