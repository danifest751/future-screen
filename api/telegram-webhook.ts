import type { VercelRequest, VercelResponse } from '@vercel/node';
import 'dotenv/config';
import {
  START_HELP_MESSAGE,
  handleStart,
  parseTelegramCommand,
  sendHelp,
} from '../server/lib/telegramWebhook/commands.js';
import { ensureAdmin } from '../server/lib/telegramWebhook/rbac.js';
import {
  getSession,
  isMessageAlreadyProcessed,
  markMessageAsProcessed,
  setSession,
} from '../server/lib/telegramWebhook/sessions.js';
import { sendVisualizationStats } from '../server/lib/telegramWebhook/stats.js';
import { formatSelectedTags } from '../server/lib/telegramWebhook/tags.js';
import {
  getWebhookInfo,
  sendTelegramMessage,
  setWebhook,
} from '../server/lib/telegramWebhook/telegramApi.js';
import type { TelegramUpdate } from '../server/lib/telegramWebhook/types.js';
import { handleCallbackQuery, handleFileUpload } from '../server/lib/telegramWebhook/uploadFlow.js';

/**
 * Telegram Bot Webhook Handler
 * Upload flow:
 * 1) /upload
 * 2) Choose tags
 * 3) Send photos/videos
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.TG_BOT_TOKEN;

  if (req.method === 'GET') {
    if (!token) return res.status(500).json({ error: 'TG_BOT_TOKEN not configured' });

    const action = req.query?.action;

    if (action === 'setWebhook' || action === 'getWebhookInfo') {
      try {
        await ensureAdmin(req);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unauthorized';
        const status = msg.startsWith('Forbidden') ? 403 : 401;
        return res.status(status).json({ error: msg });
      }
    }

    if (action === 'setWebhook') {
      const webhookUrl = req.query.url as string;
      if (!webhookUrl) return res.status(400).json({ error: 'url query param required' });

      try {
        return res.status(200).json(await setWebhook(token, webhookUrl));
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
    }

    if (action === 'getWebhookInfo') {
      try {
        return res.status(200).json(await getWebhookInfo(token));
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
  if (!webhookSecret) {
    console.error('[TelegramWebhook] TELEGRAM_WEBHOOK_SECRET is not configured — refusing POST');
    return res.status(500).json({ error: 'Webhook secret not configured on server' });
  }
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (secret !== webhookSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
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
