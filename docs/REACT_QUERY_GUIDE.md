# Руководство по React Query для Future Screen

## Обзор

React Query (@tanstack/react-query) — библиотека для управления серверным состоянием. Рекомендуется для замены ручного fetch/axios в компонентах.

## Преимущества

- **Автоматическое кэширование** — повторные запросы к тому же endpoint не дублируются
- **Фоновое обновление** — stale-while-revalidate паттерн из коробки
- **Управление состоянием загрузки** — isLoading, isFetching без useState
- **Оптимистичные обновления** — мгновенный UI перед подтверждением сервера
- **Ретраи и дедупликация** — автоматическая обработка ошибок

## Установка

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

## Базовая настройка

```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);
```

## Примеры использования

### 1. Замена useEffect + fetch

**Было (ручной fetch):**
```tsx
function CasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/cases')
      .then(r => r.json())
      .then(setCases)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Error />;
  return <CasesList cases={cases} />;
}
```

**Стало (React Query):**
```tsx
import { useQuery } from '@tanstack/react-query';

function CasesPage() {
  const { data: cases, isLoading, error } = useQuery({
    queryKey: ['cases'],
    queryFn: () => fetch('/api/cases').then(r => r.json()),
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error />;
  return <CasesList cases={cases} />;
}
```

### 2. Мутации (create/update/delete)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateCaseForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newCase) =>
      fetch('/api/cases', {
        method: 'POST',
        body: JSON.stringify(newCase),
      }).then(r => r.json()),
    onSuccess: () => {
      // Инвалидируем кэш cases
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });

  const handleSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" />
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
      </button>
      {mutation.isError && <div>Ошибка: {mutation.error.message}</div>}
    </form>
  );
}
```

### 3. Зависимые запросы

```tsx
// Сначала загружаем категории, потом кейсы по категории
function CategoryCases({ categoryId }) {
  const { data: category } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => fetch(`/api/categories/${categoryId}`).then(r => r.json()),
    enabled: !!categoryId, // Запрос только если есть ID
  });

  const { data: cases } = useQuery({
    queryKey: ['cases', categoryId],
    queryFn: () => fetch(`/api/cases?category=${categoryId}`).then(r => r.json()),
    enabled: !!category, // Ждём загрузки категории
  });

  // ...
}
```

### 4. Бесконечный скролл

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';

function CasesList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['cases'],
    queryFn: ({ pageParam = 1 }) =>
      fetch(`/api/cases?page=${pageParam}`).then(r => r.json()),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });

  const cases = data?.pages.flatMap(page => page.items) ?? [];

  return (
    <>
      {cases.map(case => <CaseCard key={case.id} {...case} />)}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Загрузка...' : 'Загрузить ещё'}
      </button>
    </>
  );
}
```

## Интеграция с Supabase

```tsx
// src/lib/queries.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from './supabase';

// Хук для загрузки кейсов
export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Хук для создания кейса
export function useCreateCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newCase) => {
      const { data, error } = await supabase
        .from('cases')
        .insert(newCase)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}
```

## Рекомендуемая структура

```
src/
├── queries/
│   ├── keys.ts          # Константы query keys
│   ├── cases.ts         # Queries для cases
│   ├── categories.ts    # Queries для categories
│   └── index.ts         # Реэкспорт
├── hooks/
│   └── useCases.ts      # Обертки под конкретные компоненты
```

## Когда использовать React Query

✅ **Использовать для:**
- Любых запросов к API
- Форм с созданием/обновлением данных
- Бесконечного скролла
- Оптимистичных обновлений
- Синхронизации между вкладками

❌ **Не использовать для:**
- Локального UI-состояния (useState)
- Форм без отправки на сервер
- Анимаций
- Глобального состояния темы/настроек

## Миграция существующего кода

1. Установить пакеты
2. Обернуть App в QueryClientProvider
3. Найти все useEffect + fetch
4. Заменить на useQuery
5. Найти все POST/PUT/DELETE
6. Заменить на useMutation
7. Добавить invalidateQueries после мутаций

## Полезные ссылки

- [Официальная документация](https://tanstack.com/query/latest)
- [React Query Tutorial](https://tanstack.com/query/latest/docs/react/quick-start)
- [Best Practices](https://tanstack.com/query/latest/docs/react/guides/important-defaults)
