import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;
const CLIENT_LOGS_DIR = path.join(process.cwd(), 'logs');
const CLIENT_LOGS_FILE = path.join(CLIENT_LOGS_DIR, 'client-errors.log');

app.use(cors({ origin: true }));
app.use(express.json());

app.post('/api/client-log', async (req, res) => {
  try {
    const payload = req.body ?? {};
    const entry = {
      timestamp: new Date().toISOString(),
      level: payload.level || 'error',
      message: payload.message || 'Unknown client error',
      stack: payload.stack || null,
      url: payload.url || null,
      userAgent: payload.userAgent || null,
      meta: payload.meta || null,
    };

    await mkdir(CLIENT_LOGS_DIR, { recursive: true });
    await appendFile(CLIENT_LOGS_FILE, `${JSON.stringify(entry)}\n`, 'utf8');

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[ClientLog] Ошибка записи:', err?.message || err);
    res.status(500).json({ ok: false });
  }
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

transporter.verify()
  .then(() => console.log('[SMTP] Подключение к mail.ru OK'))
  .catch((err) => console.error('[SMTP] Ошибка подключения:', err.message));

app.post('/api/send', async (req, res) => {
  try {
    const { source, name, phone, email, telegram, city, date, format, comment, extra } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ ok: false, error: 'Имя и телефон обязательны' });
    }

    const lines = [
      `Новая заявка: ${source || 'Сайт'}`,
      '',
      `Имя: ${name}`,
      `Телефон: ${phone}`,
    ];

    if (email) lines.push(`Email: ${email}`);
    if (telegram) lines.push(`Telegram: ${telegram}`);
    if (city) lines.push(`Город: ${city}`);
    if (date) lines.push(`Дата: ${date}`);
    if (format) lines.push(`Формат: ${format}`);
    if (comment) lines.push(`Комментарий: ${comment}`);

    if (extra && typeof extra === 'object') {
      lines.push('');
      for (const [key, value] of Object.entries(extra)) {
        lines.push(`${key}: ${value}`);
      }
    }

    const text = lines.join('\n');

    const htmlLines = lines.map((l) => {
      if (!l) return '<br>';
      const [label, ...rest] = l.split(': ');
      if (rest.length > 0) return `<b>${label}:</b> ${rest.join(': ')}`;
      return `<b>${l}</b>`;
    });

    await transporter.sendMail({
      from: `"Future Screen" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_TO || process.env.SMTP_USER,
      replyTo: email || process.env.SMTP_USER,
      subject: `Заявка: ${source || 'Сайт'} — ${name}`,
      text,
      html: htmlLines.join('<br>'),
    });

    let clientEmailSent = false;
    if (email && String(email).trim()) {
      const clientLines = [
        `Здравствуйте, ${name}!`,
        '',
        'Ваша заявка принята. Мы свяжемся с вами в течение 15 минут.',
        '',
        'Детали заявки:',
        `Источник: ${source || 'Сайт'}`,
        `Телефон: ${phone}`,
      ];

      if (city) clientLines.push(`Город: ${city}`);
      if (date) clientLines.push(`Дата: ${date}`);
      if (format) clientLines.push(`Формат: ${format}`);
      if (comment) clientLines.push(`Комментарий: ${comment}`);

      if (extra && typeof extra === 'object') {
        clientLines.push('');
        clientLines.push('Детали расчёта:');
        for (const [key, value] of Object.entries(extra)) {
          clientLines.push(`${key}: ${value}`);
        }
      }

      clientLines.push('');
      clientLines.push('С уважением,');
      clientLines.push('Команда Future Screen');

      const clientHtml = clientLines.map((l) => {
        if (!l) return '<br>';
        const [label, ...rest] = l.split(': ');
        if (rest.length > 0) return `<b>${label}:</b> ${rest.join(': ')}`;
        return l;
      }).join('<br>');

      try {
        await transporter.sendMail({
          from: `"Future Screen" <${process.env.SMTP_USER}>`,
          to: String(email).trim(),
          subject: 'Ваша заявка принята — Future Screen',
          text: clientLines.join('\n'),
          html: clientHtml,
        });
        clientEmailSent = true;
      } catch (clientErr) {
        console.warn('[Email] Не удалось отправить подтверждение клиенту:', clientErr?.message || clientErr);
      }
    }

    console.log(`[Email] Отправлено: ${source} — ${name} ${phone}`);
    res.json({ ok: true, email: clientEmailSent });
  } catch (err) {
    const message = err?.message || 'Unknown error';
    console.error('[Email] Ошибка отправки:', message);
    res.status(500).json({ ok: false, error: 'Ошибка отправки письма', details: message });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] Запущен на http://localhost:${PORT}`);
});
