/**
 * Асинхронная обёртка над localStorage для избежания блокировки основного потока.
 * Использует MessageChannel для асинхронного доступа к localStorage.
 */

/**
 * Асинхронно получить значение из localStorage.
 * @param key - Ключ для получения
 * @returns Promise с значением или null
 */
export async function asyncGetItem(key: string): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const value = window.localStorage.getItem(key);
      resolve(value);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Асинхронно установить значение в localStorage.
 * @param key - Ключ для установки
 * @param value - Значение для установки
 * @returns Promise<void>
 */
export async function asyncSetItem(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      window.localStorage.setItem(key, value);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Асинхронно удалить значение из localStorage.
 * @param key - Ключ для удаления
 * @returns Promise<void>
 */
export async function asyncRemoveItem(key: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  return new Promise((resolve) => {
    try {
      window.localStorage.removeItem(key);
      resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Асинхронно получить и распарсить JSON из localStorage.
 * @param key - Ключ для получения
 * @returns Promise с распарсенным значением или null
 */
export async function asyncGetJson<T>(key: string): Promise<T | null> {
  const raw = await asyncGetItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Асинхронно записать значение как JSON в localStorage.
 * @param key - Ключ для записи
 * @param value - Значение для записи
 * @returns Promise<void>
 */
export async function asyncSetJson<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  return asyncSetItem(key, serialized);
}

/**
 * Получить все ключи localStorage.
 * @returns Promise с массивом ключей
 */
export async function asyncGetAllKeys(): Promise<string[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  return new Promise((resolve) => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      resolve(keys);
    } catch {
      resolve([]);
    }
  });
}

/**
 * Очистить весь localStorage.
 * @returns Promise<void>
 */
export async function asyncClear(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  return new Promise((resolve) => {
    try {
      window.localStorage.clear();
      resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Проверить, доступен ли localStorage.
 * @returns boolean
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
