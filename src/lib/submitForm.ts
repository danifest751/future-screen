import { sendTelegram } from './telegram';
import { sendEmail } from './email';

export type FormPayload = {
  source: string;
  name: string;
  phone: string;
  city?: string;
  date?: string;
  format?: string;
  comment?: string;
  extra?: Record<string, string>;
};

const formatTelegramMessage = (p: FormPayload): string => {
  const lines = [
    `<b>Новая заявка: ${p.source}</b>`,
    '',
    `<b>Имя:</b> ${p.name}`,
    `<b>Телефон:</b> ${p.phone}`,
  ];

  if (p.city) lines.push(`<b>Город:</b> ${p.city}`);
  if (p.date) lines.push(`<b>Дата:</b> ${p.date}`);
  if (p.format) lines.push(`<b>Формат:</b> ${p.format}`);
  if (p.comment) lines.push(`<b>Комментарий:</b> ${p.comment}`);

  if (p.extra) {
    lines.push('');
    for (const [key, value] of Object.entries(p.extra)) {
      lines.push(`<b>${key}:</b> ${value}`);
    }
  }

  return lines.join('\n');
};

export const submitForm = async (payload: FormPayload): Promise<{ tg: boolean; email: boolean }> => {
  const [tg, email] = await Promise.allSettled([
    sendTelegram(formatTelegramMessage(payload)),
    sendEmail(payload),
  ]);

  return {
    tg: tg.status === 'fulfilled' && tg.value,
    email: email.status === 'fulfilled' && email.value,
  };
};
