# 06. TanStack Query: infinite, prefetch, keepPreviousData

## Scenario from work

The products table from [05-pagination-filters.md](05-pagination-filters.md) works, but the UX is raw: clicking "Page 2" makes the table **flash** a skeleton, even though page 1's data was already there. The product owner wants **infinite scroll** on the mobile preview. There's also a performance ticket: hovering a category in the sidebar should **prefetch** that category's products.

react-basic [20-tanstack-query.md](../react-basic/20-tanstack-query.md) covered the basics; here we cover patterns for an admin SPA on Django :8092.

## What you'll learn

- `placeholderData` (keep the previous page visible).
- `useInfiniteQuery` for cursor/page pagination.
- `prefetchQuery` and `ensureQueryData`.
- `enabled`, `select`, stale policies for tables.
- Infinite vs classic pagination — when to use which.

---

## keepPreviousData in v5

In React Query v4 there was `keepPreviousData: true`. In **v5**:

```typescript
useQuery({
  queryKey: ["products", qs],
  queryFn: fetchProducts,
  placeholderData: (previousData) => previousData,
});
```

While page 2's fetch is in flight, the UI shows **page 1's data** with an `isFetching` indicator. The skeleton only shows on the **first** `isPending`.

```tsx
{isPending && !data ? (
  <TableSkeleton />
) : (
  <>
    {isFetching && <span aria-live="polite">Updating…</span>}
    <ProductsTable rows={data!.results} />
  </>
)}
```

---

## isPlaceholderData

```tsx
const { data, isPlaceholderData, isFetching } = useProductsQuery(params);

<button disabled={isPlaceholderData || isFetching} onClick={() => setPage(page + 1)}>
  Next
</button>
```

Block double-click pagination while a fetch is in progress.

---

## useInfiniteQuery (DRF page-based)

DRF returns a `next` URL — you can parse `page=` from it or use a link header. Simplified page-based approach:

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

  if (q.isPending) return <p>Loading…</p>;

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
          {q.isFetchingNextPage ? "Loading…" : "More"}
        </button>
      )}
    </>
  );
}
```

**Use infinite for:** mobile feeds, scroll-heavy UIs. **Use classic pagination for:** an admin desktop table with jump-to-page.

---

## prefetchQuery

Prefetch products on category hover:

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

Prefetch is an **optimization** — it doesn't replace `useQuery` on the target page. More in [32-prefetch-patterns.md](32-prefetch-patterns.md).

---

## ensureQueryData in a loader (Router)

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

Data is in the cache before render — less layout shift. The Suspense variant is in [22-suspense-data.md](22-suspense-data.md).

---

## select — derived data

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

`select` is memoized — it only re-renders when the selected slice changes. Don't overuse heavy `select` functions on huge lists without virtualization ([20-virtualization.md](20-virtualization.md)).

---

## enabled and dependent queries

```typescript
const { data: user } = useAuth(); // preview

useQuery({
  queryKey: ["products", qs],
  queryFn: fetchProducts,
  enabled: Boolean(user), // don't fetch before login
});
```

Protected data — only fetch after auth ([10-auth-context.md](10-auth-context.md)).

---

## invalidateQueries after a mutation

From react-basic [21-mutations.md](../react-basic/21-mutations.md):

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["products"] });
},
```

The partial key `["products"]` invalidates **all** pages/filters — correct after a create/delete. For updating a single product, use `["products", id]` plus a list invalidation.

---

## staleTime for an admin table

| Scenario | staleTime |
|----------|-----------|
| Colleagues editing frequently | 0–10 s |
| Stable catalog | 30–60 s |
| Categories reference data | 5 min |

Admin usually needs **fresh** data after mutations — invalidation matters more than a long staleTime.

---

## MSW + advanced query

An infinite query makes several sequential requests — MSW handlers need to account for `page`. A `delay(300)` in the handler helps you see `placeholderData` and `isFetchingNextPage` in DevTools.

---

## Common mistakes

1. **Skeleton on every page change** — forgot `placeholderData`.

2. **Infinite + classic sharing a key** — use distinct queryKey prefixes (`infinite`).

3. **Prefetch without staleTime** — extra requests on every hover.

4. **flatMap without unique keys** — duplicate keys if the API's pages overlap.

5. **getNextPageParam always +1** — check `lastPage.next` instead.

6. **Prefetching huge lists** — hits memory; prefetch the first page only.

---

## Checklist

- [ ] `placeholderData` removes the flash on pagination
- [ ] You can describe `useInfiniteQuery` vs numbered pages
- [ ] You know `prefetchQuery` and when it's not needed
- [ ] `enabled` blocks fetching without auth
- [ ] Invalidation after CRUD covers the list keys

## Next

Next lesson: [07. Lab: products with Django :8092](07-lab-django-products.md).
