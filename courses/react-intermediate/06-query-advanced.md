# 06. TanStack Query: infinite, prefetch, keepPreviousData

## Сценарий с работы

Products table из [05-pagination-filters.md](05-pagination-filters.md) работает, но UX raw: при клике «Страница 2» таблица **мигает** skeleton, хотя данные страницы 1 уже были. Product owner хочет **infinite scroll** на mobile preview. Performance ticket: при hover на category в sidebar **prefetch** products этой категории.

react-basic [20-tanstack-query.md](../react-basic/20-tanstack-query.md) покрыл basics; здесь — паттерны admin SPA на Django :8092.

## Что вы узнаете

- `placeholderData` (keep previous page visible).
- `useInfiniteQuery` для cursor/page pagination.
- `prefetchQuery` и `ensureQueryData`.
- `enabled`, `select`, stale policies для таблиц.
- Когда infinite vs classic pagination.

---

## keepPreviousData в v5

В React Query v4 было `keepPreviousData: true`. В **v5**:

```typescript
useQuery({
  queryKey: ["products", qs],
  queryFn: fetchProducts,
  placeholderData: (previousData) => previousData,
});
```

Пока fetch page 2 in flight — UI показывает **page 1 data** с индикатором `isFetching`. Skeleton только при **первом** `isPending`.

```tsx
{isPending && !data ? (
  <TableSkeleton />
) : (
  <>
    {isFetching && <span aria-live="polite">Обновление…</span>}
    <ProductsTable rows={data!.results} />
  </>
)}
```

---

## isPlaceholderData

```tsx
const { data, isPlaceholderData, isFetching } = useProductsQuery(params);

<button disabled={isPlaceholderData || isFetching} onClick={() => setPage(page + 1)}>
  Вперёд
</button>
```

Блокируйте double-click pagination пока идёт fetch.

---

## useInfiniteQuery (DRF page-based)

DRF отдаёт `next` URL — можно парсить `page=` или использовать link header. Упрощённый page-based:

```typescript
// features/products/hooks/useInfiniteProducts.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Paginated, Product } from "@/api/types/product";

type PageParam = number;

export function useInfiniteProducts(baseParams: URLSearchParams) {
  return useInfiniteQuery({
    queryKey: ["products", "infinite", baseParams.toString()],
    initialPageParam: 1 as PageParam,
    queryFn: async ({ pageParam, signal }) => {
      const qs = new URLSearchParams(baseParams);
      qs.set("page", String(pageParam));
      return api<Paginated<Product>>(`/api/v1/products/?${qs}`, { signal });
    },
    getNextPageParam: (lastPage, _all, lastPageParam) => {
      if (!lastPage.next) return undefined;
      return (lastPageParam as number) + 1;
    },
  });
}
```

UI:

```tsx
function InfiniteProductList() {
  const { params } = useProductFilters();
  const q = useInfiniteProducts(params);

  if (q.isPending) return <p>Загрузка…</p>;

  const rows = q.data.pages.flatMap((p) => p.results);

  return (
    <>
      <ul>
        {rows.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
      {q.hasNextPage && (
        <button
          type="button"
          onClick={() => q.fetchNextPage()}
          disabled={q.isFetchingNextPage}
        >
          {q.isFetchingNextPage ? "Загрузка…" : "Ещё"}
        </button>
      )}
    </>
  );
}
```

**Когда infinite:** mobile feed, scroll-heavy. **Когда classic pagination:** admin desktop table с jump to page.

---

## prefetchQuery

При hover на category prefetch products:

```typescript
import { useQueryClient } from "@tanstack/react-query";

function CategoryNav() {
  const queryClient = useQueryClient();

  const prefetchCategory = (slug: string) => {
    const params = new URLSearchParams({ category: slug, page: "1" });
    queryClient.prefetchQuery({
      queryKey: ["products", params.toString()],
      queryFn: ({ signal }) =>
        api<Paginated<Product>>(`/api/v1/products/?${params}`, { signal }),
      staleTime: 60_000,
    });
  };

  return (
    <button
      type="button"
      onMouseEnter={() => prefetchCategory("peripherals")}
      onFocus={() => prefetchCategory("peripherals")}
    >
      Peripherals
    </button>
  );
}
```

Prefetch — **оптимизация**; не заменяет `useQuery` на целевой странице. Подробнее [32-prefetch-patterns.md](32-prefetch-patterns.md).

---

## ensureQueryData в loader (Router)

React Router loader + Query ([24-nested-routes.md](../react-basic/24-nested-routes.md)):

```typescript
// app/loaders/productsLoader.ts
export async function productsLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const params = url.searchParams;

  await queryClient.ensureQueryData({
    queryKey: ["products", params.toString()],
    queryFn: () => api<Paginated<Product>>(`/api/v1/products/?${params}`),
  });

  return null;
}
```

Данные в cache до render — меньше layout shift. Suspense variant — [22-suspense-data.md](22-suspense-data.md).

---

## select — производные данные

```typescript
useQuery({
  queryKey: ["products", qs],
  queryFn: fetchProducts,
  select: (data) => ({
    rows: data.results,
    total: data.count,
    activeCount: data.results.filter((p) => p.is_active).length,
  }),
});
```

`select` мemoized — re-render только при изменении selected slice. Не злоупотребляйте тяжёлыми select на huge lists без virtualization ([20-virtualization.md](20-virtualization.md)).

---

## enabled и dependent queries

```typescript
const { data: user } = useAuth(); // preview

useQuery({
  queryKey: ["products", qs],
  queryFn: fetchProducts,
  enabled: Boolean(user), // не fetch до login
});
```

Protected data — только после auth ([10-auth-context.md](10-auth-context.md)).

---

## invalidateQueries после mutation

Из react-basic [21-mutations.md](../react-basic/21-mutations.md):

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["products"] });
},
```

Partial key `["products"]` invalidates **все** pages/filters — правильно после create/delete. Для update одного product — `["products", id]` + list invalidation.

---

## staleTime для admin table

| Сценарий | staleTime |
|----------|-----------|
| Частые правки коллег | 0–10 s |
| Стабильный каталог | 30–60 s |
| Справочник categories | 5 min |

Admin часто нужен **fresh** data после mutations — invalidation важнее длинного staleTime.

---

## MSW + advanced query

Infinite query делает несколько sequential requests — MSW handlers должны учитывать `page`. Задержка `delay(300)` в handler помогает увидеть `placeholderData` и `isFetchingNextPage` в DevTools.

---

## Типичные ошибки

1. **Skeleton при каждом page change** — забыли `placeholderData`.

2. **Infinite + classic на одном key** — разные queryKey prefixes (`infinite`).

3. **Prefetch без staleTime** — лишние запросы при каждом hover.

4. **flatMap без unique keys** — duplicate keys если API overlap pages.

5. **getNextPageParam всегда +1** — проверяйте `lastPage.next`.

6. **Prefetch огромных lists** — бьёт по памяти; prefetch first page only.

---

## Чек-лист

- [ ] `placeholderData` убирает flash при pagination
- [ ] Можете описать `useInfiniteQuery` vs numbered pages
- [ ] Знаете `prefetchQuery` и когда не нужен
- [ ] `enabled` блокирует fetch без auth
- [ ] invalidation после CRUD затрагивает list keys

## Далее

Следующий урок: [07. Лаба: products с Django :8092](07-lab-django-products.md).
