# 20. TanStack Query: queries и cache

## Сценарий с работы

После [19-lab-fetch-items.md](19-lab-fetch-items.md) в shop три экрана запрашивают `/api/v1/items`: sidebar, главная, модалка. Каждый — свой `useEffect`, **три одинаковых** запроса при mount. Пользователь уходит и возвращается — снова loading. Tech lead: «Нужен клиентский кэш и dedupe». **TanStack Query** (React Query v5) — стандарт для server state в React: `useQuery`, ключи, stale time, фоновый refetch.

В [`examples/package.json`](examples/package.json) уже есть `@tanstack/react-query` ^5.

## Что вы узнаете

- `QueryClient`, `QueryClientProvider`
- `useQuery`, `queryKey`, `queryFn`
- `staleTime`, `gcTime` (cacheTime)
- `isPending` vs `isLoading` vs `isFetching`
- Миграция `ItemsList` с ручного fetch

---

## Server state vs client state

| | Client state | Server state |
|---|--------------|--------------|
| Примеры | theme, modal open | items from `:8090` |
| Источник истины | React | **API** |
| Инструмент | `useState`, Context | **Query** |

Не кладите весь каталог в Context «навсегда» — Query синхронизирует с backend.

---

## Провайдер

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
```

`staleTime: 30_000` — 30 сек данные **fresh**, повторный mount не refetch без причины.

---

## `useQuery` basics

```tsx
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Item } from "@/api/types";

function ItemsList() {
  const { data, error, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["items"],
    queryFn: ({ signal }) => api<Item[]>("/api/v1/items", { signal }),
  });

  if (isPending) {
    return <p aria-busy="true">Загрузка каталога…</p>;
  }

  if (isError) {
    return (
      <div role="alert">
        <p>{error.message}</p>
        <button type="button" onClick={() => refetch()}>
          Повторить
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return <p>Каталог пуст.</p>;
  }

  return (
    <>
      {isFetching ? <small>Обновление…</small> : null}
      <ul>
        {data.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </>
  );
}
```

`queryFn` получает `{ signal }` — Query прокидывает abort ([17-fetch-react.md](17-fetch-react.md)).

---

## `queryKey` — идентификатор кэша

Ключ — **массив**, сериализуемый:

```tsx
["items"]                           // весь каталог
["items", { category: "peripherals" }]  // фильтр
["items", itemId]                   // один товар
```

Два компонента с **одним** ключом → **один** запрос (dedupe). Разные ключи — разные записи кэша.

```tsx
useQuery({
  queryKey: ["items", { q, page }],
  queryFn: () => api<Item[]>(`/api/v1/items?${params}`),
});
```

Правило: всё, что влияет на ответ API, должно быть в `queryKey` ([26-url-state.md](26-url-state.md)).

---

## `staleTime` и `gcTime`

| Опция | Смысл |
|-------|--------|
| `staleTime` | сколько ms данные считаются **свежими** (нет auto-refetch on mount) |
| `gcTime` | сколько ms неиспользуемый кэш живёт в памяти после unmount (default 5 min) |

```tsx
useQuery({
  queryKey: ["items"],
  queryFn: fetchItems,
  staleTime: 60_000,
});
```

Для редко меняющегося каталога shop — 30–60 s. Для realtime — 0 + polling/WebSocket (react-intermediate).

---

## `isPending` vs `isLoading` vs `isFetching`

В **v5**:

| Флаг | Когда true |
|------|------------|
| `isPending` | нет данных в кэше, первый fetch |
| `isLoading` | `isPending && isFetching` (устаревший термин, всё ещё есть) |
| `isFetching` | любой fetch в flight (в т.ч. background refetch) |

UI skeleton при **первом** заходе: `isPending`. Тонкий индикатор при refetch: `isFetching && !isPending`.

```tsx
if (isPending) return <Skeleton />;
// ...
{isFetching && !isPending && <span aria-live="polite">Обновляем…</span>}
```

На собеседовании не путайте v4 (`isLoading` = no data) и v5 (`isPending`).

---

## DevTools (опционально)

```bash
npm i -D @tanstack/react-query-devtools
```

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Видны ключи, stale/fresh, observers — незаменимо при отладке shop.

---

## Query для одного товара

```tsx
function ItemDetail({ id }: { id: number }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["items", id],
    queryFn: ({ signal }) => api<Item>(`/api/v1/items/${id}`, { signal }),
    enabled: Number.isFinite(id),
  });
  // ...
}
```

`enabled: false` — не fetch пока нет валидного id (route params).

---

## Связь с FastAPI :8090

Тот же `api()` и `/api/v1/items` через Vite proxy. Query не меняет контракт — только **кэш и lifecycle**. OpenAPI: `:8090/docs`.

Мутации и invalidation — [21-mutations.md](21-mutations.md). Лаба CRUD — [22-lab-query.md](22-lab-query.md).

---

## Миграция с useEffect

```text
useState loading/error/data  →  useQuery flags + data
useEffect + abort            →  queryFn + signal
retry state                  →  refetch() / retry option
ручной cache                 →  queryKey + staleTime
```

Удалите дублирующий effect после успешной миграции — не оставляйте оба.

---

## Типичные ошибки

1. **Забыли Provider** — «No QueryClient set».

2. **Неполный queryKey** — фильтр в URL, но ключ `['items']` → неверный кэш.

3. **queryFn без throw** — HTTP ошибки должны reject (ваш `api()` throws).

4. **Весь catalog в useState после query** — дублирование server state.

5. **staleTime 0 везде** — лишние запросы к `:8090`.

6. **Путают isPending и isFetching** — мигает весь skeleton при refetch.

---

## Резюме

TanStack Query хранит **server state** shop API: `useQuery` + `queryKey` + `queryFn`. Dedupe и кэш между компонентами. `staleTime` контролирует «свежесть»; `gcTime` — время жизни в памяти. v5: первый load — `isPending`; фоновое обновление — `isFetching`. Подключите `QueryClientProvider` в `main.tsx` и мигрируйте ItemsList с [19-lab-fetch-items.md](19-lab-fetch-items.md).

---

## Чек-лист

- Зачем `queryKey` массив, а не строка?
- Что произойдёт с двумя `useQuery(['items'])` при mount?
- Чем `staleTime` отличается от `gcTime`?
- Когда показывать skeleton: `isPending` или `isFetching`?
- Как Query отменяет запрос при unmount?
- Где в проекте mock-exams уже установлен пакет?

Следующий урок: [21. Mutations и optimistic UI](21-mutations.md).
