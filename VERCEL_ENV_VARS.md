# Переменные окружения для Vercel

## Как добавить:

1. Зайди на https://vercel.com
2. Выбери проект `future-screen`
3. Перейди в **Settings** → **Environment Variables**
4. Нажми **Add New**
5. Добавь все переменные ниже
6. Для каждой выбери **Production**, **Preview**, **Development** (все три галочки)
7. Нажми **Save**
8. После добавления всех — сделай **Redeploy** последнего деплоя

---

## Обязательные переменные:

### Админка
```
VITE_ADMIN_LOGIN = admin
VITE_ADMIN_PASSWORD = fs2024
```

### Telegram (для уведомлений о заявках)
```
VITE_TG_BOT_TOKEN = 
VITE_TG_CHAT_ID = 
```
*Заполни если нужны уведомления в Telegram*

### SMTP (для отправки email)
```
SMTP_USER = futurescreen@list.ru
SMTP_PASS = lEhFPgfbasP9MeqBpW2a
SMTP_TO = futurescreen@list.ru
```

### Supabase (база данных)
```
VITE_SUPABASE_URL = https://pyframwlnqrzeynqcvle.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZnJhbXdsbnFyemV5bnFjdmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjE4OTAsImV4cCI6MjA4NzEzNzg5MH0.fFyJyGKmZ4N1My3qsUGLjJJiOLstdcsJUU_rv5cZr3I
```

---

## Итого (список для копирования):

| Name | Value |
|------|-------|
| `VITE_ADMIN_LOGIN` | `admin` |
| `VITE_ADMIN_PASSWORD` | `fs2024` |
| `VITE_TG_BOT_TOKEN` | *(оставь пустым если не нужно)* |
| `VITE_TG_CHAT_ID` | *(оставь пустым если не нужно)* |
| `SMTP_USER` | `futurescreen@list.ru` |
| `SMTP_PASS` | `lEhFPgfbasP9MeqBpW2a` |
| `SMTP_TO` | `futurescreen@list.ru` |
| `VITE_SUPABASE_URL` | `https://pyframwlnqrzeynqcvle.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZnJhbXdsbnFyemV5bnFjdmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjE4OTAsImV4cCI6MjA4NzEzNzg5MH0.fFyJyGKmZ4N1My3qsUGLjJJiOLstdcsJUU_rv5cZr3I` |

---

## После добавления:

1. Перейди в **Deployments**
2. Найди последний деплой
3. Нажми **⋮** (три точки) → **Redeploy**
4. Дождись завершения деплоя
5. Проверь что сайт работает

---

## Проверка:

1. Открой сайт на Vercel
2. Открой консоль браузера (F12)
3. Введи: `console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)`
4. Должно показать URL базы данных
