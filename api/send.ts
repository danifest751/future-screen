import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { processEmailSubmission } from '../server/lib/emailCore.js';
import { checkRateLimit } from './_lib/rateLimit.js';
import {
  buildLogEntry,
  deriveLeadStatus,
  loadExistingLeadLog,
  persistLeadState,
  upsertLeadFromPayload,
} from '../server/lib/sendApi/leadTracking.js';
import { retryAsync } from '../server/lib/sendApi/retry.js';
import {
  formatEmailFailureAlertMessage,
  formatTelegramMessage,
  localizeSourceToRu,
} from '../server/lib/sendApi/formatters.js';
import type {
  DeliveryLogEntry,
  DeliveryLogger,
  EmailPayload,
  EmailSendResult,
  SubmissionBody,
  SubmissionRequestBody,
} from '../server/lib/sendApi/types.js';
import {
  escapeHtml,
  getRequestIdFromBody,
  toCleanString,
  toErrorMessage,
  toRecord,
} from '../server/lib/sendApi/utils.js';

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'https://future-screen.ru,https://future-screen.vercel.app,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

// H8: empty Origin used to pass. An attacker calling the endpoint from
// curl / a non-browser tool just omits the header and gets through CORS.
// Now Origin is required on state-changing methods (POST/OPTIONS) and the
// caller must match the allow-list. Browsers always send Origin for
// cross-origin XHR, so legitimate traffic is unaffected.
const isOriginAllowed = (origin: string | undefined, requireOrigin: boolean): boolean => {
  if (!origin) return !requireOrigin;
  const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
  const normalizedAllowed = allowedOrigins.map((item) => item.replace(/\/$/, '').toLowerCase());
  return normalizedAllowed.includes(normalizedOrigin);
};

const getClientIp = (req: VercelRequest) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return value?.split(',')[0]?.trim() || 'unknown';
};

let supabaseAdmin: SupabaseClient | null = null;

const getSupabaseAdmin = (): SupabaseClient => {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }

  if (!serviceRole) {
    // Hard refusal: writes to `leads`/`delivery_log` require service role.
    // Falling back to the anon key historically let rows silently stay in the
    // `processing` state because RLS blocked UPDATE. Fail loudly instead.
    console.error(
      '[LeadTracking] SUPABASE_SERVICE_ROLE_KEY is not configured — refusing to fall back to anon key',
    );
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
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

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// PR #5a (C5): server is now the single writer for the `leads` table.
// Previously the browser INSERTed a 'queued' row directly via the anon key
// before calling /api/send. That INSERT path has to be closed so we can
// revoke the anonymous INSERT policy in PR #5b — otherwise an attacker
// could POST arbitrary PII rows straight into the table bypassing
// validation and rate-limit.
//
// Called exactly once per request, right after Zod validation succeeds.
//
// Why SELECT-then-INSERT-or-UPDATE instead of .upsert():
// The unique index on request_id is partial —
//   CREATE UNIQUE INDEX ... (request_id) WHERE request_id IS NOT NULL
// (see supabase/migrations/20260406_add_lead_delivery_tracking.sql).
// Postgres will not use a partial unique index for ON CONFLICT unless
// the exact predicate is repeated in the conflict target, and
// supabase-js has no way to express that WHERE clause. The call returns
// 400 "no unique or exclusion constraint matching the ON CONFLICT
// specification". A SELECT + conditional INSERT/UPDATE is idempotent
// against duplicate requestIds (same row) and needs no migration.

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
  let supabase: SupabaseClient;

  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    const details = toErrorMessage(err);
    console.error(`[LeadTracking][${requestId || 'no-request-id'}] config error: ${details}`);
    return res.status(500).json({
      ok: false,
      error: 'Server misconfiguration: lead tracking is unavailable',
      details,
    });
  }

  const deliveryLog = await loadExistingLeadLog(supabase, requestId);
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
      supabase,
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

  const methodRequiresOrigin = req.method === 'POST' || req.method === 'OPTIONS';
  if (!isOriginAllowed(origin, methodRequiresOrigin)) {
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

  const rl = await checkRateLimit('send', ip);
  if (!rl.allowed) {
    res.setHeader('Retry-After', Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)).toString());
    await syncLeadState('failed', {
      step: 'rate_limited',
      channel: 'api',
      status: 'error',
      message: 'Rate limit exceeded',
      meta: toRecord({ limit: String(rl.limit), remaining: String(rl.remaining) }),
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

  // PR #5a: the server now owns the INSERT. Persist the lead as soon as
  // the payload has been validated — any downstream syncLeadState() call
  // then UPDATEs this row.
  const validatedPayload = validation.data as EmailPayload;
  await upsertLeadFromPayload({
    supabase,
    requestId,
    payload: validatedPayload,
    pagePath,
    referrer,
    deliveryLog,
  });

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
