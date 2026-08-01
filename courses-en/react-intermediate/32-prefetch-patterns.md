# 32. Prefetch: stale-while-revalidate and background sync

## A story from work

A UX review of the admin SPA: "A user clicks a product in the table — 300 ms of a white screen, then the detail." The table already showed the title, price, sku — but the detail page fetches from scratch again. Senior frontend: "Prefetch on hover/focus intent + stale-while-revalidate. The detail should open instantly in 80% of cases."

TanStack Query v5 gives you `prefetchQuery`, `staleTime`, `gcTime`, `refetchOnWindowFocus` — tools for **perceived performance** without duplicating server state into Zustand.

## What you'll learn

- Prefetch on intent (hover, focus, route preload)
- `queryClient.prefetchQuery` vs `ensureQueryData`
- The stale-while-revalidate mental model
- Router integration: prefetch the next page
- Background sync and `refetchInterval` (when appropriate)

---

## Stale vs fresh vs inactive

| State | Meaning | UX |
|-----------|----------|-----|
| **Fresh** | `Date.now - dataUpdatedAt < staleTime` | Shown without a refetch |
| **Stale** | data exists, but is "outdated" | Shown + background refetch |
| **Missing** | not in cache | fetch + loading UI |

Default `staleTime: 0` — data is stale right after a fetch → refetch on mount/focus. Admin catalog: **`staleTime: 30_000–60_000`** on list/detail reduces unnecessary requests.

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

**Intent-based:** prefetch on a link's `mouseenter` / `focus` — not on rendering the whole list (N requests).

Throttle if needed:

```tsx
const prefetched = useRef(new Set<number>());

function prefetchDetail(id: number) {
  if (prefetched.current.has(id)) return;
  prefetched.current.add(id);
  queryClient.prefetchQuery({ ... });
}
```

---

## ensureQueryData in a loader (React Router)

React Router 6.4+ data APIs:

```tsx
// routes: a loader on the detail route
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

Loader + Query — one cache; don't duplicate the fetch logic (shared `fetchProduct`).

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

Next page click → instant with `placeholderData: keepPreviousData` ([06-query-advanced.md](06-query-advanced.md)).

---

## Code splitting + prefetch of the route bundle

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

**Two prefetch layers:** JS chunk + JSON data. Both improve navigation.

---

## Suspense + prefetch

With [22-suspense-data.md](22-suspense-data.md) `useSuspenseQuery`:

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

`<Suspense fallback={<DetailSkeleton />}>` — the fallback only on a cold cache.

---

## Background sync

An admin dashboard's "orders count" — optional `refetchInterval: 30_000`.

**Catalog products:** usually **not** polled constantly — it's expensive and interferes with editing. Instead:

- `refetchOnWindowFocus: true` — the user returned to the tab
- invalidate after mutations
- a manual "Refresh" button for support

```tsx
useQuery({
  queryKey: productKeys.list(params),
  queryFn: () => fetchProducts(params),
  refetchInterval: document.hidden ? false : 60_000, // optional, rarely needed
});
```

---

## invalidate vs prefetch

| API | When |
|-----|-------|
| `prefetchQuery` | Proactive load **before** navigation |
| `invalidateQueries` | Data **changed** (mutation) — mark stale + refetch active |
| `setQueryData` | We know the exact new value (optimistic) |
| `resetQueries` | Logout / clear sensitive |

Prefetch **doesn't replace** invalidate after a POST/PATCH.

---

## Lab (short version)

1. Prefetch detail on row hover in the products table.
2. `staleTime: 60s` on list/detail — verify in DevTools Network: a repeat visit without a fetch in the stale window.
3. Prefetch page+1 while viewing page N.
4. (Optional) loader `ensureQueryData` on the detail route.

**Success criterion:** hover a link 200ms → click → detail without a full-page loading spinner (data from cache).

---

## Common mistakes

1. **Prefetch all rows on mount** — thundering herd on the API.

2. **Different queryFn** in prefetch and useQuery — cache mismatch / double logic.

3. **staleTime: Infinity** without an invalidate strategy — stale UI forever.

4. **Prefetch without the auth header** — 401 cached (configure the query's `retry` / `enabled` with auth).

5. **Confuse prefetching the chunk and the data** — both are needed for an "instant" edit page.

---

## Checklist

- [ ] Intent-based prefetch (hover/focus), not bulk on render
- [ ] Shared `queryKey` + `queryFn` between prefetch and useQuery
- [ ] `staleTime` set sensibly for read-heavy admin screens
- [ ] Pagination prefetch next/prev optional
- [ ] Mutations still invalidate — prefetch doesn't cancel consistency
- [ ] DevTools Network: measured the improvement

---

[← 31-lab-crud](31-lab-crud.md) · [33-zustand-ui →](33-zustand-ui.md)
