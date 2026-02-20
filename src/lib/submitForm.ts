import { supabase } from './supabase';

export type FormPayload = {
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
  pagePath?: string;
  referrer?: string;
};

const saveToLeads = async (payload: FormPayload) => {
  try {
    const extra = {
      ...(payload.extra ?? {}),
      ...(payload.pagePath ? { pagePath: payload.pagePath } : {}),
      ...(payload.referrer ? { referrer: payload.referrer } : {}),
    };

    const { error } = await supabase.from('leads').insert({
      source: payload.source,
      name: payload.name,
      phone: payload.phone,
      email: payload.email ?? null,
      telegram: payload.telegram ?? null,
      city: payload.city ?? null,
      date: payload.date ?? null,
      format: payload.format ?? null,
      comment: payload.comment ?? null,
      extra,
    });

    if (error) {
      console.error('[saveToLeads] Ошибка:', error.message);
    }
  } catch (e) {
    console.error('[saveToLeads] Ошибка:', e);
  }
};

export const submitForm = async (payload: FormPayload): Promise<{ tg: boolean; email: boolean }> => {
  // Сохраняем заявку в Supabase
  await saveToLeads(payload);

  // Определяем API URL
  const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
  const apiUrl = rawApiUrl
    ? (rawApiUrl.endsWith('/api/send') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api/send`)
    : (import.meta.env.DEV ? 'http://localhost:3001/api/send' : '/api/send');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}${responseBody ? `: ${responseBody}` : ''}`);
    }

    const result = await response.json().catch(() => ({} as Record<string, unknown>));

    const telegram = typeof result.telegram === 'boolean' ? result.telegram : false;
    const email = typeof result.email === 'boolean'
      ? result.email
      : (typeof result.ok === 'boolean' ? result.ok : true);

    return {
      tg: telegram,
      email,
    };
  } catch (err) {
    console.error('[submitForm] Ошибка:', err);
    // В production не уходим в клиентские fallback-каналы,
    // чтобы не получать частичный успех (например, только Telegram без email).
    if (!import.meta.env.DEV) {
      return { tg: false, email: false };
    }

    // Fallback: пробуем старый метод только для локальной разработки
    const { sendTelegram } = await import('./telegram');
    const { sendEmail } = await import('./email');

    const formatTelegramMessage = (p: FormPayload): string => {
      const escapeHtml = (value = ''): string => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const toCleanString = (value: unknown): string => {
        if (value === null || value === undefined) return '';
        return String(value).trim();
      };

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

    const [tg, email] = await Promise.allSettled([
      sendTelegram(formatTelegramMessage(payload)),
      sendEmail(payload),
    ]);

    return {
      tg: tg.status === 'fulfilled' && tg.value,
      email: email.status === 'fulfilled' && email.value,
    };
  }
};
