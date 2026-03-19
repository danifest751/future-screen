export const createSendHandler = ({ sendTelegram, sendEmail, formatTelegramMessage, formatEmailFailureAlertMessage }) => async (req, res) => {
  const { source, name, phone, email, telegram, city, date, format, comment, extra } = req.body ?? {};
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  if (!name || !phone) {
    return res.status(400).json({ ok: false, error: 'Имя и телефон обязательны' });
  }

  const payload = { source, name, phone, email, telegram, city, date, format, comment, extra };

  const [tg, emailResult] = await Promise.allSettled([
    sendTelegram(formatTelegramMessage(payload)),
    sendEmail(payload, requestId),
  ]);

  const tgOk = tg.status === 'fulfilled' && tg.value;
  const emailSend = emailResult.status === 'fulfilled'
    ? emailResult.value
    : { adminSent: false, clientSent: false, errorMessage: emailResult.reason?.message || String(emailResult.reason || 'Unknown error') };

  const emailOk = emailSend.adminSent;
  const ok = tgOk || emailOk;

  let tgEmailAlertSent = false;
  if (!emailSend.adminSent && emailSend.errorMessage) {
    tgEmailAlertSent = await sendTelegram(formatEmailFailureAlertMessage({
      requestId,
      source,
      name,
      phone,
      email,
      errorMessage: emailSend.errorMessage,
    }));
  }

  console.log(`[API][${requestId}] source=${source} email=${emailSend.adminSent} clientEmail=${emailSend.clientSent} tg=${tgOk}`);

  if (!ok) {
    return res.status(502).json({
      ok: false,
      requestId,
      telegram: tgOk,
      email: emailOk,
      clientEmail: emailSend.clientSent,
      tgEmailAlertSent,
      emailError: emailSend.errorMessage,
      error: 'Не удалось отправить ни Telegram, ни Email',
    });
  }

  return res.status(200).json({
    ok: true,
    requestId,
    telegram: tgOk,
    email: emailOk,
    clientEmail: emailSend.clientSent,
    tgEmailAlertSent,
    ...(emailSend.adminSent ? {} : { emailError: emailSend.errorMessage }),
  });
};
