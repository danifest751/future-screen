import { sendTelegramMessage } from './telegramApi.js';
import { buildTagKeyboard, getAllTags } from './tags.js';
import { setSession } from './sessions.js';

export const SESSION_EXPIRED_MESSAGE =
  '⚠️ Сессия истекла.\n\nНажмите /upload и начните заново. Я подскажу каждый шаг.';

export const CANCELLED_MESSAGE =
  '❌ Загрузка отменена.\n\nКогда будете готовы, отправьте /upload.';

export const START_HELP_MESSAGE =
  '💡 Нужна помощь? Отправьте /help, там есть пошаговая инструкция.';

export const SUPPORTED_FORMATS = 'JPG, PNG, GIF, WEBP, MP4, WEBM, MOV';

export const parseTelegramCommand = (text: string): string | null => {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) return null;

  const match = trimmed.match(/^\/([a-z0-9_]+)(?:@[a-z0-9_]+)?(?:\s|$)/i);
  if (!match) return null;
  return `/${match[1].toLowerCase()}`;
};

export const handleStart = async (chatId: number): Promise<void> => {
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

export const sendHelp = async (chatId: number): Promise<void> => {
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
