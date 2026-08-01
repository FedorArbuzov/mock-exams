# 22. Suspense for data: `useSuspenseQuery`

## A story from work

After [21-code-splitting.md](21-code-splitting.md), the products page is lazy-loaded. Inside — a classic Query:

```tsx
if (isPending) return <Spinner />;
if (isError) return <ErrorPanel ... />;
return <Table data={data} />;
```

Three UI branches are duplicated in `ProductDetailPage`, `DashboardWidgets`, `CategoryPicker`. The tech lead suggests **`useSuspenseQuery`** (TanStack Query v5): pending → the nearest `<Suspense>`, error → Error Boundary + `QueryErrorResetBoundary` ([15-boundaries-router.md](15-boundaries-router.md)). Less branching, a single skeleton.

Careful: Suspense data is **opt-in** per query; don't migrate the whole admin in one PR.

## What you'll learn

- `useSuspenseQuery` vs `useQuery`
- `throwOnError`, the guaranteed `data` type
- Composing Suspense + ErrorBoundary + Query reset
- `useSuspenseInfiniteQuery` (overview)
- Prefetch and suspend on navigation
- Caveats: SSR, mutations, testing

Foundation: [react-basic: TanStack Query](../react-basic/20-tanstack-query.md), advanced [06-query-advanced.md](06-query-advanced.md).

---

## useQuery vs useSuspenseQuery

| | `useQuery` | `useSuspenseQuery` |
|---|------------|---------------------|
| Loading | `isPending` branch | **Suspense fallback** |
| Error | `isError` branch | throw → **ErrorBoundary** |
| `data` type | `T \| undefined` | **`T`** (guaranteed after suspend) |
| Suspense | optional | **required** boundary |

---

## Enabling a suspense query

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { PaginatedProducts } from "@/api/types";

export function useProductsSuspense() {
  return useSuspenseQuery({
    queryKey: ["products", { page: 1 }],
    queryFn: ({ signal }) =>
      api<PaginatedProducts>("/api/v1/products/?page=1", { signal }),
    staleTime: 30_000,
  });
}
```

Component:

```tsx
function ProductsTableSuspense() {
  const { data } = useProductsSuspense();
  // data.results — always defined after resuming from suspend

  return (
    <VirtualProductsTable rows={data.results} />
  );
}

export function ProductsListPage() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={SectionErrorFallback}>
          <Suspense fallback={<TableSkeleton rows={8} />}>
            <ProductsTableSuspense />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

Order: **ResetBoundary → ErrorBoundary → Suspense → child**.

---

## Error handling

On error, `useSuspenseQuery` **throws** a promise/error to React. There is **no** local `isError`.

A 404 product:

```tsx
export function useProductSuspense(id: number) {
  return useSuspenseQuery({
    queryKey: ["products", id],
    queryFn: async ({ signal }) => {
      try {
        return await api<Product>(`/api/v1/products/${id}/`, { signal });
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          throw new Response("Not found", { status: 404 });
        }
        throw e;
      }
    },
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
  });
}
```

The route `errorElement` or a boundary fallback shows not found ([15-boundaries-router.md](15-boundaries-router.md)).

For recoverable API errors, prefer **`useQuery`** + ErrorPanel ([16-global-error-ux.md](16-global-error-ux.md)) — not everything has to be suspense.

---

## QueryClient default suspense

Don't enable `suspense: true` globally for all queries without preparing boundaries. Do it explicitly per hook:

```tsx
useSuspenseQuery({ ... })  // OK
useQuery({ suspense: true }) // v5 — prefer the dedicated hook
```

---

## Prefetch + suspend on navigate

```tsx
// router loader or on hover
await queryClient.prefetchQuery({
  queryKey: ["products", productId],
  queryFn: () => api(`/api/v1/products/${productId}/`),
});

// navigate — the detail page suspends minimally
```

React Router 7 + Query prefetch in the `loader` — a smooth transition without a flash of the skeleton.

---

## useSuspenseInfiniteQuery

For an infinite catalog ([20-virtualization.md](20-virtualization.md)):

```tsx
const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
  queryKey: ["products", "infinite"],
  queryFn: ({ pageParam, signal }) =>
    api(`/api/v1/products/?page=${pageParam}`, { signal }),
  initialPageParam: 1,
  getNextPageParam: (last) => nextPageFromDjango(last),
});
```

The first page suspends; `fetchNextPage` — usually `isFetchingNextPage` without suspending (v5 behavior — read the changelog). Test the UX in the [23-lab-performance.md](23-lab-performance.md) lab.

---

## Parallel queries

```tsx
function ProductDashboard({ id }: { id: number }) {
  const product = useProductSuspense(id);
  const categories = useCategoriesSuspense();
  // React 18+ suspend multiple — the nearest Suspense waits for all (if same boundary)
}
```

Waterfall risk: sequential awaits in one component without parallelism. TanStack Query dedupes parallel mounts.

---

## Mutations stay imperative

`useMutation` is **not** suspense by default. Create product — `isPending` on the button ([react-basic: mutations](../react-basic/21-mutations.md)).

---

## Testing

MSW ([24-msw-intro.md](24-msw-intro.md)) + suspense tests need:

```tsx
render(
  <QueryClientProvider client={testClient}>
    <Suspense fallback="loading">
      <ProductsTableSuspense />
    </Suspense>
  </QueryClientProvider>,
);
await screen.findByRole("table");
```

`findBy*` waits for the async suspend to resume.

---

## StrictMode

Double fetch in dev on mount — Query dedupe helps; Suspense may briefly show the fallback twice — OK in dev.

---

## Migration strategy

1. One leaf: `ProductsTableSuspense`.
2. Boundaries + skeleton on the route ([21-code-splitting.md](21-code-splitting.md)).
3. Detail pages.
4. Keep `useQuery` on forms/search with debounce.

Don't mix `useSuspenseQuery` and a manual `isPending` for the same key in one component.

---

## Common mistakes

**Suspense without an ErrorBoundary.** Unhandled error → white screen.

**useSuspenseQuery at the root without a fallback.** The app suspends entirely.

**404 not retried, but throws a generic Error.** Shows a 500 message.

**Expecting data before the suspend ends.** TypeScript helps; at runtime — it suspends.

**Suspense for every filter keystroke.** Debounce the search query key ([05-pagination-filters.md](05-pagination-filters.md)).

**Forgot QueryErrorResetBoundary.** Reset after an error doesn't refetch.

---

## Checklist

- [ ] The loading UX difference: useQuery vs useSuspenseQuery
- [ ] The order Boundary / Suspense / Reset
- [ ] Why mutations aren't suspense
- [ ] When to keep useQuery + ErrorPanel
- [ ] Prefetch before navigation

---

## Next

Next lesson: [23. Lab: catalog optimization](23-lab-performance.md) — virtualization + lazy routes + optional suspense.
