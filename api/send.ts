import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import 'dotenv/config';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://future-screen.ru,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const requestsByIp = new Map<string, number[]>();

const isOriginAllowed = (origin?: string) => {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
};

const getClientIp = (req: VercelRequest) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return value?.split(',')[0]?.trim() || 'unknown';
};

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const attempts = (requestsByIp.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (attempts.length >= RATE_LIMIT_MAX) {
    requestsByIp.set(ip, attempts);
    return true;
  }
  attempts.push(now);
  requestsByIp.set(ip, attempts);
  return false;
};

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

type EmailSendResult = {
  adminSent: boolean;
  clientSent: boolean;
  errorMessage: string;
};

const escapeHtml = (value = ''): string => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const toCleanString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const wait = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const toErrorMessage = (err: unknown): string => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message?: unknown }).message ?? 'Unknown error');
  }
  return String(err);
};

const retryAsync = async <T>(
  task: () => Promise<T>,
  {
    attempts = 3,
    delayMs = 600,
    onRetry,
  }: {
    attempts?: number;
    delayMs?: number;
    onRetry?: (err: unknown, attempt: number, attempts: number) => void;
  } = {},
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        if (onRetry) onRetry(err, attempt, attempts);
        await wait(delayMs * attempt);
      }
    }
  }

  throw lastError;
};

const formatTelegramMessage = (p: EmailPayload): string => {
  const lines = [
    '<b>🔥 Новая заявка</b>',
    `<b>Источник:</b> ${escapeHtml(toCleanString(p.source) || 'Сайт')}`,
    '',
  ];

  const pushField = (label: string, value: unknown) => {
    const clean = toCleanString(value);
    if (!clean) return;
    lines.push(`<b>${label}:</b> ${escapeHtml(clean)}`);
  };

  pushField('Имя', p.name);
  pushField('Телефон', p.phone);
  pushField('Email', p.email);
  pushField('Telegram', p.telegram);
  pushField('Город', p.city);
  pushField('Дата', p.date);
  pushField('Формат', p.format);
  pushField('Комментарий', p.comment);

  if (p.extra) {
    const extraEntries = Object.entries(p.extra)
      .map(([key, value]) => [toCleanString(key), toCleanString(value)] as const)
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

const formatEmailFailureAlertMessage = ({
  requestId,
  source,
  name,
  phone,
  email,
  errorMessage,
}: {
  requestId: string;
  source?: string;
  name?: string;
  phone?: string;
  email?: string;
  errorMessage: string;
}): string => {
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

const sendTelegram = async (message: string): Promise<boolean> => {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] Token или ChatID не настроены');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await retryAsync(async () => {
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
        throw new Error(errorText || `HTTP ${response.status}`);
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
    console.error('[Telegram] Ошибка:', toErrorMessage(err));
    return false;
  }
};

const sendEmail = async (payload: EmailPayload, requestId: string): Promise<EmailSendResult> => {
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

  let adminSent = false;
  let clientSent = false;
  let errorMessage = '';

  try {
    await retryAsync(() => transporter.sendMail({
      from: `"Future Screen" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_TO || process.env.SMTP_USER,
      subject: `Заявка: ${payload.source || 'Сайт'} — ${payload.name}`,
      text,
      html,
    }), {
      attempts: 3,
      delayMs: 800,
      onRetry: (err, attempt, attempts) => {
        console.warn(`[Email][${requestId}] Retry ${attempt}/${attempts - 1}: ${toErrorMessage(err)}`);
      },
    });

    adminSent = true;

    // Отправка подтверждения клиенту (если указан email)
    if (payload.email && payload.email.trim()) {
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

      await retryAsync(() => transporter.sendMail({
        from: `"Future Screen" <${process.env.SMTP_USER}>`,
        to: payload.email,
        subject: 'Ваша заявка принята — Future Screen',
        text: clientText.join('\n'),
        html: clientHtml,
      }), {
        attempts: 2,
        delayMs: 700,
        onRetry: (err, attempt, attempts) => {
          console.warn(`[EmailClient][${requestId}] Retry ${attempt}/${attempts - 1}: ${toErrorMessage(err)}`);
        },
      });

      clientSent = true;
    }
  } catch (err) {
    errorMessage = toErrorMessage(err);
    console.error(`[Email][${requestId}] Ошибка отправки:`, errorMessage);
  }

  return {
    adminSent,
    clientSent,
    errorMessage,
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;

  if (!isOriginAllowed(origin)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  // CORS headers
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const { source, name, phone, email, telegram, city, date, format, comment, extra } = req.body;
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    console.log('[API] Получена заявка', { source, hasEmail: Boolean(email), hasTelegram: Boolean(telegram), ip });

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
      sendEmail(payload, requestId),
    ]);

    const tgOk = tg.status === 'fulfilled' && tg.value;
    const emailSend = emailResult.status === 'fulfilled'
      ? emailResult.value
      : { adminSent: false, clientSent: false, errorMessage: toErrorMessage(emailResult.reason) };

    const emailOk = emailSend.adminSent;
    const ok = tgOk || emailOk;

    let tgEmailAlertSent = false;
    if (!emailSend.adminSent && emailSend.errorMessage) {
      tgEmailAlertSent = await sendTelegram(formatEmailFailureAlertMessage({
        requestId,
        source,
        name,
        phone,
        email,
        errorMessage: emailSend.errorMessage,
      }));
    }

    console.log(`[API][${requestId}] source=${source} email=${emailSend.adminSent} clientEmail=${emailSend.clientSent} tg=${tgOk}`);

    if (!ok) {
      return res.status(502).json({
        ok: false,
        requestId,
        telegram: tgOk,
        email: emailOk,
        clientEmail: emailSend.clientSent,
        tgEmailAlertSent,
        emailError: emailSend.errorMessage,
        error: 'Не удалось отправить ни Telegram, ни Email',
      });
    }

    res.status(200).json({
      ok: true,
      requestId,
      telegram: tgOk,
      email: emailOk,
      clientEmail: emailSend.clientSent,
      tgEmailAlertSent,
      ...(emailSend.adminSent ? {} : { emailError: emailSend.errorMessage }),
    });
  } catch (err) {
    console.error('[API] Ошибка:', err);
    res.status(500).json({ error: 'Ошибка отправки' });
  }
}
