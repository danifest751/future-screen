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

const getErrorLogUrl = () => {
  if (import.meta.env.VITE_ERROR_LOG_URL) return import.meta.env.VITE_ERROR_LOG_URL as string;
  if (import.meta.env.DEV) return 'http://localhost:3001/api/client-log';
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

  // H12: do not monkey-patch window.console.error.
  //
  // Original intent was to ship every console.error to /api/client-log so
  // we could see react warnings in production. The cost:
  //   - Swallows third-party log lines into our backend (noise + PII risk).
  //   - If sendClientLog itself fails and throws, the failure funnels
  //     through the new console.error and loops.
  //   - Breaks libraries that replace console.error themselves (Sentry,
  //     DataDog) because order of installation matters.
  //
  // The two listeners below are enough: uncaught exceptions and unhandled
  // promise rejections both fire window events natively. Anything we
  // explicitly want to report should call `reportClientError` instead.

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
