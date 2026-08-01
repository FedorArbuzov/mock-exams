# 20. Virtualizing long lists

## A story from work

After an import, DRF `/api/v1/products/` has **12,000** SKUs. The admin table renders every `<tr>`: 4s initial load, janky scroll, and DevTools shows 12k DOM nodes. Server pagination ([05-pagination-filters.md](05-pagination-filters.md)) is the correct long-term fix, but the UX calls for "infinite scroll within a filter change" on a single preview page. The tech lead: "Client-side window + **virtualization**; `@tanstack/react-virtual` is already in [`package.json`](examples/package.json)."

Memo rows ([19-memo-patterns.md](19-memo-patterns.md)) without virtualization still create 12k vnodes. Virtualization keeps **~20** visible rows in the DOM.

## What you'll learn

- Windowing / virtualization — the idea
- `@tanstack/react-virtual`: `useVirtualizer`
- Fixed vs dynamic row height
- Scroll container, overscan, accessibility
- Combining with server pagination and filters
- Pitfalls in admin tables

---

## The idea of virtualization

```text
Full list: 12,000 items (in JS memory)
DOM: only items 200–220 (visible area + overscan)

scrollTop changes → the virtualizer recomputes the offset → renders a new slice
```

Few React components in the tree; a light DOM; smooth scroll.

---

## Basic example: products table

```tsx
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

type Product = {
  id: number;
  sku: string;
  title: string;
  price: string;
};

export function VirtualProductsTable({ rows }: { rows: Product[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 8,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="table-scroll"
      style={{ height: 480, overflow: "auto" }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Title</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {items.map((virtualRow) => {
            const product = rows[virtualRow.index];
            return (
              <tr
                key={product.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  display: "table",
                  tableLayout: "fixed",
                }}
              >
                <td>{product.sku}</td>
                <td>{product.title}</td>
                <td>{product.price}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**`estimateSize`** — the initial row height; **`measureElement`** refines it for dynamic height.

**`overscan: 8`** — renders 8 rows beyond the viewport for smooth fast scrolling.

---

## Scroll parent

The virtualizer **must** know the scroll container:

```tsx
getScrollElement: () => parentRef.current,
```

A common mistake — scrolling on `window`, but the ref is on an inner div. In an admin layout, scrolling is often in the content pane:

```tsx
// AdminLayout content area
<main ref={scrollRef} className="admin-content">
  <VirtualProductsTable rows={rows} scrollRef={scrollRef} />
</main>
```

Pass a `scrollRef` prop instead of nested overflow.

---

## Fixed height rows (admin default)

For uniform table rows, set CSS:

```css
.table-scroll tbody tr {
  height: 48px;
}
```

Then you can go **without** `measureElement`:

```tsx
const virtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 48,
});
```

Simpler and faster. Dynamic height — for a multiline description ([29-admin-table.md](29-admin-table.md)).

---

## Integration with Query + filter

```tsx
function ProductsCatalog() {
  const { data } = useProducts(); // [07-lab-django-products.md](07-lab-django-products.md)
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const list = data?.results ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.sku.toLowerCase().includes(q));
  }, [data?.results, filter]);

  return (
    <>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      <VirtualProductsTable rows={rows} />
    </>
  );
}
```

A filter changes `count` — should the virtualizer reset scroll? Optionally:

```tsx
useEffect(() => {
  virtualizer.scrollToIndex(0);
}, [filter]);
```

---

## Infinite query + virtual (preview)

[06-query-advanced.md](06-query-advanced.md) `useInfiniteQuery`: on scroll near the end, `fetchNextPage`. Virtualizer:

```tsx
const rowCount = hasNextPage ? allRows.length + 1 : allRows.length;

// last row — loader skeleton
if (virtualRow.index >= allRows.length) {
  return <LoadingRow />;
}
```

The [23-lab-performance.md](23-lab-performance.md) lab can combine these.

---

## Accessibility

- Scroll container: `role="region"`, `aria-label="Product catalog"`.
- Keyboard: focus on row buttons — on virtual mount/unmount focus can be lost; prefer **row actions** via a stable id or a roving-tabindex pattern.
- Screen readers: not all 12,000 rows are in the DOM — announce "Showing N of M, scroll for the rest" (`aria-live` when the filter count changes).

Full a11y table — [34-accessibility.md](34-accessibility.md).

---

## vs server pagination

| | Server pagination | Client virtual |
|---|-------------------|----------------|
| DOM | little | little |
| JS memory | little | all loaded pages in memory |
| SEO/admin | REST standard | OK for admin |
| DRF | `?page=` | load all or infinite |

Best: **server page 100 + virtual inside the page** or infinite fetch + virtual. Don't pull 12k without need — agree it with the backend ([api-design](../api-design/README.md)).

---

## Performance notes

- Virtual + `memo` row ([19-memo-patterns.md](19-memo-patterns.md)) — a good pair.
- Avoid inline `style={{ transform: ... }}` as a **new object** if profiling says so — often fine.
- `React.StrictMode` — double measure in dev; ignore duplicate measure logs.

---

## Common mistakes

**Virtualize without a fixed scroll height.** `height: auto` on the container — the virtualizer doesn't know the viewport.

**`key={index}` on sort/filter.** Use `product.id`.

**Duplicating thead in every virtual row.** Keep the header outside the tbody window.

**A 12k fetch in one request.** Timeout on Django — pagination API first.

**Forgot overscan.** Fast scroll shows white bands.

**Broken table layout.** `display: table` on an absolute tr — hacky; alternative: a div-based grid table (often simpler for virtual).

---

## Div-based grid (alternative)

```tsx
<div className="grid-table">
  <div className="grid-header">...</div>
  <div ref={parentRef} className="grid-body">
    <div style={{ height: virtualizer.getTotalSize() }}>
      {items.map((v) => (
        <div
          key={rows[v.index].id}
          className="grid-row"
          style={{ transform: `translateY(${v.start}px)` }}
        >
          ...
        </div>
      ))}
    </div>
  </div>
</div>
```

Many admin UI kits go this route.

---

## Checklist

- [ ] What overscan is and why
- [ ] `getScrollElement` vs window scroll
- [ ] Fixed vs dynamic row measurement
- [ ] When server pagination beats virtual
- [ ] a11y limitations of virtual lists

---

## Next

Next lesson: [21. Code splitting: lazy, Suspense, preload](21-code-splitting.md).
