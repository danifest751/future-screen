import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import 'dotenv/config';

// Транспорт для почты
const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Схема валидации
interface EmailPayload {
  source: string;
  name: string;
  phone: string;
  email?: string;
  telegram?: string;
  city?: string;
  date?: string;
  format?: string;
  comment?: string;
  extra?: Record<string, string>;
}

const formatTelegramMessage = (p: EmailPayload): string => {
  const lines = [
    `<b>Новая заявка: ${p.source}</b>`,
    '',
    `<b>Имя:</b> ${p.name}`,
    `<b>Телефон:</b> ${p.phone}`,
  ];

  if (p.email) lines.push(`<b>Email:</b> ${p.email}`);
  if (p.telegram) lines.push(`<b>Telegram:</b> ${p.telegram}`);
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

const sendTelegram = async (message: string): Promise<boolean> => {
  const token = process.env.VITE_TG_BOT_TOKEN;
  const chatId = process.env.VITE_TG_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] Token или ChatID не настроены');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    return true;
  } catch (err) {
    console.error('[Telegram] Ошибка:', err);
    return false;
  }
};

const sendEmail = async (payload: EmailPayload): Promise<boolean> => {
  const lines = [
    `Новая заявка: ${payload.source || 'Сайт'}`,
    '',
    `Имя: ${payload.name}`,
    `Телефон: ${payload.phone}`,
  ];

  if (payload.email) lines.push(`Email: ${payload.email}`);
  if (payload.telegram) lines.push(`Telegram: ${payload.telegram}`);
  if (payload.city) lines.push(`Город: ${payload.city}`);
  if (payload.date) lines.push(`Дата: ${payload.date}`);
  if (payload.format) lines.push(`Формат: ${payload.format}`);
  if (payload.comment) lines.push(`Комментарий: ${payload.comment}`);

  if (payload.extra) {
    lines.push('');
    for (const [key, value] of Object.entries(payload.extra)) {
      lines.push(`${key}: ${value}`);
    }
  }

  const text = lines.join('\n');
  const html = lines.map((l) => {
    if (!l) return '<br>';
    const [label, ...rest] = l.split(': ');
    if (rest.length > 0) return `<b>${label}:</b> ${rest.join(': ')}`;
    return `<b>${l}</b>`;
  }).join('<br>');

  try {
    await transporter.sendMail({
      from: `"Future Screen" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_TO || process.env.SMTP_USER,
      subject: `Заявка: ${payload.source || 'Сайт'} — ${payload.name}`,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error('[Email] Ошибка:', err);
    return false;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { source, name, phone, city, date, format, comment, extra } = req.body;

    // Валидация
    if (!name || !phone) {
      return res.status(400).json({ error: 'Имя и телефон обязательны' });
    }

    const payload: EmailPayload = {
      source,
      name,
      phone,
      city,
      date,
      format,
      comment,
      extra,
    };

    // Отправка параллельно
    const [tg, email] = await Promise.allSettled([
      sendTelegram(formatTelegramMessage(payload)),
      sendEmail(payload),
    ]);

    console.log(`[API] Отправлено: ${source} — ${name} ${phone}`);

    res.status(200).json({
      ok: true,
      telegram: tg.status === 'fulfilled' && tg.value,
      email: email.status === 'fulfilled' && email.value,
    });
  } catch (err) {
    console.error('[API] Ошибка:', err);
    res.status(500).json({ error: 'Ошибка отправки' });
  }
}
