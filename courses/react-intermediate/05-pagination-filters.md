# 05. Пагинация, фильтры, DRF контракт

## Сценарий с работы

Products table в admin. PM: «Нужны фильтр по category, поиск по SKU, сортировка по цене, 25 строк на странице». Backend отдал Swagger DRF: `GET /api/v1/products/?page=2&page_size=25&search=KB&category=peripherals&ordering=-price`. Junior синхронизирует page в `useState`, забывает положить `page` в `queryKey` — при возврате на страницу 1 показываются данные страницы 2. Tech lead: «URL — источник истины для таблицы» ([26-url-state.md](../react-basic/26-url-state.md)).

Урок связывает Django pagination contract, React UI и TanStack Query keys.

## Что вы узнаете

- Формат **DRF paginated response**.
- Query params: `page`, `page_size`, `search`, `ordering`.
- Синхронизация фильтров с **URLSearchParams**.
- `queryKey` включает все params.
- UI: pagination controls, empty state.

---

## DRF paginated response

```json
{
  "count": 142,
  "next": "http://localhost:8092/api/v1/products/?page=3",
  "previous": "http://localhost:8092/api/v1/products/?page=1",
  "results": [
    {
      "id": 1,
      "sku": "KB-001",
      "title": "Mechanical Keyboard",
      "price": "129.99",
      "is_active": true,
      "category": { "slug": "peripherals", "name": "Peripherals" }
    }
  ]
}
```

| Поле | Смысл |
|------|--------|
| `count` | всего записей (для «Страница 2 из 6») |
| `next` / `previous` | URL или `null` |
| `results` | массив на **текущей** странице |

TypeScript — [04-api-client.md](04-api-client.md):

```typescript
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
```

**Не** ожидайте голый массив как FastAPI items в react-basic.

---

## Query parameters (типичный DRF)

| Param | Пример | Эффект |
|-------|--------|--------|
| `page` | `2` | номер страницы (1-based) |
| `page_size` | `25` | размер (если backend разрешает) |
| `search` | `keyboard` | full-text / icontains |
| `category` | `peripherals` | filter по slug |
| `ordering` | `-price` | sort: `-` desc |
| `is_active` | `true` | boolean filter |

Точный набор — OpenAPI/schema Django [`deploy/django`](../../deploy/django/README.md). MSW mock — [`handlers.ts`](examples/src/mocks/handlers.ts) (page 1 only; расширите в лабе).

---

## URL как источник истины

```text
/products?page=2&search=KB&category=peripherals&ordering=-price
```

Пользователь копирует URL — коллега видит тот же фильтр. Refresh браузера — state восстанавливается.

```tsx
// features/products/hooks/useProductFilters.ts
import { useSearchParams } from "react-router-dom";
import { useMemo, useCallback } from "react";

const DEFAULT_PAGE_SIZE = 25;

export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const p = new URLSearchParams(searchParams);
    if (!p.get("page")) p.set("page", "1");
    if (!p.get("page_size")) p.set("page_size", String(DEFAULT_PAGE_SIZE));
    return p;
  }, [searchParams]);

  const setFilter = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        next.set("page", "1"); // сброс страницы при смене фильтра
        return next;
      });
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (page: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(page));
        return next;
      });
    },
    [setSearchParams],
  );

  return { params, setFilter, setPage };
}
```

---

## Query hook с полным queryKey

```typescript
// features/products/hooks/useProductsQuery.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Paginated, Product } from "@/api/types/product";

export function useProductsQuery(params: URLSearchParams) {
  const qs = params.toString();

  return useQuery({
    queryKey: ["products", qs],
    queryFn: ({ signal }) =>
      api<Paginated<Product>>(`/api/v1/products/?${qs}`, { signal }),
    placeholderData: (prev) => prev, // v5: keepPreviousData equivalent
  });
}
```

**Правило:** всё, что меняет ответ API, в `queryKey` ([20-tanstack-query.md](../react-basic/20-tanstack-query.md)).

`placeholderData: (prev) => prev` — при смене page не мигает пустой skeleton ([06-query-advanced.md](06-query-advanced.md)).

---

## UI: фильтры и таблица

```tsx
// features/products/components/ProductFilters.tsx
type Props = {
  params: URLSearchParams;
  onFilter: (key: string, value: string) => void;
};

export function ProductFilters({ params, onFilter }: Props) {
  return (
    <div className="filters">
      <input
        type="search"
        placeholder="SKU или название"
        defaultValue={params.get("search") ?? ""}
        onChange={(e) => onFilter("search", e.target.value)}
      />
      <select
        value={params.get("category") ?? ""}
        onChange={(e) => onFilter("category", e.target.value)}
      >
        <option value="">Все категории</option>
        <option value="peripherals">Peripherals</option>
      </select>
      <select
        value={params.get("ordering") ?? ""}
        onChange={(e) => onFilter("ordering", e.target.value)}
      >
        <option value="">Без сортировки</option>
        <option value="price">Цена ↑</option>
        <option value="-price">Цена ↓</option>
      </select>
    </div>
  );
}
```

Для search используйте **debounce** ([28-custom-hooks.md](../react-basic/28-custom-hooks.md)) — не дергайте API на каждый keypress.

---

## Pagination controls

```tsx
// features/products/components/ProductsPagination.tsx
type Props = {
  count: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function ProductsPagination({ count, page, pageSize, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <nav aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Назад
      </button>
      <span>
        {page} / {totalPages} ({count} товаров)
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Вперёд
      </button>
    </nav>
  );
}
```

Альтернатива: парсить `next`/`previous` из DRF — надёжнее при кастомной pagination backend.

---

## Сборка ProductsPage

```tsx
// pages/ProductsPage.tsx (fragment)
export default function ProductsPage() {
  const { params, setFilter, setPage } = useProductFilters();
  const { data, isPending, isError, error, isFetching } = useProductsQuery(params);

  const page = Number(params.get("page") ?? 1);
  const pageSize = Number(params.get("page_size") ?? 25);

  if (isPending) return <p>Загрузка…</p>;
  if (isError) return <p role="alert">{(error as Error).message}</p>;

  return (
    <>
      <ProductFilters params={params} onFilter={setFilter} />
      {isFetching && !isPending && <small>Обновление…</small>}
      {data.results.length === 0 ? (
        <p>Ничего не найдено.</p>
      ) : (
        <ProductsTable rows={data.results} />
      )}
      <ProductsPagination
        count={data.count}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </>
  );
}
```

---

## MSW и pagination

Расширьте handler для учёта `page`:

```typescript
http.get("/api/v1/products/", async ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  // slice mockProducts для page — в лабе 07
  await delay(300);
  return HttpResponse.json({ count: 2, next: null, previous: null, results: mockProducts });
}),
```

---

## FastAPI vs DRF (react-basic recall)

react-basic `GET /api/v1/items` → `Item[]`. Migration mental model:

```text
data.map(...)           →  data.results.map(...)
items.length            →  data.count
local slice pagination  →  server page + query params
```

---

## Типичные ошибки

1. **queryKey `['products']` без params** — неверный кэш при смене фильтра.

2. **page только в useState** — URL не shareable; refresh сбрасывает.

3. **Не сбрасывать page при новом search** — пустая страница 5.

4. **Забыли trailing slash** — `/products?` vs `/products/?`.

5. **Client-side filter поверх server pagination** — двойная логика; trust API.

6. **Search без debounce** — DDoS собственного :8092.

---

## Чек-лист

- [ ] Понимаете поля `count`, `next`, `previous`, `results`
- [ ] Фильтры синхронизированы с URL
- [ ] `queryKey` включает serialized params
- [ ] Pagination UI использует `count` и `page_size`
- [ ] Готовы к лабе [07-lab-django-products.md](07-lab-django-products.md)

## Далее

Следующий урок: [06. TanStack Query: infinite, prefetch, keepPreviousData](06-query-advanced.md).
