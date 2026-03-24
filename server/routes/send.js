import { processEmailSubmission } from '../lib/emailCore.js';

export const createSendHandler = ({ sendTelegram, sendEmail }) => async (req, res) => {
  const result = await processEmailSubmission({
    body: req.body,
    sendTelegram,
    sendEmail,
  });

  if (result.body?.requestId) {
    console.log(`[API][${result.body.requestId}] status=${result.status} email=${Boolean(result.body.email)} clientEmail=${Boolean(result.body.clientEmail)} tg=${Boolean(result.body.telegram)}`);
  }

  return res.status(result.status).json(result.body);
};
