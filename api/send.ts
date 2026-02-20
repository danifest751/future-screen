import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import 'dotenv/config';

// Транспорт для почты
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transporter: any = nodemailer.createTransport({
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
  const token = process.env.VITE_TG_BOT_TOKEN || process.env.TG_BOT_TOKEN;
  const chatId = process.env.VITE_TG_CHAT_ID || process.env.TG_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] Token или ChatID не настроены');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Telegram] Ошибка отправки:', errorText);
      return false;
    }

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
    console.log(`[Email] Начинаем отправку. Admin: ${process.env.SMTP_TO}, Client: ${payload.email || 'не указан'}`);
    
    // Отправка админу
    await transporter.sendMail({
      from: `"Future Screen" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_TO || process.env.SMTP_USER,
      subject: `Заявка: ${payload.source || 'Сайт'} — ${payload.name}`,
      text,
      html,
    });
    console.log(`[Email] Письмо админу отправлено на ${process.env.SMTP_TO}`);

    // Отправка подтверждения клиенту (если указан email)
    if (payload.email && payload.email.trim()) {
      console.log(`[Email] Отправляем подтверждение клиенту: ${payload.email}`);
      
      const clientText = [
        `Здравствуйте, ${payload.name}!`,
        '',
        'Ваша заявка принята. Мы свяжемся с вами в течение 15 минут.',
        '',
        'Детали заявки:',
        `Источник: ${payload.source}`,
        `Телефон: ${payload.phone}`,
      ];

      if (payload.city) clientText.push(`Город: ${payload.city}`);
      if (payload.date) clientText.push(`Дата: ${payload.date}`);
      if (payload.format) clientText.push(`Формат: ${payload.format}`);
      if (payload.comment) clientText.push(`Комментарий: ${payload.comment}`);

      if (payload.extra) {
        clientText.push('');
        clientText.push('Детали расчёта:');
        for (const [key, value] of Object.entries(payload.extra)) {
          clientText.push(`${key}: ${value}`);
        }
      }

      clientText.push('');
      clientText.push('С уважением,');
      clientText.push('Команда Future Screen');
      clientText.push('+7 (912) 246-65-66');
      clientText.push('futurescreen@list.ru');

      const clientHtml = clientText.map((l) => {
        if (!l) return '<br>';
        const [label, ...rest] = l.split(': ');
        if (rest.length > 0) return `<b>${label}:</b> ${rest.join(': ')}`;
        return l;
      }).join('<br>');

      await transporter.sendMail({
        from: `"Future Screen" <${process.env.SMTP_USER}>`,
        to: payload.email,
        subject: `Ваша заявка принята — Future Screen`,
        text: clientText.join('\n'),
        html: clientHtml,
      });

      console.log(`[Email] Подтверждение отправлено клиенту: ${payload.email}`);
    }

    return true;
  } catch (err) {
    console.error('[Email] Ошибка отправки:', err);
    console.error('[Email] SMTP_USER:', process.env.SMTP_USER);
    console.error('[Email] SMTP_TO:', process.env.SMTP_TO);
    console.error('[Email] Client email:', payload.email);
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
    const { source, name, phone, email, telegram, city, date, format, comment, extra } = req.body;

    // Логирование входящих данных
    console.log('[API] Получены данные:', {
      source,
      name,
      phone,
      email: email || 'не указан',
      telegram: telegram || 'не указан',
      city,
      date,
      format,
      comment,
    });

    // Валидация
    if (!name || !phone) {
      return res.status(400).json({ error: 'Имя и телефон обязательны' });
    }

    const payload: EmailPayload = {
      source,
      name,
      phone,
      email,
      telegram,
      city,
      date,
      format,
      comment,
      extra,
    };

    // Отправка параллельно
    const [tg, emailResult] = await Promise.allSettled([
      sendTelegram(formatTelegramMessage(payload)),
      sendEmail(payload),
    ]);

    const tgOk = tg.status === 'fulfilled' && tg.value;
    const emailOk = emailResult.status === 'fulfilled' && emailResult.value;
    const ok = tgOk || emailOk;

    console.log(`[API] Отправлено: ${source} — ${name} ${phone}`);

    if (!ok) {
      return res.status(502).json({
        ok: false,
        telegram: tgOk,
        email: emailOk,
        error: 'Не удалось отправить ни Telegram, ни Email',
      });
    }

    res.status(200).json({
      ok: true,
      telegram: tgOk,
      email: emailOk,
    });
  } catch (err) {
    console.error('[API] Ошибка:', err);
    res.status(500).json({ error: 'Ошибка отправки' });
  }
}
