import express from 'express';
import cors from 'cors';
import { ALLOWED_ORIGINS, CLIENT_LOGS_DIR, CLIENT_LOGS_FILE, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from './config.js';
import { createRateLimiter, getClientIp, isOriginAllowed } from './lib/http.js';
import { createTransporter, sendEmail, sendTelegram } from './lib/messaging.js';
import { createClientLogHandler } from './routes/clientLog.js';
import { createSendHandler } from './routes/send.js';

export const createApp = () => {
  const app = express();
  const transporter = createTransporter();
  const isRateLimited = createRateLimiter({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX });

  app.use(cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin, ALLOWED_ORIGINS)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS blocked'));
    },
  }));
  app.use(express.json());

  // Rate limiting middleware для всех API endpoints
  app.use('/api', (req, res, next) => {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return res.status(429).json({ ok: false, error: 'Too many requests' });
    }
    return next();
  });

  app.post('/api/client-log', createClientLogHandler({
    clientLogsDir: CLIENT_LOGS_DIR,
    clientLogsFile: CLIENT_LOGS_FILE,
  }));

  app.post('/api/send', createSendHandler({
    sendTelegram,
    sendEmail: (payload, requestId) => sendEmail(payload, requestId, transporter),
  }));

  transporter.verify()
    .then(() => console.log('[SMTP] Подключение к mail.ru OK'))
    .catch((err) => console.error('[SMTP] Ошибка подключения:', err.message));

  return app;
};
