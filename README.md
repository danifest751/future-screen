# Future Screen

Сайт компании Future Screen — техсопровождение мероприятий: LED-экраны, звук, свет, сцены.

**URL:** https://future-screen.vercel.app

---

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск разработки

```bash
# Фронтенд (Vite)
npm run dev

# Фронтенд + сервер (локально)
npm run dev:all
```

### Сборка

```bash
npm run build
```

---

## 📦 Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск Vite dev-сервера (порт 5173) |
| `npm run build` | Сборка продакшен-версии |
| `npm run preview` | Предпросмотр билда |
| `npm run test` | Запуск тестов (Vitest) |
| `npm run lint` | ESLint проверка |
| `npm run server` | Запуск Express сервера (порт 3001) |
| `npm run dev:all` | Фронтенд + сервер одновременно |

---

## 🛠 Технологический стек

### Frontend
- **React 18** + **TypeScript**
- **Vite** — сборщик
- **React Router** — роутинг
- **TailwindCSS** — стили
- **React Hook Form** + **Zod** — формы и валидация
- **React Helmet Async** — SEO meta-теги

### Backend (Serverless)
- **Vercel Functions** — API
- **Nodemailer** — отправка email
- **Telegram Bot API** — уведомления

### Тесты
- **Vitest** — 26 тестов для калькулятора LED

---

## 📁 Структура проекта

```
future-screen/
├── api/                    # Vercel Serverless Functions
│   └── send.ts            # API для отправки форм
├── public/                 # Статические файлы
│   ├── sitemap.xml        # SEO sitemap
│   ├── robots.txt         # SEO robots
│   └── favicon.svg
├── src/
│   ├── components/        # React компоненты
│   │   ├── calculator/    # Калькулятор LED
│   │   ├── Layout.tsx     # Обёрка страниц
│   │   ├── Header.tsx     # Шапка
│   │   └── ...
│   ├── context/           # React Context
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── data/              # Данные (кейсы, категории, конфиги)
│   ├── hooks/             # Кастомные хуки
│   ├── lib/               # Утилиты (analytics, forms)
│   ├── pages/             # Страницы
│   │   ├── HomePage.tsx
│   │   ├── LedPage.tsx
│   │   ├── CalculatorPage.tsx
│   │   └── admin/         # Админ-панель
│   ├── themes/            # Темы оформления
│   ├── utils/             # Утилиты
│   │   └── screenMath.ts  # Математика калькулятора
│   ├── App.tsx            # Роутинг
│   └── main.tsx           # Точка входа
├── .env.example           # Пример переменных окружения
├── vercel.json            # Конфиг Vercel
├── vite.config.ts         # Конфиг Vite
└── package.json
```

---

## 🔐 Переменные окружения

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Заполните значения (см. `.env.example`).

### Для Vercel

Добавьте переменные в **Settings → Environment Variables**:

- `VITE_ADMIN_LOGIN` — логин админки
- `VITE_ADMIN_PASSWORD` — пароль админки
- `VITE_TG_BOT_TOKEN` — токен Telegram бота
- `VITE_TG_CHAT_ID` — Chat ID для уведомлений
- `SMTP_USER` — email для отправки
- `SMTP_PASS` — пароль SMTP
- `SMTP_TO` — email получателя

Подробная инструкция: [VERCEL_ENV.md](VERCEL_ENV.md)

---

## 📊 Калькулятор LED

7-шаговый калькулятор для подбора LED-экранов:

1. Тип мероприятия
2. Локация (indoor/outdoor)
3. Количество зрителей
4. Дистанция просмотра
5. Назначение экрана
6. Ограничения площадки
7. Результат с расчётами

**Математика:** `src/utils/screenMath.ts`  
**Тесты:** `src/utils/screenMath.test.ts` (26 тестов)

---

## 🎨 Темы оформления

- **Default** — тёмная тема
- **Light** — светлая тема
- **Neon** — неоновая тема

Переключатель в хедере.

---

## 📱 Страницы

| Путь | Описание |
|------|----------|
| `/` | Главная |
| `/led` | LED-экраны |
| `/support` | Техсопровождение |
| `/rent` | Аренда оборудования |
| `/rent/:category` | Категория аренды |
| `/cases` | Кейсы |
| `/cases/:slug` | Детали кейса |
| `/prices` | Цены/пакеты |
| `/about` | О компании |
| `/contacts` | Контакты |
| `/calculator` | Калькулятор LED |
| `/admin/content` | Админ-панель (требует авторизации) |

---

## 🧪 Тесты

```bash
npm run test
```

Покрытие: утилиты калькулятора (`screenMath.ts`)

---

## 🚀 Деплой

Проект автоматически деплоится на Vercel при push в ветку `main`.

**Production URL:** https://future-screen.vercel.app

### Ручной деплой

```bash
vercel --prod
```

---

## 📈 Аналитика

- **Яндекс.Метрика** — счётчик №85439743
- События: `click_phone`, `click_whatsapp`, `submit_form`, `submit_quiz`, `view_case`

---

## 🔒 Безопасность

### Админ-панель

- Пароль хранится в `.env`
- Сессия в `sessionStorage`
- Маршрут защищён через `ProtectedRoute`

### Формы

- Honeypot для защиты от спама
- Валидация на клиенте (Zod)
- Rate limiting на сервере (рекомендуется)

---

## 📝 Changelog

### v0.0.1 (2026-02-19)
- Initial release
- LED calculator
- Admin panel
- Forms with Telegram/Email
- Multi-theme support
- SEO (sitemap, robots, structured data)
- Yandex.Metrika

---

## 📞 Контакты

- **Телефон:** +7 (912) 246-65-66
- **Email:** gr@future-screen.ru
- **Адрес:** Екатеринбург, Большой Конный полуостров, 5а

---

## 📄 Лицензия

© 2007–2026 Future Screen. Все права защищены.
