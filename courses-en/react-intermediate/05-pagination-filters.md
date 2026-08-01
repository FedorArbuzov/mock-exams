# 05. Pagination, filters, the DRF contract

## Real-world scenario

The products table in admin. PM: "We need a filter by category, search by SKU, sorting by price, 25 rows per page." The backend delivered a DRF Swagger: `GET /api/v1/products/?page=2&page_size=25&search=KB&category=peripherals&ordering=-price`. A junior syncs the page in `useState`, forgets to put `page` in the `queryKey` — and when returning to page 1 the data of page 2 is shown. Tech lead: "The URL is the source of truth for a table" ([26-url-state.md](../react-basic/26-url-state.md)).

The lesson ties together the Django pagination contract, the React UI, and TanStack Query keys.

## What you'll learn

- The **DRF paginated response** format.
- Query params: `page`, `page_size`, `search`, `ordering`.
- Syncing filters with **URLSearchParams**.
- `queryKey` includes all params.
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

| Field | Meaning |
|------|--------|
| `count` | total records (for "Page 2 of 6") |
| `next` / `previous` | URL or `null` |
| `results` | the array on the **current** page |

TypeScript — [04-api-client.md](04-api-client.md):

```typescript
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
```

**Don't** expect a bare array like the FastAPI items in react-basic.

---

## Query parameters (a typical DRF)

| Param | Example | Effect |
|-------|--------|--------|
| `page` | `2` | page number (1-based) |
| `page_size` | `25` | size (if the backend allows it) |
| `search` | `keyboard` | full-text / icontains |
| `category` | `peripherals` | filter by slug |
| `ordering` | `-price` | sort: `-` desc |
| `is_active` | `true` | boolean filter |

The exact set — the OpenAPI/schema of Django [`deploy/django`](../../deploy/django/README.md). The MSW mock — [`handlers.ts`](examples/src/mocks/handlers.ts) (page 1 only; you'll extend it in the lab).

---

## The URL as the source of truth

```text
/products?page=2&search=KB&category=peripherals&ordering=-price
```

The user copies the URL — a colleague sees the same filter. A browser refresh — the state is restored.

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
        next.set("page", "1"); // reset the page when a filter changes
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

## Query hook with a complete queryKey

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

**Rule:** everything that changes the API response goes into the `queryKey` ([20-tanstack-query.md](../react-basic/20-tanstack-query.md)).

`placeholderData: (prev) => prev` — when the page changes, an empty skeleton doesn't flash ([06-query-advanced.md](06-query-advanced.md)).

---

## UI: filters and the table

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
        placeholder="SKU or name"
        defaultValue={params.get("search") ?? ""}
        onChange={(e) => onFilter("search", e.target.value)}
      />
      <select
        value={params.get("category") ?? ""}
        onChange={(e) => onFilter("category", e.target.value)}
      >
        <option value="">All categories</option>
        <option value="peripherals">Peripherals</option>
      </select>
      <select
        value={params.get("ordering") ?? ""}
        onChange={(e) => onFilter("ordering", e.target.value)}
      >
        <option value="">No sorting</option>
        <option value="price">Price ↑</option>
        <option value="-price">Price ↓</option>
      </select>
    </div>
  );
}
```

For search use a **debounce** ([28-custom-hooks.md](../react-basic/28-custom-hooks.md)) — don't hit the API on every keypress.

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
        Back
      </button>
      <span>
        {page} / {totalPages} ({count} products)
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Forward
      </button>
    </nav>
  );
}
```

Alternative: parse `next`/`previous` from DRF — more reliable with custom backend pagination.

---

## Assembling ProductsPage

```tsx
// pages/ProductsPage.tsx (fragment)
export default function ProductsPage() {
  const { params, setFilter, setPage } = useProductFilters();
  const { data, isPending, isError, error, isFetching } = useProductsQuery(params);

  const page = Number(params.get("page") ?? 1);
  const pageSize = Number(params.get("page_size") ?? 25);

  if (isPending) return <p>Loading…</p>;
  if (isError) return <p role="alert">{(error as Error).message}</p>;

  return (
    <>
      <ProductFilters params={params} onFilter={setFilter} />
      {isFetching && !isPending && <small>Updating…</small>}
      {data.results.length === 0 ? (
        <p>Nothing found.</p>
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

## MSW and pagination

Extend the handler to account for `page`:

```typescript
http.get("/api/v1/products/", async ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  // slice mockProducts for the page — in lab 07
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

## Common mistakes

1. **queryKey `['products']` without params** — the wrong cache when a filter changes.

2. **page only in useState** — the URL isn't shareable; a refresh resets it.

3. **Not resetting the page on a new search** — an empty page 5.

4. **Forgot the trailing slash** — `/products?` vs `/products/?`.

5. **Client-side filter on top of server pagination** — double logic; trust the API.

6. **Search without a debounce** — a DDoS of your own :8092.

---

## Checklist

- [ ] You understand the fields `count`, `next`, `previous`, `results`
- [ ] Filters are synced with the URL
- [ ] `queryKey` includes the serialized params
- [ ] The pagination UI uses `count` and `page_size`
- [ ] You're ready for the lab [07-lab-django-products.md](07-lab-django-products.md)

## Next

Next lesson: [06. TanStack Query: infinite, prefetch, keepPreviousData](06-query-advanced.md).
