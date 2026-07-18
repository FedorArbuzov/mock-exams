# 32. Prefetch: stale-while-revalidate и background sync

## Сценарий с работы

UX review admin SPA: «Пользователь кликает товар в table — 300 ms белый экран, потом detail». Table уже показала title, price, sku — но detail page снова fetch с нуля. Senior frontend: «Prefetch on hover/focus intent + stale-while-revalidate. Detail должен открываться мгновенно в 80% случаев».

TanStack Query v5 дает `prefetchQuery`, `staleTime`, `gcTime`, `refetchOnWindowFocus` — инструменты **perceived performance** без дублирования server state в Zustand.

## Что вы узнаете

- Prefetch on intent (hover, focus, route preload)
- `queryClient.prefetchQuery` vs `ensureQueryData`
- Stale-while-revalidate mental model
- Router integration: prefetch next page
- Background sync и `refetchInterval` (когда уместно)

---

## Stale vs fresh vs inactive

| Состояние | Значение | UX |
|-----------|----------|-----|
| **Fresh** | `Date.now - dataUpdatedAt < staleTime` | Показ без refetch |
| **Stale** | data есть, но «устарела» | Показ + background refetch |
| **Missing** | нет в cache | fetch + loading UI |

Default `staleTime: 0` — data stale сразу после fetch → refetch on mount/focus. Admin catalog: **`staleTime: 30_000–60_000`** на list/detail снижает лишние запросы.

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
    },
  },
});
```

---

## prefetchQuery on hover

```tsx
// features/products/components/ProductRow.tsx
import { useQueryClient } from "@tanstack/react-query";

export function ProductRow({ product }: { product: Product }) {
  const queryClient = useQueryClient();

  function prefetchDetail() {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(product.id),
      queryFn: ({ signal }) => fetchProduct(product.id, signal),
      staleTime: 60_000,
    });
  }

  return (
    <tr
      onMouseEnter={prefetchDetail}
      onFocus={prefetchDetail}
    >
      <td>
        <Link to={`/products/${product.id}`}>{product.title}</Link>
      </td>
      {/* ... */}
    </tr>
  );
}
```

**Intent-based:** prefetch на `mouseenter` / `focus` link — не на render всего списка (N запросов).

Throttle если нужно:

```tsx
const prefetched = useRef(new Set<number>());

function prefetchDetail(id: number) {
  if (prefetched.current.has(id)) return;
  prefetched.current.add(id);
  queryClient.prefetchQuery({ ... });
}
```

---

## ensureQueryData в loader (React Router)

React Router 6.4+ data APIs:

```tsx
// routes: loader на detail route
export async function productDetailLoader({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  await queryClient.ensureQueryData({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
  });
  return null;
}
```

Component:

```tsx
const { data } = useQuery({
  queryKey: productKeys.detail(id),
  queryFn: () => fetchProduct(id),
  // data often already in cache from loader
});
```

Loader + Query — один cache; не дублируйте fetch logic (shared `fetchProduct`).

---

## Prefetch adjacent pagination pages

```tsx
useEffect(() => {
  if (!data) return;
  const { page } = params;
  const totalPages = Math.ceil(data.count / pageSize);

  if (page < totalPages) {
    queryClient.prefetchQuery({
      queryKey: productKeys.list({ ...params, page: page + 1 }),
      queryFn: ({ signal }) =>
        fetchProducts({ ...params, page: page + 1 }, signal),
    });
  }
  if (page > 1) {
    queryClient.prefetchQuery({
      queryKey: productKeys.list({ ...params, page: page - 1 }),
      queryFn: ({ signal }) =>
        fetchProducts({ ...params, page: page - 1 }, signal),
    });
  }
}, [data, params.page]);
```

Next page click → instant с `placeholderData: keepPreviousData` ([06-query-advanced.md](06-query-advanced.md)).

---

## Code splitting + prefetch route bundle

[21-code-splitting.md](21-code-splitting.md):

```tsx
const ProductEditPage = lazy(() => import("./ProductEditPage"));

<Link
  to={`/products/${id}/edit`}
  onMouseEnter={() => import("./ProductEditPage")}
>
  Edit
</Link>
```

**Два слоя prefetch:** JS chunk + JSON data. Оба улучшают navigation.

---

## Suspense + prefetch

С [22-suspense-data.md](22-suspense-data.md) `useSuspenseQuery`:

```tsx
// Parent prefetches; child suspends only if cache miss
function ProductDetailPage() {
  const { id } = useParams();
  const { data } = useSuspenseQuery({
    queryKey: productKeys.detail(Number(id)),
    queryFn: () => fetchProduct(Number(id)),
  });
  return <ProductDetailView product={data} />;
}
```

`<Suspense fallback={<DetailSkeleton />}>` — fallback только при cold cache.

---

## Background sync

Admin dashboard «orders count» — optional `refetchInterval: 30_000`.

**Catalog products:** обычно **не** poll постоянно — дорого и мешает editing. Вместо этого:

- `refetchOnWindowFocus: true` — user вернулся на tab
- invalidate после mutations
- manual «Обновить» button для support

```tsx
useQuery({
  queryKey: productKeys.list(params),
  queryFn: () => fetchProducts(params),
  refetchInterval: document.hidden ? false : 60_000, // optional, редко нужно
});
```

---

## invalidate vs prefetch

| API | Когда |
|-----|-------|
| `prefetchQuery` | Proactive load **до** navigation |
| `invalidateQueries` | Data **изменилась** (mutation) — mark stale + refetch active |
| `setQueryData` | Знаем exact new value (optimistic) |
| `resetQueries` | Logout / clear sensitive |

Prefetch **не заменяет** invalidate после POST/PATCH.

---

## Лаба (кратко)

1. Prefetch detail on row hover в products table.
2. `staleTime: 60s` на list/detail — verify DevTools Network: повторный visit без fetch в stale window.
3. Prefetch page+1 при viewing page N.
4. (Optional) loader `ensureQueryData` на detail route.

**Критерий:** hover link 200ms → click → detail без full-page loading spinner (data from cache).

---

## Типичные ошибки

1. **Prefetch all rows on mount** — thundering herd на API.

2. **Разные queryFn** в prefetch и useQuery — cache mismatch / double logic.

3. **staleTime: Infinity** без invalidate strategy — stale UI forever.

4. **Prefetch без auth header** — 401 cached (настройте query `retry` / `enabled` с auth).

5. **Путают prefetch chunk и data** — оба нужны для «мгновенного» edit page.

---

## Чек-лист

- [ ] Intent-based prefetch (hover/focus), не bulk on render
- [ ] Shared `queryKey` + `queryFn` между prefetch и useQuery
- [ ] `staleTime` настроен осмысленно для admin read-heavy screens
- [ ] Pagination prefetch next/prev optional
- [ ] Mutations still invalidate — prefetch не отменяет consistency
- [ ] DevTools Network: измерили improvement

---

[← 31-lab-crud](31-lab-crud.md) · [33-zustand-ui →](33-zustand-ui.md)
