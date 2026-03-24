export const sendTelegram = async (text: string): Promise<boolean> => {
  console.warn('[Telegram] Client-side Telegram send is disabled; use the server mail API instead', text);
  return false;
};
