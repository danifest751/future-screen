export const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

export const toCleanString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

export const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export const toErrorMessage = (err) => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  return err?.message || String(err);
};

export const retryAsync = async (
  task,
  {
    attempts = 3,
    delayMs = 600,
    onRetry,
  } = {},
) => {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        if (onRetry) onRetry(err, attempt, attempts);
        await wait(delayMs * attempt);
      }
    }
  }

  throw lastError;
};

export const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return value?.split(',')[0]?.trim() || req.ip || 'unknown';
};

export const isOriginAllowed = (origin, allowedOrigins) => {
  if (!origin) {
    console.log('[CORS] Origin не предоставлен, разрешаем');
    return true;
  }
  // Нормализуем origin: убираем trailing slash и приводим к нижнему регистру для сравнения
  const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
  const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, '').toLowerCase());
  const isAllowed = normalizedAllowed.includes(normalizedOrigin);
  
  if (!isAllowed) {
    console.log(`[CORS] Origin "${origin}" (normalized: "${normalizedOrigin}") не в списке разрешенных:`, normalizedAllowed);
  }
  
  return isAllowed;
};

export const createRateLimiter = ({ windowMs, max }) => {
  const requestsByIp = new Map();

  return (ip) => {
    const now = Date.now();
    const attempts = (requestsByIp.get(ip) || []).filter((timestamp) => now - timestamp < windowMs);
    if (attempts.length >= max) {
      requestsByIp.set(ip, attempts);
      return true;
    }

    attempts.push(now);
    requestsByIp.set(ip, attempts);
    return false;
  };
};
