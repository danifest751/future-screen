import nodemailer from 'nodemailer';
import { SMTP_TIMEOUT_MS } from '../config.js';
import { escapeHtml, retryAsync, toCleanString, toErrorMessage } from './http.js';

export const createTransporter = () => nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  connectionTimeout: SMTP_TIMEOUT_MS,
  greetingTimeout: SMTP_TIMEOUT_MS,
  socketTimeout: SMTP_TIMEOUT_MS,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const formatTelegramMessage = ({ source, name, phone, email, telegram, city, date, format, comment, extra }) => {
  const lines = [
    '<b>🔥 Новая заявка</b>',
    `<b>Источник:</b> ${escapeHtml(toCleanString(source) || 'Сайт')}`,
    '',
  ];

  const pushField = (label, value) => {
    const clean = toCleanString(value);
    if (!clean) return;
    lines.push(`<b>${label}:</b> ${escapeHtml(clean)}`);
  };

  pushField('Имя', name);
  pushField('Телефон', phone);
  pushField('Email', email);
  pushField('Telegram', telegram);
  pushField('Город', city);
  pushField('Дата', date);
  pushField('Формат', format);
  pushField('Комментарий', comment);

  if (extra && typeof extra === 'object') {
    const extraEntries = Object.entries(extra)
      .map(([key, value]) => [toCleanString(key), toCleanString(value)])
      .filter(([key, value]) => key && value);

    if (extraEntries.length > 0) {
      lines.push('');
      lines.push('<b>Параметры расчета:</b>');
      for (const [key, value] of extraEntries) {
        lines.push(`• <b>${escapeHtml(key)}:</b> ${escapeHtml(value)}`);
      }
    }
  }

  return lines.join('\n');
};

export const formatEmailFailureAlertMessage = ({ requestId, source, name, phone, email, errorMessage }) => {
  const lines = [
    '<b>⚠️ Ошибка доставки Email</b>',
    `<b>Request ID:</b> <code>${escapeHtml(requestId)}</code>`,
    '',
    `<b>Источник:</b> ${escapeHtml(toCleanString(source) || 'Сайт')}`,
    `<b>Имя:</b> ${escapeHtml(toCleanString(name) || '—')}`,
    `<b>Телефон:</b> ${escapeHtml(toCleanString(phone) || '—')}`,
  ];

  const cleanEmail = toCleanString(email);
  if (cleanEmail) lines.push(`<b>Email:</b> ${escapeHtml(cleanEmail)}`);

  lines.push('');
  lines.push(`<b>Причина:</b> ${escapeHtml(toCleanString(errorMessage) || 'Unknown error')}`);
  return lines.join('\n');
};

export const sendTelegram = async (message) => {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] Token/ChatID не настроены');
    return false;
  }

  try {
    await retryAsync(async () => {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `HTTP ${response.status}`);
      }
    }, {
      attempts: 2,
      delayMs: 500,
      onRetry: (err, attempt, attempts) => {
        console.warn(`[Telegram] Retry ${attempt}/${attempts - 1}: ${toErrorMessage(err)}`);
      },
    });

    return true;
  } catch (err) {
    console.warn('[Telegram] Ошибка отправки:', toErrorMessage(err));
    return false;
  }
};

export const sendEmail = async (payload, requestId, transporter) => {
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
  const html = lines.map((line) => {
    if (!line) return '<br>';
    const [label, ...rest] = line.split(': ');
    if (rest.length > 0) return `<b>${label}:</b> ${rest.join(': ')}`;
    return `<b>${line}</b>`;
  }).join('<br>');

  let adminSent = false;
  let clientSent = false;
  let errorMessage = '';

  try {
    await retryAsync(() => transporter.sendMail({
      from: `"Future Screen" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_TO || process.env.SMTP_USER,
      replyTo: payload.email || process.env.SMTP_USER,
      subject: `Заявка: ${payload.source || 'Сайт'} — ${payload.name}`,
      text,
      html,
    }), {
      attempts: 1,
      delayMs: 200,
      onRetry: (err, attempt, attempts) => {
        console.warn(`[Email][${requestId}] Retry ${attempt}/${attempts - 1}: ${toErrorMessage(err)}`);
      },
    });

    adminSent = true;

    if (payload.email && String(payload.email).trim()) {
      const clientLines = [
        `Здравствуйте, ${payload.name}!`,
        '',
        'Ваша заявка принята. Мы свяжемся с вами в течение 15 минут.',
        '',
        'Детали заявки:',
        `Источник: ${payload.source || 'Сайт'}`,
        `Телефон: ${payload.phone}`,
      ];

      if (payload.city) clientLines.push(`Город: ${payload.city}`);
      if (payload.date) clientLines.push(`Дата: ${payload.date}`);
      if (payload.format) clientLines.push(`Формат: ${payload.format}`);
      if (payload.comment) clientLines.push(`Комментарий: ${payload.comment}`);

      if (payload.extra) {
        clientLines.push('');
        clientLines.push('Детали расчёта:');
        for (const [key, value] of Object.entries(payload.extra)) {
          clientLines.push(`${key}: ${value}`);
        }
      }

      clientLines.push('');
      clientLines.push('С уважением,');
      clientLines.push('Команда Future Screen');

      const clientHtml = clientLines.map((line) => {
        if (!line) return '<br>';
        const [label, ...rest] = line.split(': ');
        if (rest.length > 0) return `<b>${label}:</b> ${rest.join(': ')}`;
        return line;
      }).join('<br>');

      await retryAsync(() => transporter.sendMail({
        from: `"Future Screen" <${process.env.SMTP_USER}>`,
        to: String(payload.email).trim(),
        subject: 'Ваша заявка принята — Future Screen',
        text: clientLines.join('\n'),
        html: clientHtml,
      }), {
        attempts: 1,
        delayMs: 200,
        onRetry: (err, attempt, attempts) => {
          console.warn(`[EmailClient][${requestId}] Retry ${attempt}/${attempts - 1}: ${toErrorMessage(err)}`);
        },
      });

      clientSent = true;
    }
  } catch (err) {
    errorMessage = toErrorMessage(err);
    console.error(`[Email][${requestId}] Ошибка доставки:`, errorMessage);
  }

  return {
    adminSent,
    clientSent,
    errorMessage,
  };
};
