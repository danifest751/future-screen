import path from 'node:path';

export const SERVER_PORT = Number(process.env.SERVER_PORT || 3001);
export const CLIENT_LOGS_DIR = path.join(process.cwd(), 'logs');
export const CLIENT_LOGS_FILE = path.join(CLIENT_LOGS_DIR, 'client-errors.log');
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || `https://future-screen.ru,https://future-screen.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : ''}`)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX = 10;
export const SMTP_TIMEOUT_MS = 4000;
