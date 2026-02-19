const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const sendEmail = async (params: Record<string, unknown>): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[Email] Ошибка:', err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Email] Сетевая ошибка:', err);
    return false;
  }
};
