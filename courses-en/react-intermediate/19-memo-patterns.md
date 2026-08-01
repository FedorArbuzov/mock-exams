# 19. `memo`, `useMemo`, `useCallback` without the cult

## Scenario from work

After [18-rerender-model.md](18-rerender-model.md), the Profiler showed: `ProductRow` re-renders 800 times on a single filter keystroke — parent re-render plus an unstable `onEdit` callback. You added `React.memo` to the row and `useCallback` to the handler — 800 dropped to **12** skipped renders. A colleague saw the diff and wrapped **more** components — `Sidebar`, `Header`, forms — in memo "for the future." The bundle got more complex, deps started lying, and a month later there's a bug: a stale `shopId` in a callback with `[]` deps.

This chapter is a **systematic** approach to memoization in an admin SPA, continuing from [react-basic: useRef, useMemo, useCallback](../react-basic/27-ref-memo-callback.md) without the performance cult mindset.

## What you'll learn

- When `React.memo` actually helps
- `useCallback` / `useMemo` as memo's companions and stable deps
- Antipatterns from admin project code reviews
- Interaction with TanStack Query ([06-query-advanced.md](06-query-advanced.md))
- The readability vs. performance tradeoff
- Groundwork for [20-virtualization.md](20-virtualization.md)

---

## React.memo: shallow prop comparison

```tsx
import { memo } from "react";

type ProductRowProps = {
  product: { id: number; sku: string; title: string };
  onEdit: (id: number) => void;
};

export const ProductRow = memo(function ProductRow({
  product,
  onEdit,
}: ProductRowProps) {
  return (
    <tr>
      <td>{product.sku}</td>
      <td>{product.title}</td>
      <td>
        <button type="button" onClick={() => onEdit(product.id)}>
          Edit
        </button>
      </td>
    </tr>
  );
});
```

React compares **old and new props** shallowly. If `product` and `onEdit` are the same references, it skips the render.

**It doesn't help** when:
- props change every time (a new `product` object from a `map` without stable data);
- `onEdit` is an inline `() => ...` without useCallback;
- `children={<Expensive />}` is created fresh in the parent on every render.

---

## useCallback for stable handlers

```tsx
function ProductsTable({ rows }: { rows: Product[] }) {
  const navigate = useNavigate();

  const handleEdit = useCallback(
    (id: number) => {
      navigate(`/products/${id}`);
    },
    [navigate],
  );

  return (
    <tbody>
      {rows.map((product) => (
        <ProductRow key={product.id} product={product} onEdit={handleEdit} />
      ))}
    </tbody>
  );
}
```

`navigate` from React Router 7 is stable — `[navigate]` as a dep is fine.

### Mutation callback

```tsx
const deleteMutation = useDeleteProduct();

const handleDelete = useCallback(
  (id: number) => {
    deleteMutation.mutate(id);
  },
  [deleteMutation.mutate], // prefer mutate, not the whole mutation object
);
```

TanStack Query v5: `mutate` is stable; don't put the whole `deleteMutation` object in deps unless you need to.

---

## useMemo for derived data

```tsx
function ProductsTable({ rows, filter }: { rows: Product[]; filter: string }) {
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q),
    );
  }, [rows, filter]);

  // ...
}
```

**`rows`** from Query: structural sharing keeps the reference stable across refetches with the same data.

For sorting:

```tsx
const sorted = useMemo(
  () => [...filtered].sort((a, b) => a.sku.localeCompare(b.sku)),
  [filtered],
);
```

Without useMemo, `[...filtered].sort()` produces a new array → every memoized row re-renders.

---

## When NOT to memo

| Situation | Recommendation |
|----------|--------------|
| < 100 simple rows | memo is optional |
| Cheap leaf (icon, badge) | skip memo |
| Props are always new | fix the data, not memo |
| "Just in case" | remove it |
| Server pagination, 25 rows/page | memo is overkill |

From [18-rerender-model.md](18-rerender-model.md): 5000 rows → **virtualization first**, memoizing the row second.

---

## Custom compare (rare)

```tsx
export const ProductRow = memo(ProductRowInner, (prev, next) => {
  return (
    prev.product.id === next.product.id &&
    prev.product.title === next.product.title &&
    prev.onEdit === next.onEdit
  );
});
```

Only use this once the Profiler has proven that shallow compare fails because of extra fields on the object, and passing a slim DTO isn't practical. Otherwise, just pass a `{ id, sku, title }` pick.

---

## Context + memo

A memoized child **still** re-renders if it reads a context that changed:

```tsx
function Sidebar() {
  const { user } = useAuth(); // re-renders on any auth context change
  return <nav>...</nav>;
}
```

`memo(Sidebar)` won't save you from context. Split the contexts ([10-auth-context.md](10-auth-context.md)) or use selectors (Zustand [33-zustand-ui.md](33-zustand-ui.md)).

---

## Lists and keys

From [react-basic: lists](../react-basic/07-lists-keys.md):

```tsx
{rows.map((p) => (
  <ProductRow key={p.id} product={p} onEdit={handleEdit} />
))}
```

**Index-based keys** plus reordering → wrong row state and memo becomes useless.

---

## Query: don't duplicate the cache in useMemo

```tsx
// Redundant
const products = useMemo(() => data?.results ?? [], [data?.results]);
```

`data.results` is already a stable reference from Query. Wrapping it in useMemo just adds noise.

useMemo is worth it for a **heavy** transformation of `results` — e.g. building a tree or grouping by category.

---

## Components with children

```tsx
function Layout({ children }: { children: React.ReactNode }) {
  return <div className="layout">{children}</div>;
}

// Parent
<Layout>
  <ProductsTable rows={rows} />  {/* children is a new object every time the parent of Layout re-renders */}
</Layout>
```

`memo(Layout)` skips only if the `children` prop is the same reference — but the parent **creates** a new element tree, so Layout re-renders anyway. Pattern: outlet pattern / composition ([react-basic: children](../react-basic/05-children-composition.md)).

---

## Practical code review workflow

1. Has the Profiler proven a bottleneck?
2. Can state be lifted up or pushed down ([18-rerender-model.md](18-rerender-model.md))?
3. Is virtualization needed ([20-virtualization.md](20-virtualization.md))?
4. Only then: memoize the row + useCallback the handler + useMemo the filter.
5. ESLint `exhaustive-deps` is clean.
6. Re-profile against a preview build.

---

## Example: admin table row

```tsx
export const AdminProductRow = memo(function AdminProductRow({
  id,
  sku,
  title,
  isActive,
  onToggleActive,
}: {
  id: number;
  sku: string;
  title: string;
  isActive: boolean;
  onToggleActive: (id: number, next: boolean) => void;
}) {
  return (
    <tr>
      <td>{sku}</td>
      <td>{title}</td>
      <td>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onToggleActive(id, e.target.checked)}
          aria-label={`Active ${sku}`}
        />
      </td>
    </tr>
  );
});
```

The parent passes **primitives** plus a stable callback — ideal for memo.

---

## Common mistakes

**Memoizing the parent table without memoizing rows.** The parent still builds 5000 children.

**useCallback with missing deps.** Stale closure over `productId` inside a modal.

**useMemo for an inline style object.** `{ color: 'red' }` — not needed if it isn't passed to a memoized child.

**"The React Compiler will handle it."** As of 2025 it's not enabled everywhere; understand the model manually.

**Optimizing error fallbacks.** Keep those simple ([14-error-boundaries.md](14-error-boundaries.md)).

---

## Checklist

- [ ] Bail-out conditions for `React.memo`
- [ ] Why `useCallback` pairs with a memoized row
- [ ] When useMemo for filter/sort is mandatory
- [ ] Why memo doesn't help against context
- [ ] Order of operations: virtualization vs memo

---

## Next

Next lesson: [20. Virtualizing long lists](20-virtualization.md) — `@tanstack/react-virtual` for the Django catalog.
