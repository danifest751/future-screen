const BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN ?? '';
const CHAT_ID = import.meta.env.VITE_TG_CHAT_ID ?? '';

export const sendTelegram = async (text: string): Promise<boolean> => {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Telegram] BOT_TOKEN или CHAT_ID не заданы — пропускаем отправку');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('[Telegram] Ошибка:', err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Telegram] Сетевая ошибка:', err);
    return false;
  }
};
