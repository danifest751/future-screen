# План работ по проекту Future Screen

**Дата:** 19 февраля 2026 г.  
**Проект:** future-screen.ru

---

## Этап 1: Критические исправления (1-2 дня)

### 1.1 Исправление тестов 🔴 ✅ ВЫПОЛНЕНО
**Задача:** Vitest не запускает тесты  
**Файлы:** `vite.config.ts`, `src/utils/screenMath.test.ts`

**Сделано:**
- Добавлен конфиг test в vite.config.ts
- Установлен jsdom
- Убраны явные импорты из тестов (globals: true)
- Запущены тесты: **26 тестов пройдено**

**Чек-лист:**
- [x] Добавить конфиг test в vite.config.ts
- [x] Установить jsdom
- [x] Запустить `npm run test`
- [x] Все 26 тестов прошли

---

### 1.2 Подключение аналитики 🔴
**Задача:** Яндекс.Метрика не подключена  
**Файлы:** `src/lib/analytics.ts`, `index.html`

**Шаги:**
1. Создать счётчик в Яндекс.Метрике
2. Добавить код счётчика в `index.html`
3. Обновить `analytics.ts` для отправки событий

```ts
// src/lib/analytics.ts
declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: any[]) => void;
  }
}

export const trackEvent = (name: string, payload?: Record<string, any>) => {
  if (window.ym) {
    window.ym(XXXXXX, 'reachGoal', name, payload);
  }
  console.info('[analytics]', name, payload);
};
```

**Чек-лист:**
- [ ] Создать счётчик
- [ ] Вставить код в index.html
- [ ] Обновить analytics.ts
- [ ] Протестировать события

---

### 1.3 Исправление аутентификации 🔴
**Задача:** Пароль хранится на клиенте — уязвимость  
**Файлы:** `AuthContext.tsx`, `server/index.js`

**Решение (временное):** Перенести проверку на сервер

```js
// server/index.js
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const valid = username === process.env.ADMIN_LOGIN && 
                password === process.env.ADMIN_PASSWORD;
  
  if (valid) {
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

**Чек-лист:**
- [ ] Добавить endpoint /api/admin/login
- [ ] Установить jsonwebtoken
- [ ] Обновить AuthContext.tsx
- [ ] Протестировать вход/выход

---

### 1.4 Настройка CORS 🔴
**Задача:** Разрешены все origin'ы  
**Файл:** `server/index.js`

```js
// Было
app.use(cors({ origin: true }));

// Стало
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://future-screen.ru', 'https://www.future-screen.ru']
    : ['http://localhost:5173', 'http://localhost:5174']
}));
```

**Чек-лист:**
- [ ] Обновить CORS конфиг
- [ ] Добавить переменные в .env

---

## Этап 2: Безопасность (1-2 дня)

### 2.1 Rate limiting 🟡
**Файл:** `server/index.js`

```bash
npm install express-rate-limit
```

```js
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // 10 запросов
  message: { error: 'Too many requests, please try again later' }
});

app.use('/api/', apiLimiter);
```

**Чек-лист:**
- [ ] Установить пакет
- [ ] Настроить лимитер
- [ ] Протестировать

---

### 2.2 HTTPS для продакшена 🟡
**Задача:** Настроить HTTPS на сервере

**Варианты:**
1. Nginx + Let's Encrypt (рекомендуется)
2. Cloudflare Tunnel

**Чек-лист:**
- [ ] Выбрать хостинг
- [ ] Настроить SSL
- [ ] Проверить редирект HTTP → HTTPS

---

### 2.3 Валидация входных данных 🟡
**Файл:** `server/index.js`

```js
import { z } from 'zod';

const emailSchema = z.object({
  source: z.string().max(100),
  name: z.string().min(1).max(100),
  phone: z.string().min(5).max(20),
  city: z.string().max(100).optional(),
  date: z.string().max(50).optional(),
  format: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
});

app.post('/api/send', async (req, res) => {
  const result = emailSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error });
  }
  // ...
});
```

**Чек-лист:**
- [ ] Установить zod
- [ ] Добавить схемы валидации
- [ ] Обработать ошибки

---

## Этап 3: SEO и производительность (2-3 дня)

### 3.1 Sitemap.xml 🟢
**Файл:** `public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://future-screen.ru/</loc><lastmod>2026-02-19</lastmod><priority>1.0</priority></url>
  <url><loc>https://future-screen.ru/led</loc><lastmod>2026-02-19</lastmod><priority>0.9</priority></url>
  <url><loc>https://future-screen.ru/support</loc><lastmod>2026-02-19</lastmod><priority>0.9</priority></url>
  <url><loc>https://future-screen.ru/rent</loc><lastmod>2026-02-19</lastmod><priority>0.8</priority></url>
  <url><loc>https://future-screen.ru/cases</loc><lastmod>2026-02-19</lastmod><priority>0.8</priority></url>
  <url><loc>https://future-screen.ru/prices</loc><lastmod>2026-02-19</lastmod><priority>0.7</priority></url>
  <url><loc>https://future-screen.ru/about</loc><lastmod>2026-02-19</lastmod><priority>0.7</priority></url>
  <url><loc>https://future-screen.ru/contacts</loc><lastmod>2026-02-19</lastmod><priority>0.7</priority></url>
  <url><loc>https://future-screen.ru/calculator</loc><lastmod>2026-02-19</lastmod><priority>0.8</priority></url>
</urlset>
```

**Чек-лист:**
- [ ] Создать sitemap.xml
- [ ] Добавить в public/

---

### 3.2 Robots.txt 🟢
**Файл:** `public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://future-screen.ru/sitemap.xml
```

**Чек-лист:**
- [ ] Создать robots.txt
- [ ] Добавить в public/

---

### 3.3 Structured Data (JSON-LD) 🟢
**Файл:** `src/components/StructuredData.tsx`

```tsx
import { Helmet } from 'react-helmet-async';

export const StructuredData = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Future Screen",
        "url": "https://future-screen.ru",
        "telephone": "+79122466566",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Большой Конный полуостров, 5а",
          "addressLocality": "Екатеринбург",
          "addressCountry": "RU"
        },
        "sameAs": [
          "https://vk.com/futurescreen",
          "https://t.me/futurescreen"
        ]
      })}
    </script>
  </Helmet>
);
```

**Чек-лист:**
- [ ] Создать компонент
- [ ] Добавить в App.tsx

---

### 3.4 Оптимизация бандла 🟡
**Проблема:** RequestForm.js = 81.78 kB

**Решения:**
1. Lazy load для тяжёлых форм
2. Tree shaking зависимостей

```tsx
// src/pages/CalculatorPage.tsx
const LeadForm = lazy(() => import('../components/calculator/LeadForm/LeadForm'));
```

**Чек-лист:**
- [ ] Проанализировать бандл (npm run build -- --analyze)
- [ ] Добавить lazy loading
- [ ] Проверить размер

---

### 3.5 Lighthouse аудит 🟢
**Цели:**
- Performance: ≥90
- SEO: ≥90
- Accessibility: ≥90
- Best Practices: ≥90

**Чек-лист:**
- [ ] Запустить Lighthouse в Chrome DevTools
- [ ] Исправить замечания
- [ ] Достичь целей

---

## Этап 4: Улучшения UX/UI (2-3 дня)

### 4.1 Исправление ESLint warning'ов 🟢
**Файлы:**
- `src/components/Header.tsx` — location не используется
- `src/components/calculator/LeadForm/LeadForm.tsx` — payload не используется
- `src/utils/screenMath.ts` — peakMin не используется

**Чек-лист:**
- [ ] Исправить все 5 warning'ов
- [ ] Запустить `npm run lint`

---

### 4.2 Обработка ошибок форм 🟡
**Файл:** `src/components/calculator/LeadForm/LeadForm.tsx`

```tsx
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError(null);
  
  try {
    const result = await submitForm({...});
    if (!result.tg && !result.email) {
      setError('Ошибка отправки. Попробуйте позже.');
    } else {
      setSent(true);
    }
  } catch {
    setError('Ошибка соединения с сервером.');
  }
};
```

**Чек-лист:**
- [ ] Добавить обработку ошибок
- [ ] Показать сообщение пользователю

---

### 4.3 README.md 🟢
**Файл:** `README.md`

```markdown
# Future Screen

Сайт компании Future Screen — техсопровождение мероприятий.

## Быстрый старт

```bash
npm install
npm run dev
```

## Команды

- `npm run dev` — запуск dev-сервера
- `npm run build` — сборка
- `npm run test` — тесты
- `npm run lint` — линтинг

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения.
```

**Чек-лист:**
- [ ] Создать README.md
- [ ] Описать команды
- [ ] Добавить переменные окружения

---

## Этап 5: Контент (по желанию)

### 5.1 Добавление кейсов 🟢
**Файл:** `src/data/cases.ts`

**Чек-лист:**
- [ ] Добавить 5-10 реальных кейсов
- [ ] Добавить изображения
- [ ] Указать метрики (гости, площадь, дни)

---

### 5.2 Изображения 🟢
**Задача:** Оптимизировать изображения

**Чек-лист:**
- [ ] Конвертировать в WebP/AVIF
- [ ] Сжать без потерь
- [ ] Добавить lazy loading

---

## Этап 6: Деплой (1-2 дня)

### 6.1 Хостинг фронтенда 🟢
**Варианты:**
- Cloudflare Pages (бесплатно, быстро)
- Netlify
- Vercel

**Чек-лист:**
- [ ] Выбрать хостинг
- [ ] Настроить CI/CD
- [ ] Подключить домен

---

### 6.2 Хостинг сервера 🟡
**Варианты:**
- VPS (Timeweb, Selectel)
- Docker + любой хостинг

**Чек-лист:**
- [ ] Арендовать VPS
- [ ] Настроить Node.js
- [ ] Настроить PM2
- [ ] Настроить Nginx

---

### 6.3 Мониторинг 🟢
**Инструменты:**
- Sentry — ошибки
- UptimeRobot — мониторинг доступности

**Чек-лист:**
- [ ] Создать проект в Sentry
- [ ] Добавить SDK
- [ ] Настроить алерты

---

## Сводный план по приоритетам

| Приоритет | Задача | Время | Статус |
|-----------|--------|-------|--------|
| 🔴 | Исправить тесты | 1 час | Ожидает |
| 🔴 | Подключить Метрику | 2 часа | Ожидает |
| 🔴 | Исправить CORS | 30 мин | Ожидает |
| 🟡 | Rate limiting | 1 час | Ожидает |
| 🟡 | Валидация данных | 2 часа | Ожидает |
| 🟢 | Sitemap/Robots | 1 час | Ожидает |
| 🟢 | Structured Data | 1 час | Ожидает |
| 🟢 | Исправить ESLint | 30 мин | Ожидает |
| 🟢 | README | 1 час | Ожидает |

**Итого:** ~10 часов работы

---

## Следующие шаги

1. **Сейчас:** Исправить тесты (vite.config.ts)
2. **Сегодня:** Подключить Яндекс.Метрику
3. **Завтра:** Исправить CORS + Rate limiting
4. **Послезавтра:** SEO (sitemap, robots, structured data)
