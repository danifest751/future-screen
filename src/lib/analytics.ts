type EventName =
  | 'click_phone'
  | 'click_cta_hero'
  | 'click_whatsapp'
  | 'submit_form'
  | 'submit_cta_form'
  | 'submit_quiz'
  | 'view_case';

const YANDEX_METRIKA_ID = 85439743;

export const trackEvent = (name: EventName, payload?: Record<string, unknown>) => {
  if (window.ym) {
    window.ym(YANDEX_METRIKA_ID, 'reachGoal', name, payload);
  }

  if (import.meta.env.DEV) {
    console.info('[analytics]', name, payload || {});
  }
};
