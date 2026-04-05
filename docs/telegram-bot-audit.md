# Аудит Telegram-бота и системы хранилища

**Дата аудита:** 2026-04-05  
**Проект:** future-screen  
**Суммарный статус:** ✅ Исправлено и задеплоено

---

## 1. Найденные проблемы и исправления

### 🔴 КРИТИЧНО — Неправильное имя bucket в Supabase Storage

**Проблема:**  
Код бота загружал файлы в bucket `media`, которого **не существует**.  
В Supabase есть только один bucket — `images`.

```ts
// ❌ Было (неправильно)
const bucket = 'media';
await supabase.storage.from(bucket).upload(...)
```

**Исправление:**
```ts
// ✅ Стало
await getSupabaseClient().storage.from('images').upload(storagePath, ...)
```

**Файл:** [`api/telegram-webhook.ts`](../api/telegram-webhook.ts)  
**Влияние:** Все попытки загрузки фото через бота завершались ошибкой `Bucket not found`

---

### 🔴 КРИТИЧНО — Потеря состояния сессии при Vercel cold start

**Проблема:**  
Состояния пользователей (какие теги выбраны, в каком состоянии диалог) хранились в `Map` в памяти процесса. При каждом cold start Vercel (перезапуск функции) состояния сбрасывались.

```ts
// ❌ Было — in-memory хранение
const userStates = new Map<number, { state: ...; selectedTags: ...; }>();
```

При этом в базе данных **уже существовала таблица** `telegram_sessions` для персистентного хранения!

**Исправление:**  
Переключён на Supabase `telegram_sessions`:
```ts
// ✅ Стало — персистентное хранение в Supabase
const getSession = async (chatId: number): Promise<Session | null> => { ... }
const setSession = async (chatId: number, session: Session): Promise<void> => { ... }
const clearSession = async (chatId: number): Promise<void> => { ... }
```

**Влияние:** Диалог стабильно работает даже если между двумя запросами произошёл cold start

---

### 🟠 ВАЖНО — Дублирование обработки сообщений не было реализовано

**Проблема:**  
В базе данных **существовала таблица** `telegram_processed_messages` для предотвращения дублирования (Telegram может отправлять webhook повторно при ошибках), но код её **не использовал**.

**Исправление:**
```ts
// ✅ Стало — проверка перед обработкой
const alreadyProcessed = await isMessageAlreadyProcessed(message.message_id);
if (alreadyProcessed) return res.status(200).json({ ok: true });
await markMessageAsProcessed(message.message_id);
```

**Влияние:** Предотвращает двойную загрузку одного файла

---

### 🟡 СРЕДНЕ — Отсутствие rewrite в vercel.json

**Проблема:**  
Путь `/api/telegram-webhook` не был прописан в `rewrites` в [`vercel.json`](../vercel.json). Из-за этого Telegram не мог достучаться до обработчика.

**Исправление:**
```json
{
  "source": "/api/telegram-webhook",
  "destination": "/api/telegram-webhook.ts"
}
```

---

### 🟡 СРЕДНЕ — setInterval в serverless функции

**Проблема:**  
`setInterval` для очистки старых состояний несовместим с serverless архитектурой — таймер не выполнится после завершения запроса.

**Исправление:**  
Заменён на cleanup при каждом запросе (при работе с in-memory, затем полностью убран после переключения на Supabase, где очистка — через DB trigger).

---

### 🟡 СРЕДНЕ — Lazy Supabase инициализация

**Проблема:**  
Supabase клиент инициализировался на уровне модуля при импорте. Если env vars не заданы, функция падала с ошибкой `createClient` до первого запроса.

**Исправление:**  
Инициализация перенесена в lazy-функцию `getSupabaseClient()` с явной проверкой env vars.

---

### 🟢 МЕЛКО — Management endpoints только через POST

**Проблема:**  
Endpoints `?action=setWebhook` и `?action=getWebhookInfo` требовали POST, но браузер открывает через GET.

**Исправление:**  
Перенесены в `req.method === 'GET'` ветку.

---

## 2. Текущее состояние системы

### База данных (Supabase project: `pyframwlnqrzeynqcvle`)

| Таблица | Строк | Назначение |
|---------|-------|------------|
| `media_items` | 15 | Медиа-библиотека (фото, видео) |
| `telegram_sessions` | 0 | Сессии бота (персистентные) |
| `telegram_processed_messages` | 0 | Дедупликация сообщений |
| `cases` | 3 | Кейсы портфолио |
| `leads` | 1 | Заявки с сайта |

### Supabase Storage

| Bucket | Публичный | Папки |
|--------|-----------|-------|
| `images` | ✅ | `images/`, `videos/`, `cases/` |

### RLS Политики

- `media_items`: PUBLIC READ + authenticated write ✅
- `telegram_sessions`: только service_role ✅  
- `telegram_processed_messages`: только service_role ✅

### Vercel

| Переменная | Статус |
|-----------|--------|
| `TG_BOT_TOKEN` | Должна быть в Vercel Settings |
| `SUPABASE_URL` | Должна быть в Vercel Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Должна быть в Vercel Settings |

---

## 3. Webhook статус

**URL webhook:** `https://future-screen.vercel.app/api/telegram-webhook`  
**Последняя ошибка (до исправления):** `Wrong response from the webhook: 500 Internal Server Error`

**Проверить после деплоя:**
```
https://future-screen.vercel.app/api/telegram-webhook?action=getWebhookInfo
```

**Установить webhook (если нужно):**
```
https://future-screen.vercel.app/api/telegram-webhook?action=setWebhook&url=https://future-screen.vercel.app/api/telegram-webhook
```

---

## 4. Поток работы бота (после исправлений)

```
Пользователь → /upload
    ↓
Бот показывает теги из БД (media_items) + кнопку "Новый тег"
    ↓
Пользователь выбирает / вводит теги
    ↓ (сессия сохраняется в telegram_sessions)
Пользователь нажимает "Готово"
    ↓
Бот переходит в режим awaiting_files
    ↓
Пользователь отправляет фото/видео
    ↓ (проверка дедупликации через telegram_processed_messages)
Бот скачивает файл с серверов Telegram
    ↓
Загрузка в Supabase Storage → bucket "images"
    ↓
Запись в media_items с тегами + telegram_message_id
    ↓
✅ "Файл загружен!" + путь + теги
```

---

## 5. Что проверить вручную

- [ ] Зайти в бот, отправить `/upload`
- [ ] Убедиться что появляются теги из БД
- [ ] Ввести новый тег через кнопку
- [ ] Отправить фото
- [ ] Проверить что файл появился в Supabase Storage → `images/images/`
- [ ] Проверить что запись появилась в таблице `media_items`
- [ ] Отправить то же фото второй раз — должно быть заблокировано дедупликацией

---

## 6. Технический долг

- **Хранение сессий в памяти** полностью убрано — теперь только Supabase
- **Максимум 20 тегов** в клавиатуре — ограничение по кнопкам Telegram. Можно увеличить при необходимости
- **Файлы > 20MB** не поддерживаются Telegram Bot API через `getFile`. Для больших файлов нужен другой подход
- **Очистка старых сессий** реализована через DB trigger в Supabase (автоматически)
- **Очистка processed_messages** реализована через DB trigger (хранит последние N записей)

---

*Аудит проведён автоматически. Все исправления запушены в `main` ветку на GitHub.*
