import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import 'dotenv/config';
import { processEmailSubmission } from '../server/lib/emailCore.js';

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'https://future-screen.ru,https://future-screen.vercel.app,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const requestsByIp = new Map<string, number[]>();

type SubmissionBody = {
  requestId?: string;
  email?: boolean;
  clientEmail?: boolean;
  telegram?: boolean;
  emailError?: string;
  clientEmailError?: string;
  error?: string;
  validationErrors?: string[];
  details?: string;
  tgEmailAlertSent?: boolean;
};

type SubmissionRequestBody = {
  requestId?: string;
  pagePath?: string;
  referrer?: string;
};

type DeliveryLogEntry = {
  at: string;
  step: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  channel: 'system' | 'api' | 'telegram' | 'email' | 'client-email' | 'database';
  message: string;
  details?: string;
  meta?: Record<string, string>;
};

type DeliveryLogger = (entry: Omit<DeliveryLogEntry, 'at'>) => Promise<void>;

const isOriginAllowed = (origin?: string) => {
  if (!origin) return true;
  const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
  const normalizedAllowed = allowedOrigins.map((item) => item.replace(/\/$/, '').toLowerCase());
  return normalizedAllowed.includes(normalizedOrigin);
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

let supabaseAdmin: SupabaseClient | null = null;

const getSupabaseAdmin = (): SupabaseClient | null => {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.warn('[LeadTracking] SUPABASE_URL is not configured');
    return null;
  }

  if (!serviceRole) {
    // Hard refusal: writes to `leads`/`delivery_log` require service role.
    // Falling back to the anon key historically let rows silently stay in the
    // `processing` state because RLS blocked UPDATE. Fail loudly instead.
    console.error(
      '[LeadTracking] SUPABASE_SERVICE_ROLE_KEY is not configured — refusing to fall back to anon key',
    );
    return null;
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  return supabaseAdmin;
};

const emailPayloadSchema = z.object({
  source: z.string().max(100).default('Сайт').optional(),
  name: z.string().min(1, 'Укажите имя').max(100),
  phone: z.string().min(5, 'Телефон слишком короткий').max(20),
  email: z.string().email('Некорректный email').max(100).optional().nullable(),
  telegram: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  date: z.string().max(50).optional().nullable(),
  format: z.string().max(100).optional().nullable(),
  comment: z.string().max(1000).optional().nullable(),
  extra: z.record(z.string()).optional().nullable(),
});

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
  clientErrorMessage: string;
};

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const escapeHtml = (value = ''): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const toCleanString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const toErrorMessage = (err: unknown): string => {
  if (!err) return 'Неизвестная ошибка';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message?: unknown }).message ?? 'Неизвестная ошибка');
  }
  return String(err);
};

const normalizeRequestId = (value: unknown): string =>
  toCleanString(value).replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 120);

const getRequestIdFromBody = (body: unknown): string => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return '';
  return normalizeRequestId((body as SubmissionRequestBody).requestId);
};

const toRecord = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const entries = Object.entries(value)
    .map(([key, item]) => [String(key), toCleanString(item)] as const)
    .filter(([, item]) => item);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const buildLogEntry = (entry: Omit<DeliveryLogEntry, 'at'>): DeliveryLogEntry => ({
  at: new Date().toISOString(),
  ...entry,
});

const deriveLeadStatus = (body: SubmissionBody | undefined, statusCode: number): string => {
  if (!body) return statusCode >= 400 ? 'failed' : 'processing';
  if (statusCode >= 500) return 'failed';
  if (body.email && body.telegram) return 'delivered';
  if (body.email || body.telegram || body.clientEmail) return 'partial';
  if (body.error || statusCode >= 400) return 'failed';
  return 'processing';
};

const loadExistingLeadLog = async (requestId: string): Promise<DeliveryLogEntry[]> => {
  const supabase = getSupabaseAdmin();
  if (!supabase || !requestId) return [];

  const { data, error } = await supabase
    .from('leads')
    .select('delivery_log')
    .eq('request_id', requestId)
    .maybeSingle();

  if (error) {
    console.warn(`[LeadTracking][${requestId}] failed to load log: ${error.message}`);
    return [];
  }

  return Array.isArray(data?.delivery_log) ? (data.delivery_log as DeliveryLogEntry[]) : [];
};

const persistLeadState = async ({
  requestId,
  status,
  deliveryLog,
  pagePath,
  referrer,
}: {
  requestId: string;
  status: string;
  deliveryLog: DeliveryLogEntry[];
  pagePath?: string;
  referrer?: string;
}): Promise<void> => {
  const supabase = getSupabaseAdmin();
  if (!supabase || !requestId) return;

  const payload: Record<string, unknown> = {
    request_id: requestId,
    status,
    delivery_log: deliveryLog,
  };

  if (pagePath) payload.page_path = pagePath;
  if (referrer) payload.referrer = referrer;

  const { error } = await supabase
    .from('leads')
    .update(payload)
    .eq('request_id', requestId);

  if (error) {
    console.warn(`[LeadTracking][${requestId}] failed to persist: ${error.message}`);
  }
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
        onRetry?.(err, attempt, attempts);
        await wait(delayMs * attempt);
      }
    }
  }

  throw lastError;
};

const RU_PAGE_LABELS: Record<string, string> = {
  '/': 'Главная',
  '/prices': 'Цены',
  '/cases': 'Кейсы',
  '/contacts': 'Контакты',
  '/support': 'Поддержка',
  '/consult': 'Консультация',
  '/rent': 'Аренда',
  '/rent/video': 'Аренда: Видеоэкраны',
  '/rent/sound': 'Аренда: Звук',
  '/rent/light': 'Аренда: Свет',
  '/rent/stage': 'Аренда: Сцены',
  '/rent/instruments': 'Аренда: Инструменты',
  '/rent/computers': 'Аренда: Компьютеры',
  '/rent/touchscreens': 'Аренда: Тач-панели',
  '/rent/staff': 'Аренда: Персонал',
};

const normalizePath = (value: string): string => {
  if (!value) return '';
  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      const parsed = new URL(value);
      return parsed.pathname || '/';
    }
  } catch {
    // ignore parse errors and use raw value
  }
  return value.startsWith('/') ? value : '';
};

const localizeSourceToRu = (rawSource: string): string => {
  const source = toCleanString(rawSource);
  if (!source) return 'Сайт';

  const match = source.match(/\((\/[^)]+)\)\s*$/);
  const path = normalizePath(match?.[1] ?? '');
  const baseRaw = match ? source.replace(match[0], '').trim() : source;

  const baseNormalized = baseRaw.toLowerCase();
  const baseLocalized =
    baseNormalized.startsWith('quote form') || baseNormalized.startsWith('form quote')
      ? 'Форма заявки'
      : baseNormalized.startsWith('site') || baseNormalized.startsWith('future screen form')
        ? 'Сайт'
        : baseRaw;

  if (!path) return baseLocalized || 'Сайт';

  const pathLabel = RU_PAGE_LABELS[path] || `Страница ${path}`;
  return `${baseLocalized || 'Сайт'} — ${pathLabel}`;
};

const formatTelegramMessage = (payload: EmailPayload): string => {
  const sourceLabel = localizeSourceToRu(payload.source);
  const lines = [
    '<b>🔥 Новая заявка</b>',
    `<b>Источник:</b> ${escapeHtml(sourceLabel)}`,
    '',
  ];

  const pushField = (label: string, value: unknown) => {
    const clean = toCleanString(value);
    if (!clean) return;
    lines.push(`<b>${label}:</b> ${escapeHtml(clean)}`);
  };

  pushField('Имя', payload.name);
  pushField('Телефон', payload.phone);
  pushField('Email', payload.email);
  pushField('Telegram', payload.telegram);
  pushField('Город', payload.city);
  pushField('Дата', payload.date);
  pushField('Формат', payload.format);
  pushField('Комментарий', payload.comment);

  if (payload.extra) {
    const extraEntries = Object.entries(payload.extra)
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
  const sourceLabel = localizeSourceToRu(toCleanString(source));
  const lines = [
    '<b>⚠️ Ошибка доставки Email</b>',
    `<b>Request ID:</b> <code>${escapeHtml(requestId)}</code>`,
    '',
    `<b>Источник:</b> ${escapeHtml(sourceLabel)}`,
    `<b>Имя:</b> ${escapeHtml(toCleanString(name) || '—')}`,
    `<b>Телефон:</b> ${escapeHtml(toCleanString(phone) || '—')}`,
  ];

  const cleanEmail = toCleanString(email);
  if (cleanEmail) lines.push(`<b>Email:</b> ${escapeHtml(cleanEmail)}`);

  lines.push('');
  lines.push(`<b>Причина:</b> ${escapeHtml(toCleanString(errorMessage) || 'Неизвестная ошибка')}`);
  return lines.join('\n');
};

const sendTelegram = async (message: string, logDelivery?: DeliveryLogger): Promise<boolean> => {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] token or chat id is not configured');
    await logDelivery?.({
      step: 'telegram_not_configured',
      channel: 'telegram',
      status: 'warning',
      message: 'Telegram is not configured',
    });
    return false;
  }

  try {
    await logDelivery?.({
      step: 'telegram_send_started',
      channel: 'telegram',
      status: 'pending',
      message: 'Sending message to Telegram',
    });

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
        console.warn(`[Telegram] retry ${attempt}/${attempts - 1}: ${toErrorMessage(err)}`);
        void logDelivery?.({
          step: 'telegram_retry',
          channel: 'telegram',
          status: 'warning',
          message: `Retry ${attempt}/${attempts - 1}`,
          details: toErrorMessage(err),
        });
      },
    });

    await logDelivery?.({
      step: 'telegram_sent',
      channel: 'telegram',
      status: 'success',
      message: 'Telegram delivery completed',
    });
    return true;
  } catch (err) {
    console.error('[Telegram] error:', toErrorMessage(err));
    await logDelivery?.({
      step: 'telegram_failed',
      channel: 'telegram',
      status: 'error',
      message: 'Telegram delivery failed',
      details: toErrorMessage(err),
    });
    return false;
  }
};

const sendEmail = async (
  payload: EmailPayload,
  requestId: string,
  logDelivery?: DeliveryLogger,
): Promise<EmailSendResult> => {
  const sourceLabel = localizeSourceToRu(payload.source);
  const lines = [
    `Новая заявка: ${sourceLabel}`,
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
    lines.push('Параметры расчета:');
    for (const [key, value] of Object.entries(payload.extra)) {
      lines.push(`${key}: ${value}`);
    }
  }

  const text = lines.join('\n');
  const html = lines
    .map((line) => {
      if (!line) return '<br>';
      const [label, ...rest] = line.split(': ');
      if (rest.length > 0) return `<b>${escapeHtml(label)}:</b> ${escapeHtml(rest.join(': '))}`;
      return `<b>${escapeHtml(line)}</b>`;
    })
    .join('<br>');

  let adminSent = false;
  let clientSent = false;
  let errorMessage = '';
  let clientErrorMessage = '';

  try {
    await logDelivery?.({
      step: 'admin_email_started',
      channel: 'email',
      status: 'pending',
      message: 'Sending admin email',
    });

    await retryAsync(
      () =>
        transporter.sendMail({
          from: `"Future Screen" <${process.env.SMTP_USER}>`,
          to: process.env.SMTP_TO || process.env.SMTP_USER,
          subject: `Заявка: ${sourceLabel} — ${payload.name}`,
          text,
          html,
        }),
      {
        attempts: 3,
        delayMs: 800,
        onRetry: (err, attempt, attempts) => {
          console.warn(`[Email][${requestId}] retry ${attempt}/${attempts - 1}: ${toErrorMessage(err)}`);
          void logDelivery?.({
            step: 'admin_email_retry',
            channel: 'email',
            status: 'warning',
            message: `Admin email retry ${attempt}/${attempts - 1}`,
            details: toErrorMessage(err),
          });
        },
      },
    );

    adminSent = true;
    await logDelivery?.({
      step: 'admin_email_sent',
      channel: 'email',
      status: 'success',
      message: 'Admin email delivered',
    });

    if (payload.email && payload.email.trim()) {
      try {
        await logDelivery?.({
          step: 'client_email_started',
          channel: 'client-email',
          status: 'pending',
          message: 'Sending confirmation email to client',
        });

        const clientText = [
          `Здравствуйте, ${payload.name}!`,
          '',
          'Ваша заявка получена. Мы свяжемся с вами в ближайшее время.',
          '',
          'Детали заявки:',
          `Источник: ${sourceLabel}`,
          `Телефон: ${payload.phone}`,
        ];

        if (payload.city) clientText.push(`Город: ${payload.city}`);
        if (payload.date) clientText.push(`Дата: ${payload.date}`);
        if (payload.format) clientText.push(`Формат: ${payload.format}`);
        if (payload.comment) clientText.push(`Комментарий: ${payload.comment}`);

        if (payload.extra) {
          clientText.push('');
          clientText.push('Параметры расчета:');
          for (const [key, value] of Object.entries(payload.extra)) {
            clientText.push(`${key}: ${value}`);
          }
        }

        clientText.push('');
        clientText.push('С уважением,');
        clientText.push('Команда Future Screen');

        const clientHtml = clientText
          .map((line) => {
            if (!line) return '<br>';
            const [label, ...rest] = line.split(': ');
            if (rest.length > 0) return `<b>${escapeHtml(label)}:</b> ${escapeHtml(rest.join(': '))}`;
            return escapeHtml(line);
          })
          .join('<br>');

        await retryAsync(
          () =>
            transporter.sendMail({
              from: `"Future Screen" <${process.env.SMTP_USER}>`,
              to: payload.email,
              subject: 'Ваша заявка принята — Future Screen',
              text: clientText.join('\n'),
              html: clientHtml,
            }),
          {
            attempts: 2,
            delayMs: 700,
            onRetry: (err, attempt, attempts) => {
              console.warn(
                `[EmailClient][${requestId}] retry ${attempt}/${attempts - 1}: ${toErrorMessage(err)}`,
              );
              void logDelivery?.({
                step: 'client_email_retry',
                channel: 'client-email',
                status: 'warning',
                message: `Client email retry ${attempt}/${attempts - 1}`,
                details: toErrorMessage(err),
              });
            },
          },
        );

        clientSent = true;
        await logDelivery?.({
          step: 'client_email_sent',
          channel: 'client-email',
          status: 'success',
          message: 'Client confirmation email delivered',
        });
      } catch (err) {
        clientErrorMessage = toErrorMessage(err);
        console.warn(`[EmailClient][${requestId}] error:`, clientErrorMessage);
        await logDelivery?.({
          step: 'client_email_failed',
          channel: 'client-email',
          status: 'warning',
          message: 'Client confirmation email failed',
          details: clientErrorMessage,
        });
      }
    } else {
      await logDelivery?.({
        step: 'client_email_skipped',
        channel: 'client-email',
        status: 'warning',
        message: 'Client email skipped because email is missing',
      });
    }
  } catch (err) {
    errorMessage = toErrorMessage(err);
    console.error(`[Email][${requestId}] error:`, errorMessage);
    await logDelivery?.({
      step: 'admin_email_failed',
      channel: 'email',
      status: 'error',
      message: 'Admin email delivery failed',
      details: errorMessage,
    });
  }

  return {
    adminSent,
    clientSent,
    errorMessage,
    clientErrorMessage,
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const body = req.body as SubmissionRequestBody | undefined;
  const requestId = getRequestIdFromBody(body);
  const pagePath = toCleanString(body?.pagePath) || undefined;
  const referrer = toCleanString(body?.referrer) || undefined;
  const deliveryLog = await loadExistingLeadLog(requestId);
  let currentLeadStatus = 'processing';

  const syncLeadState = async (
    status: string,
    entry?: Omit<DeliveryLogEntry, 'at'>,
  ): Promise<void> => {
    if (entry) {
      deliveryLog.push(buildLogEntry(entry));
    }

    currentLeadStatus = status;
    await persistLeadState({
      requestId,
      status,
      deliveryLog,
      pagePath,
      referrer,
    });
  };

  const logDelivery: DeliveryLogger = async (entry) => {
    await syncLeadState(currentLeadStatus, entry);
  };

  if (!isOriginAllowed(origin)) {
    await syncLeadState('failed', {
      step: 'origin_rejected',
      channel: 'api',
      status: 'error',
      message: 'Origin rejected by CORS',
      details: toCleanString(origin) || 'unknown origin',
    });
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    await syncLeadState('failed', {
      step: 'method_rejected',
      channel: 'api',
      status: 'error',
      message: 'Method not allowed',
      details: req.method || 'unknown',
    });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  await syncLeadState('processing', {
    step: 'api_received',
    channel: 'api',
    status: 'success',
    message: 'API received request',
    meta: toRecord({
      ip,
      origin: origin || '',
      pagePath: pagePath || '',
      referrer: referrer || '',
    }),
  });

  if (isRateLimited(ip)) {
    await syncLeadState('failed', {
      step: 'rate_limited',
      channel: 'api',
      status: 'error',
      message: 'Rate limit exceeded',
    });
    return res.status(429).json({ ok: false, error: 'Too many requests' });
  }

  const validation = emailPayloadSchema.safeParse(req.body);
  if (!validation.success) {
    const details = validation.error.errors.map((item) => `${item.path.join('.')}: ${item.message}`);
    await syncLeadState('failed', {
      step: 'validation_failed',
      channel: 'api',
      status: 'error',
      message: 'Validation failed',
      details: details.join('; '),
    });
    return res.status(400).json({
      ok: false,
      error: 'Validation failed',
      details,
    });
  }

  const result = await processEmailSubmission({
    body: req.body,
    sendTelegram: (message) => sendTelegram(message, logDelivery),
    sendEmail: (payload: unknown, currentRequestId: string) =>
      sendEmail(payload as EmailPayload, currentRequestId, logDelivery),
    formatTelegramMessage: formatTelegramMessage as unknown as (payload: unknown) => string,
    formatEmailFailureAlertMessage: formatEmailFailureAlertMessage as unknown as (payload: {
      requestId: string;
      source?: string;
      name?: string;
      phone?: string;
      email?: string;
      errorMessage: string;
    }) => string,
  });

  const responseBody = result.body as SubmissionBody;
  const finalStatus = deriveLeadStatus(responseBody, result.status);

  await syncLeadState(finalStatus, {
    step: finalStatus === 'failed' ? 'submission_failed' : 'submission_finished',
    channel: 'system',
    status: finalStatus === 'failed' ? 'error' : 'success',
    message: finalStatus === 'failed' ? 'Submission failed' : 'Submission finished',
    details:
      responseBody.error ||
      responseBody.emailError ||
      responseBody.clientEmailError ||
      responseBody.details,
    meta: toRecord({
      email: String(Boolean(responseBody.email)),
      telegram: String(Boolean(responseBody.telegram)),
      clientEmail: String(Boolean(responseBody.clientEmail)),
      tgEmailAlertSent: String(Boolean(responseBody.tgEmailAlertSent)),
    }),
  });

  if (responseBody.requestId) {
    console.log(
      `[API][${responseBody.requestId}] status=${result.status} email=${Boolean(responseBody.email)} clientEmail=${Boolean(responseBody.clientEmail)} tg=${Boolean(responseBody.telegram)}`,
    );
  }

  return res.status(result.status).json(result.body);
}
