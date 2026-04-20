const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const retryAsync = async <T>(
  task: () => Promise<T>,
  {
    attempts = 3,
    delayMs = 600,
    onRetry,
  }: {
    attempts?: number;
    delayMs?: number;
    onRetry?: (err: unknown, attempt: number, attempts: number) => void;
  } = {},
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        onRetry?.(err, attempt, attempts);
        await wait(delayMs * attempt);
      }
    }
  }

  throw lastError;
};
