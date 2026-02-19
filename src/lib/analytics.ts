type EventName = 'click_phone' | 'submit_form' | 'submit_quiz' | 'view_case';

const YANDEX_METRIKA_ID = 85439743;

export const trackEvent = (name: EventName, payload?: Record<string, unknown>) => {
  // Отправка в Яндекс.Метрику
  if (window.ym) {
    window.ym(YANDEX_METRIKA_ID, 'reachGoal', name, payload);
  }

  // Логирование для отладки
  console.info('[analytics]', name, payload || {});
};
