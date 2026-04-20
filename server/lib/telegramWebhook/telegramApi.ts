export const sendTelegramMessage = async (
  chatId: number,
  text: string,
  options?: { replyMarkup?: unknown },
): Promise<boolean> => {
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

export const answerCallbackQuery = async (callbackQueryId: string): Promise<void> => {
  const token = process.env.TG_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  }).catch(() => {});
};

export const editMessageReplyMarkup = async (
  chatId: number,
  messageId: number,
  replyMarkup: unknown,
): Promise<void> => {
  const token = process.env.TG_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
    }),
  }).catch(() => {});
};

export const getTelegramFile = async (
  fileId: string,
): Promise<{ data: ArrayBuffer } | null> => {
  const token = process.env.TG_BOT_TOKEN;
  if (!token) return null;

  try {
    const fileInfoResponse = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`,
    );
    const fileInfo = (await fileInfoResponse.json()) as {
      ok: boolean;
      result?: { file_path?: string };
    };
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

export const setWebhook = async (
  token: string,
  webhookUrl: string,
): Promise<unknown> => {
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
    }),
  });
  return response.json();
};

export const getWebhookInfo = async (token: string): Promise<unknown> => {
  const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  return response.json();
};
