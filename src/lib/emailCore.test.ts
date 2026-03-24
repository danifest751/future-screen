import { expect, vi } from 'vitest';

const emailCore = await import('./emailCore');

const {
  formatTelegramMessage,
  normalizeEmailPayload,
  processEmailSubmission,
  validateEmailPayload,
} = emailCore;

describe('emailCore', () => {
  it('normalizes payload values and limits extra fields', () => {
    const payload = normalizeEmailPayload({
      source: '  Форма КП  ',
      name: '  Иван Петров  ',
      phone: ' +7 (999) 123-45-67 ',
      email: ' TEST@Example.com ',
      telegram: ' @ivan ',
      city: '  Москва ',
      date: ' 25–27 мая ',
      format: '  Конференция ',
      comment: '  Комментарий  ',
      extra: {
        '  Площадка  ': '  Крокус  ',
        empty: '   ',
      },
    });

    expect(payload).toEqual({
      source: 'Форма КП',
      name: 'Иван Петров',
      phone: '+7 (999) 123-45-67',
      email: 'test@example.com',
      telegram: '@ivan',
      city: 'Москва',
      date: '25–27 мая',
      format: 'Конференция',
      comment: 'Комментарий',
      extra: {
        Площадка: 'Крокус',
      },
    });
  });

  it('validates bad payloads', () => {
    const result = validateEmailPayload({
      name: 'И',
      phone: '12',
      email: 'not-an-email',
      extra: 'wrong',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      'Имя должно содержать минимум 2 символа',
      'Телефон указан некорректно',
      'Некорректный email',
      'extra должен быть объектом',
    ]));
  });

  it('escapes telegram message HTML', () => {
    const message = formatTelegramMessage({
      source: '<script>bad</script>',
      name: 'Иван <b>Петров</b>',
      phone: '+7 (999) 123-45-67',
      comment: 'Тест <img src=x onerror=alert(1)>',
    });

    expect(message).toContain('&lt;script&gt;bad&lt;/script&gt;');
    expect(message).toContain('&lt;b&gt;Петров&lt;/b&gt;');
    expect(message).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('rejects honeypot submissions', async () => {
    const result = await processEmailSubmission({
      body: {
        name: 'Иван',
        phone: '+7 (999) 123-45-67',
        honey: 'spam',
      },
      sendTelegram: vi.fn(),
      sendEmail: vi.fn(),
    });

    expect(result.status).toBe(400);
    expect(result.body.ok).toBe(false);
    expect(result.body.error).toBe('Подозрительная активность');
  });

  it('returns success when admin email is delivered', async () => {
    const sendTelegram = vi.fn().mockResolvedValue(false);
    const sendEmail = vi.fn().mockResolvedValue({
      adminSent: true,
      clientSent: true,
      errorMessage: '',
      clientErrorMessage: '',
    });

    const result = await processEmailSubmission({
      body: {
        source: 'Форма КП',
        name: 'Иван Петров',
        phone: '+7 (999) 123-45-67',
        email: 'client@example.com',
        extra: { project: 'LED' },
      },
      sendTelegram,
      sendEmail,
    });

    expect(sendTelegram).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      ok: true,
      telegram: false,
      email: true,
      clientEmail: true,
    });
  });

  it('returns a 502 response when all delivery channels fail', async () => {
    const sendTelegram = vi.fn().mockResolvedValue(false);
    const sendEmail = vi.fn().mockResolvedValue({
      adminSent: false,
      clientSent: false,
      errorMessage: 'SMTP failed',
      clientErrorMessage: '',
    });

    const result = await processEmailSubmission({
      body: {
        source: 'Форма КП',
        name: 'Иван Петров',
        phone: '+7 (999) 123-45-67',
      },
      sendTelegram,
      sendEmail,
    });

    expect(result.status).toBe(502);
    expect(result.body.ok).toBe(false);
    expect(result.body.error).toBe('Не удалось отправить ни Telegram, ни Email');
  });
});
