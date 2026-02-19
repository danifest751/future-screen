type EventName = 'click_phone' | 'click_whatsapp' | 'submit_form' | 'submit_quiz' | 'view_case';

const YANDEX_METRIKA_ID = 85439743;

export const trackEvent = (name: EventName, payload?: Record<string, any>) => {
  // Отправка в Яндекс.Метрику
  if (window.ym) {
    window.ym(YANDEX_METRIKA_ID, 'reachGoal', name, payload);
  }

  // Логирование для отладки
  console.info('[analytics]', name, payload || {});
};
