import { escapeHtml, toCleanString, toErrorMessage } from './http.js';

const FIELD_LIMITS = {
  source: 120,
  name: 100,
  phone: 50,
  email: 254,
  telegram: 64,
  city: 120,
  date: 120,
  format: 120,
  comment: 2000,
  extraKey: 80,
  extraValue: 200,
  extraItems: 20,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isPlainObject = (value) => Boolean(value)
  && typeof value === 'object'
  && !Array.isArray(value)
  && Object.prototype.toString.call(value) === '[object Object]';

const normalizeText = (value, maxLength) => {
  const clean = toCleanString(value).replace(/\r\n?/g, '\n');
  return maxLength ? clean.slice(0, maxLength) : clean;
};

const normalizeHeaderValue = (value, maxLength) => normalizeText(value, maxLength)
  .replace(/[\r\n]+/g, ' ')
  .trim();

const normalizeEmail = (value) => normalizeHeaderValue(value, FIELD_LIMITS.email)
  .replace(/\s+/g, '')
  .toLowerCase();

const normalizePhone = (value) => normalizeHeaderValue(value, FIELD_LIMITS.phone);

const normalizeExtra = (value) => {
  if (!isPlainObject(value)) return {};

  const entries = [];
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = normalizeText(rawKey, FIELD_LIMITS.extraKey);
    const cleanValue = normalizeText(rawValue, FIELD_LIMITS.extraValue);
    if (!key || !cleanValue) continue;
    entries.push([key, cleanValue]);
    if (entries.length >= FIELD_LIMITS.extraItems) break;
  }

  return Object.fromEntries(entries);
};

const countDigits = (value) => String(value || '').replace(/\D/g, '').length;

export const normalizeEmailPayload = (rawPayload = {}) => {
  const payload = isPlainObject(rawPayload) ? rawPayload : {};

  return {
    source: normalizeText(payload.source, FIELD_LIMITS.source) || 'Сайт',
    name: normalizeText(payload.name, FIELD_LIMITS.name),
    phone: normalizePhone(payload.phone),
    email: normalizeEmail(payload.email),
    telegram: normalizeHeaderValue(payload.telegram, FIELD_LIMITS.telegram),
    city: normalizeHeaderValue(payload.city, FIELD_LIMITS.city),
    date: normalizeHeaderValue(payload.date, FIELD_LIMITS.date),
    format: normalizeHeaderValue(payload.format, FIELD_LIMITS.format),
    comment: normalizeText(payload.comment, FIELD_LIMITS.comment),
    extra: normalizeExtra(payload.extra),
  };
};

export const validateEmailPayload = (rawPayload) => {
  const errors = [];
  const payload = isPlainObject(rawPayload) ? rawPayload : {};

  if (!rawPayload || typeof rawPayload !== 'object') {
    return {
      valid: false,
      errors: ['Некорректный payload'],
    };
  }

  const name = normalizeText(payload.name, FIELD_LIMITS.name);
  const phone = normalizePhone(payload.phone);
  const email = normalizeEmail(payload.email);
  const telegram = normalizeHeaderValue(payload.telegram, FIELD_LIMITS.telegram);
  const comment = normalizeText(payload.comment, FIELD_LIMITS.comment);

  if (!name) errors.push('Укажите имя');
  if (!phone) errors.push('Укажите телефон');

  if (name && name.length < 2) {
    errors.push('Имя должно содержать минимум 2 символа');
  }

  if (phone && countDigits(phone) < 5) {
    errors.push('Телефон указан некорректно');
  }

  if (email && !EMAIL_RE.test(email)) {
    errors.push('Некорректный email');
  }

  if (telegram && telegram.length > FIELD_LIMITS.telegram) {
    errors.push('Telegram слишком длинный');
  }

  if (comment && comment.length > FIELD_LIMITS.comment) {
    errors.push('Комментарий слишком длинный');
  }

  if (!isPlainObject(payload.extra)) {
    errors.push('extra должен быть объектом');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const sanitizeEmailPayload = (rawPayload) => {
  const payload = normalizeEmailPayload(rawPayload);
  const validation = validateEmailPayload(payload);

  return {
    payload,
    ...validation,
  };
};

const formatLines = (lines) => {
  const text = lines.join('\n');
  const html = lines.map((line) => {
    if (!line) return '<br>';
    const [label, ...rest] = line.split(': ');
    if (rest.length > 0) return `<b>${escapeHtml(label)}:</b> ${escapeHtml(rest.join(': '))}`;
    return `<b>${escapeHtml(line)}</b>`;
  }).join('<br>');

  return { text, html };
};

export const formatTelegramMessage = (payload) => {
  const cleanPayload = normalizeEmailPayload(payload);
  const lines = [
    '<b>🔥 Новая заявка</b>',
    `<b>Источник:</b> ${escapeHtml(cleanPayload.source || 'Сайт')}`,
    '',
  ];

  const pushFieldLine = (label, value) => {
    const clean = normalizeText(value, 400);
    if (!clean) return;
    lines.push(`<b>${label}:</b> ${escapeHtml(clean)}`);
  };

  pushFieldLine('Имя', cleanPayload.name);
  pushFieldLine('Телефон', cleanPayload.phone);
  pushFieldLine('Email', cleanPayload.email);
  pushFieldLine('Telegram', cleanPayload.telegram);
  pushFieldLine('Город', cleanPayload.city);
  pushFieldLine('Дата', cleanPayload.date);
  pushFieldLine('Формат', cleanPayload.format);
  pushFieldLine('Комментарий', cleanPayload.comment);

  if (cleanPayload.extra && Object.keys(cleanPayload.extra).length > 0) {
    lines.push('');
    lines.push('<b>Параметры расчета:</b>');
    for (const [key, value] of Object.entries(cleanPayload.extra)) {
      lines.push(`• <b>${escapeHtml(key)}:</b> ${escapeHtml(value)}`);
    }
  }

  return lines.join('\n');
};

export const formatEmailFailureAlertMessage = ({
  requestId,
  source,
  name,
  phone,
  email,
  errorMessage,
}) => {
  const lines = [
    '<b>⚠️ Ошибка доставки Email</b>',
    `<b>Request ID:</b> <code>${escapeHtml(normalizeHeaderValue(requestId, 120))}</code>`,
    '',
    `<b>Источник:</b> ${escapeHtml(normalizeText(source, FIELD_LIMITS.source) || 'Сайт')}`,
    `<b>Имя:</b> ${escapeHtml(normalizeText(name, FIELD_LIMITS.name) || '—')}`,
    `<b>Телефон:</b> ${escapeHtml(normalizeText(phone, FIELD_LIMITS.phone) || '—')}`,
  ];

  const cleanEmail = normalizeEmail(email);
  if (cleanEmail) lines.push(`<b>Email:</b> ${escapeHtml(cleanEmail)}`);

  lines.push('');
  lines.push(`<b>Причина:</b> ${escapeHtml(normalizeText(errorMessage, 400) || 'Unknown error')}`);
  return lines.join('\n');
};

export const buildAdminEmailMessage = (payload, requestId) => {
  const cleanPayload = normalizeEmailPayload(payload);
  const lines = [
    `Новая заявка: ${cleanPayload.source || 'Сайт'}`,
    '',
    `Имя: ${cleanPayload.name}`,
    `Телефон: ${cleanPayload.phone}`,
  ];

  if (cleanPayload.email) lines.push(`Email: ${cleanPayload.email}`);
  if (cleanPayload.telegram) lines.push(`Telegram: ${cleanPayload.telegram}`);
  if (cleanPayload.city) lines.push(`Город: ${cleanPayload.city}`);
  if (cleanPayload.date) lines.push(`Дата: ${cleanPayload.date}`);
  if (cleanPayload.format) lines.push(`Формат: ${cleanPayload.format}`);
  if (cleanPayload.comment) lines.push(`Комментарий: ${cleanPayload.comment}`);

  if (cleanPayload.extra && Object.keys(cleanPayload.extra).length > 0) {
    lines.push('');
    lines.push('Параметры расчета:');
    for (const [key, value] of Object.entries(cleanPayload.extra)) {
      lines.push(`${key}: ${value}`);
    }
  }

  const { text, html } = formatLines(lines);
  const safeRequestId = requestId ? normalizeHeaderValue(requestId, 120) : '';

  return {
    from: `"Future Screen" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_TO || process.env.SMTP_USER,
    replyTo: cleanPayload.email || process.env.SMTP_USER,
    subject: `Заявка${safeRequestId ? ` [${safeRequestId}]` : ''}: ${cleanPayload.source || 'Сайт'} — ${cleanPayload.name}`,
    text,
    html,
  };
};

export const buildClientEmailMessage = (payload) => {
  const cleanPayload = normalizeEmailPayload(payload);
  const lines = [
    `Здравствуйте, ${cleanPayload.name}!`,
    '',
    'Ваша заявка принята. Мы свяжемся с вами в течение 15 минут.',
    '',
    'Детали заявки:',
    `Источник: ${cleanPayload.source || 'Сайт'}`,
    `Телефон: ${cleanPayload.phone}`,
  ];

  if (cleanPayload.city) lines.push(`Город: ${cleanPayload.city}`);
  if (cleanPayload.date) lines.push(`Дата: ${cleanPayload.date}`);
  if (cleanPayload.format) lines.push(`Формат: ${cleanPayload.format}`);
  if (cleanPayload.comment) lines.push(`Комментарий: ${cleanPayload.comment}`);

  if (cleanPayload.extra && Object.keys(cleanPayload.extra).length > 0) {
    lines.push('');
    lines.push('Детали расчёта:');
    for (const [key, value] of Object.entries(cleanPayload.extra)) {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('');
  lines.push('С уважением,');
  lines.push('Команда Future Screen');

  const { text, html } = formatLines(lines);

  return {
    from: `"Future Screen" <${process.env.SMTP_USER}>`,
    to: cleanPayload.email,
    subject: 'Ваша заявка принята — Future Screen',
    text,
    html,
  };
};

export const createRequestId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const processEmailSubmission = async ({
  body,
  sendTelegram,
  sendEmail,
  formatTelegramMessage: formatTelegramMessageFn = formatTelegramMessage,
  formatEmailFailureAlertMessage: formatEmailFailureAlertMessageFn = formatEmailFailureAlertMessage,
}) => {
  const requestId = createRequestId();
  const rawBody = isPlainObject(body) ? body : {};
  const honey = normalizeText(rawBody.honey, 50);

  if (honey) {
    return {
      status: 400,
      body: {
        ok: false,
        requestId,
        error: 'Подозрительная активность',
      },
    };
  }

  const { payload, valid, errors } = sanitizeEmailPayload(rawBody);

  if (!valid) {
    return {
      status: 400,
      body: {
        ok: false,
        requestId,
        error: 'Некорректные данные заявки',
        validationErrors: errors,
      },
    };
  }

  try {
    const [tg, emailResult] = await Promise.allSettled([
      sendTelegram(formatTelegramMessageFn(payload)),
      sendEmail(payload, requestId),
    ]);

    const tgOk = tg.status === 'fulfilled' && Boolean(tg.value);
    const emailSend = emailResult.status === 'fulfilled'
      ? emailResult.value
      : {
        adminSent: false,
        clientSent: false,
        errorMessage: toErrorMessage(emailResult.reason),
        clientErrorMessage: '',
      };

    const ok = tgOk || emailSend.adminSent;
    const responseBody = {
      ok,
      requestId,
      telegram: tgOk,
      email: emailSend.adminSent,
      clientEmail: emailSend.clientSent,
    };

    let tgEmailAlertSent = false;
    if (!emailSend.adminSent && emailSend.errorMessage) {
      tgEmailAlertSent = await sendTelegram(formatEmailFailureAlertMessageFn({
        requestId,
        source: payload.source,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        errorMessage: emailSend.errorMessage,
      }));
    }

    if (tgEmailAlertSent) {
      responseBody.tgEmailAlertSent = true;
    }

    if (emailSend.clientErrorMessage) {
      responseBody.clientEmailError = emailSend.clientErrorMessage;
    }

    if (emailSend.adminSent) {
      responseBody.email = true;
    } else if (emailSend.errorMessage) {
      responseBody.emailError = emailSend.errorMessage;
    }

    if (!ok) {
      return {
        status: 502,
        body: {
          ...responseBody,
          ok: false,
          error: 'Не удалось отправить ни Telegram, ни Email',
        },
      };
    }

    return {
      status: 200,
      body: responseBody,
    };
  } catch (err) {
    return {
      status: 500,
      body: {
        ok: false,
        requestId,
        error: 'Ошибка отправки заявки',
        details: toErrorMessage(err),
      },
    };
  }
};
