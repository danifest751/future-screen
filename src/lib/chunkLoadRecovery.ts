const CHUNK_RECOVERY_STORAGE_KEY = 'future-screen:chunk-recovery-at';
const CHUNK_RECOVERY_COOLDOWN_MS = 30_000;

const chunkErrorFragments = [
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
  'chunkloaderror',
  'loading chunk',
];

export const isChunkLoadError = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const normalized = message.toLowerCase();
  return chunkErrorFragments.some((fragment) => normalized.includes(fragment));
};

export const isAssetScriptError = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLScriptElement)) return false;
  return target.src.includes('/assets/');
};

export const recoverFromChunkLoadError = async (error: unknown): Promise<boolean> => {
  if (!isChunkLoadError(error)) return false;

  const now = Date.now();
  const lastAttempt = Number(window.sessionStorage.getItem(CHUNK_RECOVERY_STORAGE_KEY) || 0);
  if (now - lastAttempt < CHUNK_RECOVERY_COOLDOWN_MS) return false;

  window.sessionStorage.setItem(CHUNK_RECOVERY_STORAGE_KEY, String(now));

  if ('caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
    } catch {
      // Best effort only: reload still fixes the common stale-index case.
    }
  }

  window.location.reload();
  return true;
};
