# 24. TanStack Query в Next.js (client islands)

## Введение: сценарий с работы

Каталог на SSR ([15-lab-server-fetch.md](15-lab-server-fetch.md)) — отлично для SEO. Но sidebar «Недавно просмотренные» обновляется каждые 30 сек, фильтр цены — без full page reload, кнопка «Обновить» не должна блокировать всю страницу. Переписать всё в Client Component с `useEffect` — шаг назад. Tech lead: «Server shell + **client island** с TanStack Query».

TanStack Query ([react-basic/20-tanstack-query.md](../react-basic/20-tanstack-query.md)) в Next.js живёт **только в Client Components**. Провайдер — в client wrapper layout. SSR prefetch + dehydrate — advanced (react-intermediate); здесь — **гибрид**: server HTML для первого экрана, Query для интерактива.

## Что вы узнаете

- Почему Query — client-only
- `QueryClientProvider` в client layout wrapper
- `useQuery` к BFF `/api/proxy/items`
- `staleTime`, refetch, dedupe
- Server state vs client state (корзина — глава 25)
- Prefetch overview (без полного SSR dehydrate)
- Антипаттерн «Query на всём сайте»

---

## Архитектура гибрида

```text
app/catalog/page.tsx          Server Component — initial SSR list
components/catalog/
  CatalogRefreshPanel.tsx     "use client" + useQuery — live refresh
components/providers/
  QueryProvider.tsx           QueryClientProvider
app/layout.tsx                Server — wraps children with QueryProvider
```

| Данные | Механизм |
|--------|----------|
| Первый paint каталога | RSC `getItems()` |
| Кнопка «Обновить» | `refetch()` |
| Polling sidebar | `refetchInterval` |
| Корзина | useState/Context (25) |

---

## QueryClientProvider wrapper

```tsx
// components/providers/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

type Props = { children: ReactNode };

export function QueryProvider({ children }: Props) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
```

```tsx
// app/layout.tsx — Server Component
import { QueryProvider } from "@/components/providers/QueryProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <QueryProvider>
          <header>...</header>
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
```

**Один** `QueryClient` на app через `useState(() => new ...)` — не создавайте client на каждый render.

---

## API client к BFF

```tsx
// lib/api/client.ts
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";
  const res = await fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text.slice(0, 120)}`);
  }

  return res.json() as Promise<T>;
}
```

Browser fetch → same-origin BFF ([20-lab-route-handlers.md](20-lab-route-handlers.md)), не `:8090` напрямую.

---

## `useQuery` в island

```tsx
// components/catalog/CatalogRefreshPanel.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ItemsResponse } from "@/lib/api/types";

export function CatalogRefreshPanel() {
  const { data, isFetching, isError, error, refetch, dataUpdatedAt } =
    useQuery({
      queryKey: ["items"],
      queryFn: ({ signal }) =>
        api<ItemsResponse>("/items", { signal }),
    });

  return (
    <aside className="card">
      <h2>Live-каталог (client)</h2>
      {isError ? (
        <p role="alert">{(error as Error).message}</p>
      ) : (
        <p className="muted">
          Товаров: {data?.total ?? "…"}
          {isFetching ? " (обновление…)" : null}
        </p>
      )}
      <button type="button" onClick={() => refetch()}>
        Обновить
      </button>
      <small className="muted">
        Обновлено: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"}
      </small>
    </aside>
  );
}
```

```tsx
// app/catalog/page.tsx — добавьте island рядом с SSR list
import { CatalogRefreshPanel } from "@/components/catalog/CatalogRefreshPanel";

export default async function CatalogPage() {
  const items = await getItems();
  return (
    <section>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1rem" }}>
        <div>{/* SSR list */}</div>
        <CatalogRefreshPanel />
      </div>
    </section>
  );
}
```

Два источника данных **намеренно** для обучения; в prod — либо SSR+hydrate prefetch, либо один источник.

---

## Query keys

```tsx
queryKey: ["items"]
queryKey: ["items", { sale: true }]
queryKey: ["item", id]
```

Ключ = identity в кэше. Фильтры — часть key, иначе stale wrong data.

---

## Mutations (overview)

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

const qc = useQueryClient();
const mutation = useMutation({
  mutationFn: (id: number) => api(`/items/${id}`, { method: "DELETE" }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
});
```

Для форм без JS — Server Actions ([21-server-actions.md](21-server-actions.md)); Query mutations — client UX.

---

## SSR prefetch (overview)

Advanced pattern (react-intermediate):

1. Server: `QueryClient` + `prefetchQuery` + `dehydrate`.
2. Pass `HydrationBoundary state={dehydrate(qc)}` to client.
3. Client `useQuery` — instant cache, no loading flash.

В nextjs-basic достаточно понимать **зачем** — убрать double fetch и loading flash.

---

## DevTools (optional)

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// inside QueryProvider, dev only
{process.env.NODE_ENV === "development" ? (
  <ReactQueryDevtools initialIsOpen={false} />
) : null}
```

Пакет devtools — optional dependency.

---

## Типичные ошибки

1. **`useQuery` в Server Component** — build error.

2. **QueryClient вне `useState`** — cache reset каждый render.

3. **Fetch `:8090` из browser** — CORS; используйте BFF.

4. **Один Query на весь layout** — раздувает client bundle; islands.

5. **Игнорировать `staleTime`** — refetch storm при каждом focus.

6. **Дублировать server cache и Query** без стратегии — confusing UX.

7. **Забыть `signal` в queryFn** — лишние запросы после unmount.

8. **Server Actions + Query invalidate** — после action вызовите `queryClient.invalidateQueries`.

---

## Чек-лист

- Почему QueryProvider — `"use client"`?
- Откуда browser fetch берёт URL API?
- Чем server `getItems()` отличается от `useQuery`?
- Зачем `queryKey`?
- Что делает `staleTime: 30_000`?
- Когда mutation vs Server Action?
- Что такое dehydrate/hydrate (overview)?

Следующий урок: [25. Лаба: корзина и client state](25-lab-client-state.md).
