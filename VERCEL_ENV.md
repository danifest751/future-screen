# Настройка Environment Variables в Vercel

## Инструкция

1. Зайди на https://vercel.com
2. Выбери проект `future-screen`
3. Перейди в **Settings** → **Environment Variables**
4. Добавь следующие переменные:

### Переменные для всех окружений (Production, Preview, Development)

| Name | Value |
|------|-------|
| `VITE_ADMIN_LOGIN` | `admin` |
| `VITE_ADMIN_PASSWORD` | `fs2024` (или свой пароль) |
| `TG_BOT_TOKEN` | Токен бота от @BotFather |
| `TG_CHAT_ID` | Chat ID для уведомлений |
| `SMTP_USER` | futurescreen@list.ru |
| `SMTP_PASS` | Пароль от почты (или app password) |
| `SMTP_TO` | futurescreen@list.ru |

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

### SMTP Password (Mail.ru)
1. Зайди в настройки почты на mail.ru
2. Безопасность → Пароли для внешних приложений
3. Создать новый пароль
4. Скопируй пароль (используй его в SMTP_PASS)

## После добавления

1. Нажми **Save**
2. Перейди в **Deployments**
3. Нажми **Redeploy** на последнем деплое (или сделай новый push)

## Проверка

После деплоя:
1. Открой сайт на Vercel
2. Заполни форму заявки
3. Проверь Telegram и Email на получение уведомлений
