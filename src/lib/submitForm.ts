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
      throw new Error(`HTTP ${response.status}`);
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
    // Fallback: пробуем старый метод (для локальной разработки)
    const { sendTelegram } = await import('./telegram');
    const { sendEmail } = await import('./email');

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
