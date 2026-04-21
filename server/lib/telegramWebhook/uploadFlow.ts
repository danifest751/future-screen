import {
  CANCELLED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  START_HELP_MESSAGE,
  SUPPORTED_FORMATS,
} from './commands.js';
import {
  answerCallbackQuery,
  editMessageReplyMarkup,
  getTelegramFile,
  sendTelegramMessage,
} from './telegramApi.js';
import { clearSession, getSession, setSession } from './sessions.js';
import { buildTagKeyboard, formatSelectedTags, getAllTags } from './tags.js';
import { getSupabaseClient } from './supabaseClient.js';
import type { MediaItem, TelegramFileInfo, TelegramUpdate } from './types.js';

export const handleCallbackQuery = async (update: TelegramUpdate): Promise<void> => {
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

    if (callback.message.message_id) {
      const allTags = await getAllTags();
      await editMessageReplyMarkup(
        chatId,
        callback.message.message_id,
        buildTagKeyboard(allTags, nextTags),
      );
    }
  }
};

export const extractFileInfo = (message: NonNullable<TelegramUpdate['message']>): TelegramFileInfo | 'unsupported' | null => {
  if (message.photo && message.photo.length > 0) {
    const photo = message.photo[message.photo.length - 1];
    return {
      fileId: photo.file_id,
      fileName: `photo_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      width: photo.width,
      height: photo.height,
    };
  }

  if (message.video) {
    return {
      fileId: message.video.file_id,
      fileName: `video_${Date.now()}.mp4`,
      mimeType: message.video.mime_type || 'video/mp4',
      fileSize: message.video.file_size,
      width: message.video.width,
      height: message.video.height,
      duration: message.video.duration,
    };
  }

  if (message.document) {
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
    if (!allowed.has(mimeType)) return 'unsupported';

    return {
      fileId: message.document.file_id,
      fileName: message.document.file_name || `file_${Date.now()}`,
      mimeType: mimeType || 'application/octet-stream',
      fileSize: message.document.file_size,
    };
  }

  return null;
};

export const handleFileUpload = async (update: TelegramUpdate): Promise<void> => {
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

  const fileInfoResult = extractFileInfo(message);

  if (fileInfoResult === 'unsupported') {
    await sendTelegramMessage(
      chatId,
      '⚠️ Этот формат не поддерживается.\n\n' +
        `Разрешены: ${SUPPORTED_FORMATS}\n\n` +
        'Попробуйте отправить файл в одном из этих форматов.',
    );
    return;
  }

  if (!fileInfoResult) {
    await sendTelegramMessage(
      chatId,
      '⚠️ Я не смог распознать вложение.\n\nОтправьте фото или видео.',
    );
    return;
  }

  const fileInfo = fileInfoResult;
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

  const { error: uploadError } = await getSupabaseClient()
    .storage.from('images')
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

  const { error: dbError } = await getSupabaseClient()
    .from('media_items')
    .insert([
      {
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
      },
    ] as unknown as MediaItem[]);

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
