# 29. Admin table: sort, filter, pagination

## A story from work

A support manager complains: "The admin SPA has 800 products, and the page hangs for 4 seconds." You open DevTools — one giant `map` with no pagination, and the category filter runs client-side over the full array. The backend already returns DRF pagination (`count`, `next`, `previous`, `results`) and query params `?category=peripherals&ordering=-price&search=keyboard` — but the UI ignores them.

The goal of this chapter: **synchronize** the admin table with the Django `:8092` REST contract, use URL state for shareable links, and provide predictable loading/error/empty UX.

## What you'll learn

- DRF pagination + filters + ordering — how to read the contract
- The URL as the source of truth for table state (`useSearchParams`)
- Components: header sort, filter bar, pagination controls
- `keepPreviousData` / `placeholderData` when the page changes
- Bulk actions (overview) without premature optimization

---

## The Django DRF products contract

[`ProductViewSet`](../../deploy/django/stack/web/api/views.py):

| Query param | Purpose |
|-------------|------------|
| `page` | Page number (PageNumberPagination) |
| `page_size` | Size (if the backend allows it) |
| `search` | Search by `sku`, `title` |
| `ordering` | `price`, `-price`, `created_at`, `title` |
| `category` | category slug (`category__slug`) |
| `is_active` | `true` / `false` |
| `min_price`, `max_price` | price range |

Response:

```json
{
  "count": 142,
  "next": "http://localhost:8092/api/v1/products/?page=2",
  "previous": null,
  "results": [ /* Product[] */ ]
}
```

Categories for the filter dropdown: `GET /api/v1/categories/` — read-only, slug as the value.

---

## URL state — bookmarkable admin

```tsx
// hooks/useProductTableParams.ts
import { useSearchParams } from "react-router-dom";

export type ProductTableParams = {
  page: number;
  q: string;
  category: string;
  ordering: string;
  isActive: "" | "true" | "false";
};

export function useProductTableParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: ProductTableParams = {
    page: Number(searchParams.get("page") || "1") || 1,
    q: searchParams.get("q") ?? "",
    category: searchParams.get("category") ?? "",
    ordering: searchParams.get("ordering") ?? "-created_at",
    isActive: (searchParams.get("is_active") as ProductTableParams["isActive"]) ?? "",
  };

  function patch(partial: Partial<ProductTableParams>) {
    const next = new URLSearchParams(searchParams);
    const merged = { ...params, ...partial };

    next.set("page", String(merged.page));
    merged.q ? next.set("q", merged.q) : next.delete("q");
    merged.category ? next.set("category", merged.category) : next.delete("category");
    next.set("ordering", merged.ordering);
    merged.isActive
      ? next.set("is_active", merged.isActive)
      : next.delete("is_active");

    setSearchParams(next, { replace: true });
  }

  return { params, patch };
}
```

**Rule:** a filter/search change → **reset page to 1**. Otherwise the user ends up on page=5 with a filter showing "0 results".

---

## Query key = table params

```tsx
export const productKeys = {
  all: ["products"] as const,
  list: (params: ProductTableParams) => ["products", "list", params] as const,
};

function useProductsList(params: ProductTableParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => fetchProducts(params, signal),
    placeholderData: keepPreviousData, // v5: import from @tanstack/react-query
  });
}
```

`keepPreviousData` — on a page change we show the old rows + a subtle loading indicator, not a flash of an empty skeleton.

---

## fetchProducts — build the query string

```tsx
// api/products.ts
export async function fetchProducts(
  params: ProductTableParams,
  signal?: AbortSignal,
): Promise<Paginated<Product>> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  if (params.q) qs.set("search", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.ordering) qs.set("ordering", params.ordering);
  if (params.isActive) qs.set("is_active", params.isActive);

  return api<Paginated<Product>>(`/api/v1/products/?${qs}`, { signal });
}
```

Typed `Paginated<T>` from [05-pagination-filters.md](05-pagination-filters.md).

---

## UI: FilterBar

```tsx
function ProductFilterBar({
  params,
  categories,
  onChange,
}: {
  params: ProductTableParams;
  categories: Category[];
  onChange: (p: Partial<ProductTableParams>) => void;
}) {
  const debouncedQ = useDebouncedValue(params.q, 300);

  useEffect(() => {
    if (debouncedQ !== params.q) return; // avoid loop on mount
    onChange({ q: debouncedQ, page: 1 });
  }, [debouncedQ]); // eslint — controlled debounce pattern

  return (
    <div className="filter-bar" role="search">
      <input
        type="search"
        placeholder="SKU or title…"
        defaultValue={params.q}
        onChange={(e) => onChange({ q: e.target.value, page: 1 })}
        aria-label="Search products"
      />
      <select
        value={params.category}
        onChange={(e) => onChange({ category: e.target.value, page: 1 })}
        aria-label="Category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={params.isActive}
        onChange={(e) =>
          onChange({
            isActive: e.target.value as ProductTableParams["isActive"],
            page: 1,
          })
        }
      >
        <option value="">Any status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </div>
  );
}
```

Debounced search — [react-basic/useDebouncedValue](../react-basic/28-custom-hooks.md); don't DDOS the API on every character.

---

## UI: Sortable header

```tsx
type SortField = "title" | "price" | "created_at";

function SortHeader({
  field,
  label,
  ordering,
  onSort,
}: {
  field: SortField;
  label: string;
  ordering: string;
  onSort: (ordering: string) => void;
}) {
  const active = ordering === field || ordering === `-${field}`;
  const desc = ordering === `-${field}`;

  function toggle() {
    if (!active) onSort(field);
    else onSort(desc ? field : `-${field}`);
  }

  return (
    <th scope="col" aria-sort={active ? (desc ? "descending" : "ascending") : "none"}>
      <button type="button" onClick={toggle} className="sort-btn">
        {label}
        {active && (desc ? " ↓" : " ↑")}
      </button>
    </th>
  );
}
```

DRF: the `-` prefix = descending. `aria-sort` — [34-accessibility.md](34-accessibility.md).

---

## UI: Pagination

```tsx
function Pagination({
  page,
  count,
  pageSize,
  onPageChange,
}: {
  page: number;
  count: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <nav aria-label="Product pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span>
        Page {page} of {totalPages} ({count} total)
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
```

`pageSize` — from the response (`results.length`) or the fixed backend default (often 20). Extension: a page-size selector if the API supports it.

---

## ProductsTablePage — putting it together

```tsx
export function ProductsTablePage() {
  const { params, patch } = useProductTableParams();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data, isPending, isError, error, refetch, isFetching } =
    useProductsList(params);

  if (isPending) return <TableSkeleton rows={10} />;
  if (isError) return <ErrorPanel error={error} onRetry={refetch} />;
  if (!data.results.length)
    return (
      <>
        <ProductFilterBar ... />
        <EmptyState title="No products found" />
      </>
    );

  return (
    <>
      <ProductFilterBar params={params} categories={categories} onChange={patch} />
      {isFetching && <span aria-live="polite">Updating…</span>}
      <table>
        <thead>...</thead>
        <tbody>
          {data.results.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </tbody>
      </table>
      <Pagination
        page={params.page}
        count={data.count}
        pageSize={data.results.length}
        onPageChange={(page) => patch({ page })}
      />
    </>
  );
}
```

---

## Bulk actions (overview)

Checkbox column + "Deactivate selected" — the pattern:

1. A local `Set<number>` of selected ids (UI state, not Query).
2. Confirm modal.
3. `Promise.all` or a batch endpoint (if one exists).
4. `invalidateQueries` + clear the selection.

Don't do bulk in the first lab iteration — get stable single-row CRUD first ([31-lab-crud.md](31-lab-crud.md)).

---

## Lab (short version)

1. `ProductsTablePage` with URL params.
2. Sort by price/title/created_at.
3. Filters: search, category, is_active.
4. Pagination with `keepPreviousData`.
5. Row actions: Edit link, Delete (confirm).

**Success criterion:** the URL `?category=peripherals&ordering=-price&page=2` reproduces the state after a refresh.

---

## Common mistakes

1. **Client-side filter on paginated data** — you only see the 20 rows of the current page.

2. **Query key without params** — stale cache when the filter changes.

3. **Not resetting the page** on a new search — an empty table looks like a "bug".

4. **Index as key** in rows — always `product.id`.

5. **A skeleton on every isFetching** — annoying; a subtle indicator is enough with `keepPreviousData`.

6. **Hardcoded page size** that doesn't match the backend — wrong total pages.

---

## Checklist

- [ ] Table state in the URL (page, q, category, ordering, is_active)
- [ ] queryKey includes all params
- [ ] DRF query param names (`search`, not `q` on the wire)
- [ ] Sort toggle with the `-` prefix
- [ ] Pagination from `count` + page size
- [ ] Loading / error / empty clearly separated
- [ ] `aria-sort`, `aria-label` on controls

---

[← 28-forms-rhf](28-forms-rhf.md) · [30-optimistic-advanced →](30-optimistic-advanced.md)
