import { describe, it, expect, vi } from 'vitest';
import { retryAsync } from './retry.js';

describe('sendApi/retry', () => {
  it('returns task result on the first successful attempt', async () => {
    const task = vi.fn().mockResolvedValue('ok');
    const result = await retryAsync(task, { attempts: 3, delayMs: 1 });

    expect(result).toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('retries failing task up to `attempts` times and returns the eventual value', async () => {
    const task = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('recovered');

    const onRetry = vi.fn();
    const result = await retryAsync(task, { attempts: 3, delayMs: 1, onRetry });

    expect(result).toBe('recovered');
    expect(task).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 3);
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 3);
  });

  it('throws the last error when all attempts fail', async () => {
    const task = vi
      .fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockRejectedValue(new Error('final'));

    await expect(retryAsync(task, { attempts: 3, delayMs: 1 })).rejects.toThrow('final');
    expect(task).toHaveBeenCalledTimes(3);
  });

  it('does not call onRetry after the final failed attempt', async () => {
    const task = vi.fn().mockRejectedValue(new Error('always-fails'));
    const onRetry = vi.fn();

    await expect(retryAsync(task, { attempts: 2, delayMs: 1, onRetry })).rejects.toThrow();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('uses defaults when options are omitted', async () => {
    const task = vi.fn().mockResolvedValue('default-ok');
    await expect(retryAsync(task)).resolves.toBe('default-ok');
  });
});
