import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

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
    const { source, name, phone, city, date, format, comment, extra } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ ok: false, error: 'Имя и телефон обязательны' });
    }

    const lines = [
      `Новая заявка: ${source || 'Сайт'}`,
      '',
      `Имя: ${name}`,
      `Телефон: ${phone}`,
    ];

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
      subject: `Заявка: ${source || 'Сайт'} — ${name}`,
      text,
      html: htmlLines.join('<br>'),
    });

    console.log(`[Email] Отправлено: ${source} — ${name} ${phone}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[Email] Ошибка отправки:', err.message);
    res.status(500).json({ ok: false, error: 'Ошибка отправки письма' });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] Запущен на http://localhost:${PORT}`);
});
