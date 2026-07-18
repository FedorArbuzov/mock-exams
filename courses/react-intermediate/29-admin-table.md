# 29. Admin table: sort, filter, pagination

## Сценарий с работы

Support-менеджер жалуется: «В admin SPA 800 товаров, страница висит 4 секунды». Вы открываете DevTools — один giant `map` без пагинации, фильтр по категории client-side на полном массиве. Backend уже отдаёт DRF pagination (`count`, `next`, `previous`, `results`) и query params `?category=peripherals&ordering=-price&search=keyboard` — но UI их игнорирует.

Задача главы: **синхронизировать** admin table с REST-контрактом Django `:8092`, URL state для shareable ссылок и предсказуемый UX loading/error/empty.

## Что вы узнаете

- DRF pagination + filters + ordering — как читать контракт
- URL как source of truth для table state (`useSearchParams`)
- Компоненты: header sort, filter bar, pagination controls
- `keepPreviousData` / `placeholderData` при смене страницы
- Bulk actions (обзор) без premature optimization

---

## Контракт Django DRF products

[`ProductViewSet`](../../deploy/django/stack/web/api/views.py):

| Query param | Назначение |
|-------------|------------|
| `page` | Номер страницы (PageNumberPagination) |
| `page_size` | Размер (если разрешён backend) |
| `search` | Поиск по `sku`, `title` |
| `ordering` | `price`, `-price`, `created_at`, `title` |
| `category` | slug категории (`category__slug`) |
| `is_active` | `true` / `false` |
| `min_price`, `max_price` | диапазон цены |

Ответ:

```json
{
  "count": 142,
  "next": "http://localhost:8092/api/v1/products/?page=2",
  "previous": null,
  "results": [ /* Product[] */ ]
}
```

Categories для filter dropdown: `GET /api/v1/categories/` — read-only, slug как value.

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

**Правило:** смена filter/search → **сброс page на 1**. Иначе пользователь на page=5 с фильтром «0 results».

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

`keepPreviousData` — при смене page показываем старые rows + subtle loading indicator, не flash empty skeleton.

---

## fetchProducts — build query string

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

Typed `Paginated<T>` из [05-pagination-filters.md](05-pagination-filters.md).

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
        placeholder="SKU или название…"
        defaultValue={params.q}
        onChange={(e) => onChange({ q: e.target.value, page: 1 })}
        aria-label="Поиск товаров"
      />
      <select
        value={params.category}
        onChange={(e) => onChange({ category: e.target.value, page: 1 })}
        aria-label="Категория"
      >
        <option value="">Все категории</option>
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
        <option value="">Любой статус</option>
        <option value="true">Активные</option>
        <option value="false">Неактивные</option>
      </select>
    </div>
  );
}
```

Debounced search — [react-basic/useDebouncedValue](../react-basic/28-custom-hooks.md); не DDOS-ите API на каждый символ.

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

DRF: `-` prefix = descending. `aria-sort` — [34-accessibility.md](34-accessibility.md).

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
    <nav aria-label="Пагинация товаров">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Назад
      </button>
      <span>
        Страница {page} из {totalPages} ({count} всего)
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Вперёд
      </button>
    </nav>
  );
}
```

`pageSize` — из ответа (`results.length`) или фиксированный default backend (часто 20). Extension: selector page size если API поддерживает.

---

## ProductsTablePage — сборка

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
        <EmptyState title="Товары не найдены" />
      </>
    );

  return (
    <>
      <ProductFilterBar params={params} categories={categories} onChange={patch} />
      {isFetching && <span aria-live="polite">Обновление…</span>}
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

## Bulk actions (обзор)

Checkbox column + «Deactivate selected» — pattern:

1. Local `Set<number>` selected ids (UI state, не Query).
2. Confirm modal.
3. `Promise.all` или batch endpoint (если есть).
4. `invalidateQueries` + clear selection.

Не делайте bulk в первой итерации lab — сначала stable single-row CRUD ([31-lab-crud.md](31-lab-crud.md)).

---

## Лаба (кратко)

1. `ProductsTablePage` с URL params.
2. Sort по price/title/created_at.
3. Filters: search, category, is_active.
4. Pagination с `keepPreviousData`.
5. Row actions: Edit link, Delete (confirm).

**Критерий:** URL `?category=peripherals&ordering=-price&page=2` воспроизводит состояние после refresh.

---

## Типичные ошибки

1. **Client-side filter на paginated data** — видите только 20 строк текущей page.

2. **Query key без params** — stale cache при смене filter.

3. **Не сбрасываете page** при новом search — пустая table «баг».

4. **Index as key** в rows — всегда `product.id`.

5. **Skeleton на каждый isFetching** — раздражает; subtle indicator достаточно с `keepPreviousData`.

6. **Hardcode page size** не совпадает с backend — wrong total pages.

---

## Чек-лист

- [ ] Table state в URL (page, q, category, ordering, is_active)
- [ ] queryKey включает все params
- [ ] DRF query param names (`search`, not `q` на wire)
- [ ] Sort toggle с `-` prefix
- [ ] Pagination из `count` + page size
- [ ] Loading / error / empty явно разделены
- [ ] `aria-sort`, `aria-label` на controls

---

[← 28-forms-rhf](28-forms-rhf.md) · [30-optimistic-advanced →](30-optimistic-advanced.md)
