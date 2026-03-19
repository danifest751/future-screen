import 'dotenv/config';
import { createApp } from './createApp.js';
import { SERVER_PORT } from './config.js';

const app = createApp();

app.listen(SERVER_PORT, () => {
  console.log(`[Server] Запущен на http://localhost:${SERVER_PORT}`);
});
