type EventName = 'click_phone' | 'click_whatsapp' | 'submit_form' | 'submit_quiz' | 'view_case';

export const trackEvent = (name: EventName, payload?: Record<string, unknown>) => {
  // TODO: интеграция с Яндекс.Метрика / коллтрекингом
  console.info('[analytics]', name, payload || {});
};
