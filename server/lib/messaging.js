import nodemailer from 'nodemailer';
import { SMTP_TIMEOUT_MS } from '../config.js';
import { retryAsync, toErrorMessage } from './http.js';
import {
  buildAdminEmailMessage,
  buildClientEmailMessage,
  formatEmailFailureAlertMessage as formatEmailFailureAlertMessageCore,
  formatTelegramMessage as formatTelegramMessageCore,
  sanitizeEmailPayload,
} from './emailCore.js';

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

export const formatTelegramMessage = (payload) => formatTelegramMessageCore(payload);

export const formatEmailFailureAlertMessage = (payload) => formatEmailFailureAlertMessageCore(payload);

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
  let adminSent = false;
  let clientSent = false;
  let errorMessage = '';
  let clientErrorMessage = '';

  const { payload: cleanPayload, valid, errors } = sanitizeEmailPayload(payload);

  if (!valid) {
    return {
      adminSent: false,
      clientSent: false,
      errorMessage: errors.join('; '),
      clientErrorMessage: '',
    };
  }

  try {
    await retryAsync(() => transporter.sendMail(buildAdminEmailMessage(cleanPayload, requestId)), {
      attempts: 3,
      delayMs: 800,
      onRetry: (err, attempt, attempts) => {
        console.warn(`[Email][${requestId}] Retry ${attempt}/${attempts - 1}: ${toErrorMessage(err)}`);
      },
    });

    adminSent = true;

    if (cleanPayload.email) {
      try {
        await retryAsync(() => transporter.sendMail(buildClientEmailMessage(cleanPayload)), {
          attempts: 2,
          delayMs: 700,
          onRetry: (err, attempt, attempts) => {
            console.warn(`[EmailClient][${requestId}] Retry ${attempt}/${attempts - 1}: ${toErrorMessage(err)}`);
          },
        });

        clientSent = true;
      } catch (err) {
        clientErrorMessage = toErrorMessage(err);
        console.warn(`[EmailClient][${requestId}] Ошибка отправки клиенту:`, clientErrorMessage);
      }
    }
  } catch (err) {
    errorMessage = toErrorMessage(err);
    console.error(`[Email][${requestId}] Ошибка отправки:`, errorMessage);
  }

  return {
    adminSent,
    clientSent,
    errorMessage,
    clientErrorMessage,
  };
};
