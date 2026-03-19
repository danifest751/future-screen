import { appendFile, mkdir } from 'node:fs/promises';

export const createClientLogHandler = ({ clientLogsDir, clientLogsFile }) => async (req, res) => {
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

    await mkdir(clientLogsDir, { recursive: true });
    await appendFile(clientLogsFile, `${JSON.stringify(entry)}\n`, 'utf8');

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[ClientLog] Ошибка записи:', err?.message || err);
    res.status(500).json({ ok: false });
  }
};
