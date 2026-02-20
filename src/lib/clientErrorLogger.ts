type LogLevel = 'error' | 'unhandledrejection' | 'exception';

type ClientLogPayload = {
  level: LogLevel;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  meta?: Record<string, unknown>;
};

const LOG_TAG = '[client-log]';

const getErrorLogUrl = () => {
  if (import.meta.env.VITE_ERROR_LOG_URL) return import.meta.env.VITE_ERROR_LOG_URL as string;
  return '/api/client-log';
};

const toError = (value: unknown): Error => {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
};

const sendClientLog = async (payload: ClientLogPayload) => {
  const body = JSON.stringify(payload);
  try {
    const endpoint = getErrorLogUrl();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });

    if (!response.ok) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        await fetch('http://localhost:3001/api/client-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        });
      }
    }
  } catch {
    // silent: logger must never break app flow
  }
};

export const installClientErrorLogger = () => {
  if (typeof window === 'undefined') return;

  const originalConsoleError = window.console.error.bind(window.console);

  window.console.error = (...args: unknown[]) => {
    originalConsoleError(...args);

    const first = args[0];
    if (typeof first === 'string' && first.includes(LOG_TAG)) return;

    const normalized = toError(first);
    void sendClientLog({
      level: 'error',
      message: normalized.message,
      stack: normalized.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      meta: {
        args: args.map((arg) => {
          if (arg instanceof Error) return { message: arg.message, stack: arg.stack };
          if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') return arg;
          return String(arg);
        }),
      },
    });
  };

  window.addEventListener('error', (event) => {
    const err = event.error ? toError(event.error) : new Error(event.message || 'Unknown window error');
    void sendClientLog({
      level: 'exception',
      message: err.message,
      stack: err.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      meta: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const err = toError(event.reason);
    void sendClientLog({
      level: 'unhandledrejection',
      message: err.message,
      stack: err.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      meta: {
        reason: String(event.reason),
      },
    });
  });
};
