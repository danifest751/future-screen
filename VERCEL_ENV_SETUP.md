# Настройка Environment Variables в Vercel

## Инструкция

1. Зайди на https://vercel.com
2. Выбери проект `future-screen`
3. Перейди в **Settings** → **Environment Variables**
4. Добавь следующие переменные **для всех окружений** (Production, Preview, Development):

### Обязательные переменные

| Name | Value | Пример |
|------|-------|--------|
| `VITE_ADMIN_LOGIN` | Логин админки | `admin` |
| `VITE_ADMIN_PASSWORD` | Пароль админки | `fs2024` |

### Для отправки заявок (Email + Telegram)

| Name | Value | Пример |
|------|-------|--------|
| `SMTP_USER` | Email отправителя | `futurescreen@list.ru` |
| `SMTP_PASS` | Пароль SMTP | `lEhFPgfbasP9MeqBpW2a` |
| `SMTP_TO` | Email получателя | `futurescreen@list.ru` |
| `VITE_TG_BOT_TOKEN` | Токен бота Telegram | `123456789:ABCdef...` |
| `VITE_TG_CHAT_ID` | Chat ID для уведомлений | `123456789` |

## Как получить переменные

### Telegram Bot Token
1. Открой @BotFather в Telegram
2. Отправь `/newbot`
3. Следуй инструкциям
4. Скопируй токен (выглядит как `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Telegram Chat ID
1. Открой @userinfobot в Telegram
2. Нажми Start
3. Бот покажет твой Chat ID (число, например `123456789`)

### SMTP Password (Mail.ru / List.ru)
1. Зайди в почту на mail.ru или list.ru
2. Настройки → Безопасность → Пароли для внешних приложений
3. Создать новый пароль
4. Скопируй пароль (это и есть SMTP_PASS)

## После добавления

1. Нажми **Save** для каждой переменной
2. Перейди в **Deployments**
3. Найди последний деплой
4. Нажми **⋮** → **Redeploy** (или сделай новый push в репозиторий)

## Проверка

После деплоя:
1. Открой сайт на Vercel
2. Заполни форму заявки
3. Проверь Email (SMTP_TO) на получение письма
4. Проверь Telegram на получение уведомления

---

## Текущие значения (из .env)

```
SMTP_USER=futurescreen@list.ru
SMTP_PASS=lEhFPgfbasP9MeqBpW2a
SMTP_TO=futurescreen@list.ru
```

**Важно:** Эти значения нужно добавить в Vercel Dashboard!
