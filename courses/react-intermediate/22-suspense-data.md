# 22. Suspense для данных: `useSuspenseQuery`

## Сценарий с работы

Products page после [21-code-splitting.md](21-code-splitting.md) lazy-loaded. Внутри — классический Query:

```tsx
if (isPending) return <Spinner />;
if (isError) return <ErrorPanel ... />;
return <Table data={data} />;
```

Три ветки UI дублируются в `ProductDetailPage`, `DashboardWidgets`, `CategoryPicker`. Tech lead предлагает **`useSuspenseQuery`** (TanStack Query v5): pending → ближайший `<Suspense>`, error → Error Boundary + `QueryErrorResetBoundary` ([15-boundaries-router.md](15-boundaries-router.md)). Меньше branching, единый skeleton.

Осторожно: Suspense data — **opt-in** per query; не мигрируйте весь admin одним PR.

## Что вы узнаете

- `useSuspenseQuery` vs `useQuery`
- `throwOnError`, guaranteed `data` type
- Композиция Suspense + ErrorBoundary + Query reset
- `useSuspenseInfiniteQuery` (обзор)
- Prefetch и suspend on navigation
- Caveats: SSR, mutations, testing

База: [react-basic: TanStack Query](../react-basic/20-tanstack-query.md), advanced [06-query-advanced.md](06-query-advanced.md).

---

## useQuery vs useSuspenseQuery

| | `useQuery` | `useSuspenseQuery` |
|---|------------|---------------------|
| Loading | `isPending` branch | **Suspense fallback** |
| Error | `isError` branch | throw → **ErrorBoundary** |
| `data` type | `T \| undefined` | **`T`** (guaranteed after suspend) |
| Suspense | optional | **required** boundary |

---

## Включение suspense query

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

Компонент:

```tsx
function ProductsTableSuspense() {
  const { data } = useProductsSuspense();
  // data.results — всегда defined после resume suspend

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

Порядок: **ResetBoundary → ErrorBoundary → Suspense → child**.

---

## Обработка ошибок

`useSuspenseQuery` при error **throws** promise/error to React. Локальный `isError` **нет**.

404 product:

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

Route `errorElement` или boundary fallback показывает not found ([15-boundaries-router.md](15-boundaries-router.md)).

Для recoverable API errors prefer **`useQuery`** + ErrorPanel ([16-global-error-ux.md](16-global-error-ux.md)) — не всё должно быть suspense.

---

## QueryClient default suspense

Не включайте глобально ` suspense: true` для всех queries без подготовки boundaries. Явно per hook:

```tsx
useSuspenseQuery({ ... })  // OK
useQuery({ suspense: true }) // v5 — prefer dedicated hook
```

---

## Prefetch + suspend on navigate

```tsx
// router loader or on hover
await queryClient.prefetchQuery({
  queryKey: ["products", productId],
  queryFn: () => api(`/api/v1/products/${productId}/`),
});

// navigate — detail page suspend minimal
```

React Router 7 + Query prefetch в `loader` — smooth transition без flash skeleton.

---

## useSuspenseInfiniteQuery

Для infinite catalog ([20-virtualization.md](20-virtualization.md)):

```tsx
const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
  queryKey: ["products", "infinite"],
  queryFn: ({ pageParam, signal }) =>
    api(`/api/v1/products/?page=${pageParam}`, { signal }),
  initialPageParam: 1,
  getNextPageParam: (last) => nextPageFromDjango(last),
});
```

First page suspend; `fetchNextPage` — обычно `isFetchingNextPage` без suspend (v5 behavior — читайте changelog). Тестируйте UX в лабе [23-lab-performance.md](23-lab-performance.md).

---

## Parallel queries

```tsx
function ProductDashboard({ id }: { id: number }) {
  const product = useProductSuspense(id);
  const categories = useCategoriesSuspense();
  // React 18+ suspend multiple — ближайший Suspense ждёт все (if same boundary)
}
```

Waterfall risk: sequential awaits in one component without parallel. TanStack Query dedupe parallel mounts.

---

## Mutations остаются imperative

`useMutation` **не** suspense по умолчанию. Create product — `isPending` на кнопке ([react-basic: mutations](../react-basic/21-mutations.md)).

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

`findBy*` ждёт async suspend resume.

---

## StrictMode

Double fetch in dev on mount — Query dedupe helps; Suspense may show fallback twice briefly — OK in dev.

---

## Migration strategy

1. Один leaf: `ProductsTableSuspense`.
2. Boundaries + skeleton на route ([21-code-splitting.md](21-code-splitting.md)).
3. Detail pages.
4. Оставить `useQuery` на forms/search с debounce.

Не смешивайте в одном компоненте `useSuspenseQuery` и manual `isPending` для того же key.

---

## Типичные ошибки

**Suspense без ErrorBoundary.** Unhandled error white screen.

**useSuspenseQuery в root без fallback.** App suspends entirely.

**404 не retry, но throw generic Error.** Показывает 500 message.

**Expect data before suspend ends.** TypeScript helps; runtime — suspend.

**Suspense для каждого filter keystroke.** Debounce search query key ([05-pagination-filters.md](05-pagination-filters.md)).

**Забыли QueryErrorResetBoundary.** Reset после error не refetch.

---

## Чек-лист

- [ ] Разница loading UX: useQuery vs useSuspenseQuery
- [ ] Порядок Boundary / Suspense / Reset
- [ ] Почему mutations не suspense
- [ ] Когда оставить useQuery + ErrorPanel
- [ ] Prefetch перед navigation

---

## Далее

Следующий урок: [23. Лаба: оптимизация каталога](23-lab-performance.md) — virtualization + lazy routes + optional suspense.
