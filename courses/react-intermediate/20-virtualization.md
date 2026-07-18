# 20. Виртуализация длинных списков

## Сценарий с работы

DRF `/api/v1/products/` после импорта — **12 000** SKU. Admin table рендерит все `<tr>`: initial load 4s, scroll janky, DevTools показывает 12k DOM nodes. Pagination на сервере ([05-pagination-filters.md](05-pagination-filters.md)) — правильный долгосрочный fix, но UX требует «бесконечный scroll внутри смены фильтра» на одной странице preview. Tech lead: «Client-side window + **virtualization**; `@tanstack/react-virtual` уже в [`package.json`](examples/package.json)».

Memo rows ([19-memo-patterns.md](19-memo-patterns.md)) без virtualization всё равно создаёт 12k vnodes. Virtualization оставляет в DOM **~20** видимых строк.

## Что вы узнаете

- Windowing / virtualization — идея
- `@tanstack/react-virtual`: `useVirtualizer`
- Fixed vs dynamic row height
- Scroll container, overscan, accessibility
- Сочетание с server pagination и filter
- Pitfalls в admin tables

---

## Идея virtualization

```text
Полный список: 12 000 items (в памяти JS)
DOM: только items 200–220 (видимая область + overscan)

scrollTop меняется → virtualizer пересчитывает offset → render новый slice
```

React компонентов в дереве мало; DOM лёгкий; scroll smooth.

---

## Базовый пример: products table

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

**`estimateSize`** — начальная высота строки; **`measureElement`** уточняет для dynamic height.

**`overscan: 8`** — рендерит 8 строк за пределами viewport для плавного fast scroll.

---

## Scroll parent

Virtualizer **обязан** знать scroll container:

```tsx
getScrollElement: () => parentRef.current,
```

Частая ошибка — scroll на `window`, а ref на inner div. Для admin layout scroll часто в content pane:

```tsx
// AdminLayout content area
<main ref={scrollRef} className="admin-content">
  <VirtualProductsTable rows={rows} scrollRef={scrollRef} />
</main>
```

Передайте `scrollRef` prop вместо nested overflow.

---

## Fixed height rows (admin default)

Для uniform table rows задайте CSS:

```css
.table-scroll tbody tr {
  height: 48px;
}
```

Тогда можно **без** `measureElement`:

```tsx
const virtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 48,
});
```

Проще и быстрее. Dynamic height — для multiline description ([29-admin-table.md](29-admin-table.md)).

---

## Интеграция с Query + filter

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

Filter меняет `count` — virtualizer reset scroll? Опционально:

```tsx
useEffect(() => {
  virtualizer.scrollToIndex(0);
}, [filter]);
```

---

## Infinite query + virtual (preview)

[06-query-advanced.md](06-query-advanced.md) `useInfiniteQuery`: при scroll near end `fetchNextPage`. Virtualizer:

```tsx
const rowCount = hasNextPage ? allRows.length + 1 : allRows.length;

// last row — loader skeleton
if (virtualRow.index >= allRows.length) {
  return <LoadingRow />;
}
```

Лаба [23-lab-performance.md](23-lab-performance.md) может комбинировать.

---

## Accessibility

- Scroll container: `role="region"`, `aria-label="Каталог товаров"`.
- Keyboard: focus на row buttons — при virtual mount/unmount focus может теряться; prefer **row actions** через stable id или roving tabindex pattern.
- Screen readers: не все 12000 rows в DOM — объявите «Показано N из M, прокрутите для остальных» (`aria-live` при смене filter count).

Полный a11y table — [34-accessibility.md](34-accessibility.md).

---

## vs server pagination

| | Server pagination | Client virtual |
|---|-------------------|----------------|
| DOM | мало | мало |
| Memory JS | мало | все loaded pages in memory |
| SEO/admin | REST standard | OK for admin |
| DRF | `?page=` | load all or infinite |

Best: **server page 100 + virtual inside page** или infinite fetch + virtual. Не тяните 12k без необходимости — договоритесь с backend ([api-design](../api-design/README.md)).

---

## Performance notes

- Virtual + `memo` row ([19-memo-patterns.md](19-memo-patterns.md)) — хорошая пара.
- Avoid inline `style={{ transform: ... }}` **new object** if profiling says so — often OK.
- `React.StrictMode` — double measure in dev; ignore duplicate measure logs.

---

## Типичные ошибки

**Virtualize без fixed scroll height.** `height: auto` на container — virtualizer не знает viewport.

**`key={index}` при sort/filter.** Используйте `product.id`.

**Дублировать thead в каждой virtual row.** Header вне tbody window.

**12k fetch одним запросом.** Timeout на Django — pagination API first.

**Забыли overscan.** Fast scroll показывает белые полосы.

**Table layout broken.** `display: table` на absolute tr — hacky; alternative: div-based grid table (часто проще для virtual).

---

## Div-based grid (альтератива)

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

Многие admin UI kits идут этим путём.

---

## Чек-лист

- [ ] Что такое overscan и зачем
- [ ] `getScrollElement` vs window scroll
- [ ] Fixed vs dynamic row measurement
- [ ] Когда server pagination лучше virtual
- [ ] a11y ограничения virtual lists

---

## Далее

Следующий урок: [21. Code splitting: lazy, Suspense, preload](21-code-splitting.md).
