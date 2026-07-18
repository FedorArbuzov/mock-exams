# 07. Лаба: products с Django :8092

## Сценарий с работы

Ticket **SHOP-310**: «Подключить admin products к real Django API». Backend pod на :8092; frontend на :5174 с proxy. QA checklist: список грузится, pagination в URL, search debounced, ошибки 500 читаемы, MSW fallback для offline dev».

Лаба объединяет [03-lab-scaffold.md](03-lab-scaffold.md), [04-api-client.md](04-api-client.md), [05-pagination-filters.md](05-pagination-filters.md), [06-query-advanced.md](06-query-advanced.md).

**Время:** ~60–75 минут.

## Что вы узнаете

- Интеграция с Django DRF products endpoint.
- Полный vertical slice feature `products`.
- Переключение real API / MSW.
- UI states: loading, empty, error, fetching.

---

## Задача

Реализовать **страницу Products** с данными из `/api/v1/products/`:

1. `api/client.ts` + `ApiError` + types.
2. `useProductFilters`, `useProductsQuery` с URL sync.
3. `ProductsTable`, `ProductFilters`, `ProductsPagination`.
4. Работа против Django :8092 **или** MSW.
5. `placeholderData` при смене страницы.

Auth пока **не** требуется — endpoint может быть AllowAny на dev; JWT добавите в [13-lab-auth.md](13-lab-auth.md).

---

## Подготовка

### Вариант A: Django

```bash
cd deploy/django
docker compose up -d --build
curl http://localhost:8092/api/v1/products/
```

### Вариант B: MSW

```bash
cd courses/react-intermediate/examples
# .env.local: VITE_ENABLE_MSW=true
npm run dev
```

### Frontend

```bash
cd courses/react-intermediate/examples
npm install
npm run dev   # :5174
```

Структура после лабы:

```text
src/
  api/
    client.ts
    errors.ts
    types/product.ts
  features/products/
    hooks/useProductFilters.ts
    hooks/useProductsQuery.ts
    components/ProductsTable.tsx
    components/ProductFilters.tsx
    components/ProductsPagination.tsx
  pages/ProductsPage.tsx
```

---

## Шаги

### Шаг 1. API layer

Скопируйте реализацию из [04-api-client.md](04-api-client.md):

- `api/errors.ts` — `ApiError`
- `api/client.ts` — `api<T>()`, stub `setAccessTokenGetter(() => null)`
- `api/types/product.ts` — `Product`, `Paginated<T>`

Проверка в Console DevTools:

```javascript
fetch("/api/v1/products/").then(r => r.json()).then(console.log)
```

Ожидаете `{ count, results, ... }`.

### Шаг 2. useProductFilters

Реализация из [05-pagination-filters.md](05-pagination-filters.md):

- defaults: `page=1`, `page_size=25`
- `setFilter` сбрасывает `page` на 1
- `setPage` для pagination

### Шаг 3. useProductsQuery

```typescript
export function useProductsQuery(params: URLSearchParams) {
  const qs = params.toString();
  return useQuery({
    queryKey: ["products", qs],
    queryFn: ({ signal }) =>
      api<Paginated<Product>>(`/api/v1/products/?${qs}`, { signal }),
    placeholderData: (prev) => prev,
  });
}
```

### Шаг 4. ProductsTable

```tsx
// features/products/components/ProductsTable.tsx
import type { Product } from "@/api/types/product";

type Props = { rows: Product[] };

export function ProductsTable({ rows }: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>Title</th>
          <th>Price</th>
          <th>Category</th>
          <th>Active</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id}>
            <td>{p.sku}</td>
            <td>{p.title}</td>
            <td>{p.price}</td>
            <td>{p.category.name}</td>
            <td>{p.is_active ? "✓" : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Шаг 5. ProductFilters + debounce

```tsx
// hooks/useDebouncedValue.ts — или из react-basic
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

В filters: local state для input → debounced → `onFilter("search", debounced)`.

### Шаг 6. ProductsPagination

Из [05-pagination-filters.md](05-pagination-filters.md) — кнопки Назад/Вперёд, `count`, `page`, `pageSize`.

### Шаг 7. ProductsPage — сборка

```tsx
import { useProductFilters } from "@/features/products/hooks/useProductFilters";
import { useProductsQuery } from "@/features/products/hooks/useProductsQuery";
import { ProductFilters } from "@/features/products/components/ProductFilters";
import { ProductsTable } from "@/features/products/components/ProductsTable";
import { ProductsPagination } from "@/features/products/components/ProductsPagination";
import { ApiError } from "@/api/errors";

export default function ProductsPage() {
  const { params, setFilter, setPage } = useProductFilters();
  const query = useProductsQuery(params);

  const page = Number(params.get("page") ?? 1);
  const pageSize = Number(params.get("page_size") ?? 25);

  if (query.isPending && !query.data) {
    return <p aria-busy="true">Загрузка каталога…</p>;
  }

  if (query.isError) {
    const msg =
      query.error instanceof ApiError
        ? query.error.message
        : "Ошибка загрузки";
    return (
      <div role="alert">
        <p>{msg}</p>
        <button type="button" onClick={() => query.refetch()}>
          Повторить
        </button>
      </div>
    );
  }

  const data = query.data!;

  return (
    <section>
      <h1>Products</h1>
      <ProductFilters params={params} onFilter={setFilter} />
      {query.isFetching && !query.isPending && (
        <small aria-live="polite">Обновление…</small>
      )}
      {data.results.length === 0 ? (
        <p>По фильтрам ничего не найдено.</p>
      ) : (
        <ProductsTable rows={data.results} />
      )}
      <ProductsPagination
        count={data.count}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </section>
  );
}
```

### Шаг 8. Расширить MSW (опционально)

Добавьте в `handlers.ts` фильтрацию по `search` и slice по `page` — см. [05-pagination-filters.md](05-pagination-filters.md).

### Шаг 9. Проверка

| Действие | Ожидание |
|----------|----------|
| Open `/products` | таблица с rows |
| URL `?page=2` | другая страница или empty если мало data |
| `?search=KB` | фильтр (если backend/MSW поддерживает) |
| Stop Django, MSW off | error + retry |
| `npm run typecheck` | 0 errors |

---

## Критерии успеха

- [ ] `api/client.ts` используется во всех product hooks
- [ ] DRF response typed as `Paginated<Product>`
- [ ] Фильтры и page отражены в URL (`useSearchParams`)
- [ ] `queryKey` содержит serialized params
- [ ] `placeholderData` — нет full skeleton при page change
- [ ] Error state с `ApiError.message` и кнопкой retry
- [ ] Empty state при `results.length === 0`
- [ ] Работает с Django :8092 **или** MSW mock
- [ ] Trailing slash в path `/api/v1/products/`

---

## Типичные ошибки

1. **404 на `/products` без slash** — DRF trailing slash.

2. **CORS error** — обходите через Vite proxy, не хардкод :8092 в fetch.

3. **queryKey без params** — stale cache при фильтрах.

4. **Price as number** — DRF Decimal часто string `"129.99"`.

5. **Забыли debounce search** — лишние запросы.

6. **Skeleton при placeholderData** — проверяйте `isPending && !data`.

---

## Чек-лист

- [ ] Vertical slice products complete
- [ ] Понимаете diff MSW vs Django
- [ ] Готовы к JWT block [08-jwt-basics.md](08-jwt-basics.md)

## Далее

Следующий урок: [08. JWT: access, refresh, claims, срок жизни](08-jwt-basics.md).
