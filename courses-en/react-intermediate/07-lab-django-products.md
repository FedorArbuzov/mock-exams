# 07. Lab: products with Django :8092

## Scenario from work

Ticket **SHOP-310**: "Wire up admin products to the real Django API." Backend pod on :8092; frontend on :5174 with a proxy. QA checklist: list loads, pagination is in the URL, search is debounced, 500 errors are readable, MSW fallback works for offline dev.

This lab pulls together [03-lab-scaffold.md](03-lab-scaffold.md), [04-api-client.md](04-api-client.md), [05-pagination-filters.md](05-pagination-filters.md), and [06-query-advanced.md](06-query-advanced.md).

**Time:** ~60–75 minutes.

## What you'll learn

- Integrating with the Django DRF products endpoint.
- A full vertical slice of the `products` feature.
- Switching between the real API and MSW.
- UI states: loading, empty, error, fetching.

---

## The task

Build a **Products page** backed by `/api/v1/products/`:

1. `api/client.ts` + `ApiError` + types.
2. `useProductFilters`, `useProductsQuery` with URL sync.
3. `ProductsTable`, `ProductFilters`, `ProductsPagination`.
4. Works against Django :8092 **or** MSW.
5. `placeholderData` on page change.

Auth is **not** required yet — the endpoint can be AllowAny in dev; you'll add JWT in [13-lab-auth.md](13-lab-auth.md).

---

## Setup

### Option A: Django

```bash
cd deploy/django
docker compose up -d --build
curl http://localhost:8092/api/v1/products/
```

### Option B: MSW

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

Structure after the lab:

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

## Steps

### Step 1. API layer

Copy the implementation from [04-api-client.md](04-api-client.md):

- `api/errors.ts` — `ApiError`
- `api/client.ts` — `api<T>()`, stub `setAccessTokenGetter(() => null)`
- `api/types/product.ts` — `Product`, `Paginated<T>`

Check it in the DevTools console:

```javascript
fetch("/api/v1/products/").then(r => r.json()).then(console.log)
```

You should get `{ count, results, ... }`.

### Step 2. useProductFilters

Implementation from [05-pagination-filters.md](05-pagination-filters.md):

- defaults: `page=1`, `page_size=25`
- `setFilter` resets `page` to 1
- `setPage` for pagination

### Step 3. useProductsQuery

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

### Step 4. ProductsTable

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

### Step 5. ProductFilters + debounce

```tsx
// hooks/useDebouncedValue.ts — or reuse the one from react-basic
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

In the filters component: local state for the input → debounced → `onFilter("search", debounced)`.

### Step 6. ProductsPagination

From [05-pagination-filters.md](05-pagination-filters.md) — Back/Next buttons, `count`, `page`, `pageSize`.

### Step 7. ProductsPage — assembly

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
    return <p aria-busy="true">Loading catalog…</p>;
  }

  if (query.isError) {
    const msg =
      query.error instanceof ApiError
        ? query.error.message
        : "Failed to load";
    return (
      <div role="alert">
        <p>{msg}</p>
        <button type="button" onClick={() => query.refetch()}>
          Retry
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
        <small aria-live="polite">Updating…</small>
      )}
      {data.results.length === 0 ? (
        <p>No results match these filters.</p>
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

### Step 8. Extend MSW (optional)

Add filtering by `search` and slicing by `page` to `handlers.ts` — see [05-pagination-filters.md](05-pagination-filters.md).

### Step 9. Verification

| Action | Expected result |
|----------|----------|
| Open `/products` | table with rows |
| URL `?page=2` | a different page, or empty if there isn't much data |
| `?search=KB` | filtered results (if the backend/MSW supports it) |
| Stop Django, MSW off | error + retry |
| `npm run typecheck` | 0 errors |

---

## Success criteria

- [ ] `api/client.ts` is used in every product hook
- [ ] DRF response is typed as `Paginated<Product>`
- [ ] Filters and page are reflected in the URL (`useSearchParams`)
- [ ] `queryKey` contains the serialized params
- [ ] `placeholderData` — no full skeleton on page change
- [ ] Error state shows `ApiError.message` with a retry button
- [ ] Empty state when `results.length === 0`
- [ ] Works with Django :8092 **or** the MSW mock
- [ ] Trailing slash on the `/api/v1/products/` path

---

## Common mistakes

1. **404 on `/products` without the slash** — DRF requires a trailing slash.

2. **CORS error** — route through the Vite proxy, don't hardcode :8092 in fetch calls.

3. **queryKey without params** — stale cache when filters change.

4. **Price as a number** — DRF Decimal often comes back as the string `"129.99"`.

5. **Forgot to debounce search** — extra requests.

6. **Skeleton showing despite placeholderData** — check `isPending && !data`.

---

## Checklist

- [ ] Products vertical slice complete
- [ ] You understand the diff between MSW and Django
- [ ] Ready for the JWT block [08-jwt-basics.md](08-jwt-basics.md)

## Next

Next lesson: [08. JWT: access, refresh, claims, expiry](08-jwt-basics.md).
