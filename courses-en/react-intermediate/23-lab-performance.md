# 23. Lab: catalog optimization

## Scenario

Ticket **PERF-102**: "Products admin: slow filter, fat initial bundle". Combine [18-rerender-model.md](18-rerender-model.md)–[22-suspense-data.md](22-suspense-data.md) in [`examples/`](examples/src/): virtual table, memo rows, lazy routes, optional `useSuspenseQuery`, Profiler before/after.

**Time:** ~60–75 minutes. Django `:8092` or MSW ([27-lab-msw.md](27-lab-msw.md)) — you need a list of ≥500 products for the effect (a mock array works).

---

## Setup

```bash
cd courses/react-intermediate/examples
npm install
npm run dev
```

Generate mock data (if the API is small):

```tsx
// src/features/products/mockLargeCatalog.ts
export function buildMockProducts(count = 2000) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    sku: `SKU-${String(i + 1).padStart(5, "0")}`,
    title: `Product ${i + 1}`,
    price: (9.99 + (i % 50)).toFixed(2),
    is_active: i % 3 !== 0,
    category: { slug: "misc", name: "Misc" },
  }));
}
```

---

## Task 1. Baseline Profiler

1. Open the React DevTools Profiler ([18-rerender-model.md](18-rerender-model.md)).
2. The `/products` page — a naïve `<table>` with all rows.
3. Record: 10 characters typed in the filter input.
4. Save a screenshot: total render time, number of `ProductRow` renders.

**Success criterion:** a baseline is captured (the ms number in the PR description).

---

## Task 2. Virtual table

Implement `VirtualProductsTable` per [20-virtualization.md](20-virtualization.md):

- Scroll container height 480px
- `estimateSize: 48`, overscan 8
- Keys = `product.id`

Wire it into `ProductsListPage` with filter + `useMemo` filtered rows ([19-memo-patterns.md](19-memo-patterns.md)).

**Success criterion:** DOM `<tr>` ≈ 20–30, not 2000; scroll is smooth.

---

## Task 3. Memo row + useCallback

```tsx
export const ProductRow = memo(function ProductRow({ ... }) { ... });
```

Parent: stable `handleEdit`, `handleToggle` via `useCallback`.

Repeat the Profiler — filter keystroke.

**Success criterion:** row renders << baseline (document the % in the PR).

---

## Task 4. Lazy routes

Per [21-code-splitting.md](21-code-splitting.md):

| Route | Lazy |
|-------|------|
| `/products` | `ProductsListPage` |
| `/products/:id` | `ProductDetailPage` |
| `/settings` | stub |

Login is **not** lazy.

`Suspense` + `PageSkeleton`. Preload the detail chunk on row `onMouseEnter`.

```bash
npm run build
```

**Success criterion:** separate chunks in `dist/assets/`; the login path doesn't pull the settings chunk.

---

## Task 5. (Optional) useSuspenseQuery

Replace the list fetch with `useSuspenseQuery` ([22-suspense-data.md](22-suspense-data.md)):

- `TableSkeleton` in Suspense
- `QueryErrorResetBoundary` + ErrorBoundary stack from [17-lab-errors.md](17-lab-errors.md)

**Success criterion:** no `if (isPending)` in the table component.

---

## Task 6. Filter state scope

Make sure filter state is **not** in AuthContext ([18-rerender-model.md](18-rerender-model.md)). The sidebar doesn't re-render on a keystroke (Profiler: Sidebar absent or 0ms).

---

## Task 7. Build metrics

Record in `PERF-102.md` (or the PR):

| Metric | Before | After |
|--------|--------|-------|
| Profiler filter interaction | ? ms | ? ms |
| DOM rows | ~N | ~25 |
| Main chunk size (build) | ? KB | ? KB |

---

## File structure (guideline)

```text
src/features/products/
  ProductsListPage.tsx
  ProductDetailPage.tsx
  VirtualProductsTable.tsx
  ProductRow.tsx
  useProducts.ts
  mockLargeCatalog.ts
src/app/router.tsx
src/shared/ui/PageSkeleton.tsx
src/shared/ui/TableSkeleton.tsx
```

---

## Self-check

- [ ] Filter doesn't lag on 2000 rows
- [ ] Virtual scroll with no white gaps (overscan)
- [ ] Lazy settings not in the login bundle
- [ ] Error/loading UX not regressed ([16-global-error-ux.md](16-global-error-ux.md))
- [ ] Preview build (`npm run preview`) — perf closer to prod

---

## Hints

- Table virtual + `<table>` is tricky — a div grid is OK ([20-virtualization.md](20-virtualization.md)).
- Memo without virtualization on 2000 rows — not enough.
- `StrictMode` — don't compare dev absolute ms with prod.

---

## Common mistakes

**Virtual without a fixed-height container.**

**Lazy every component** — too many chunks.

**useSuspenseQuery without a boundary** — white screen on 500.

**Filter in the page lifting a re-render of the sidebar.**

**Forgot the build step** — dev judgment only.

---

## Checklist

- [ ] Baseline + after Profiler numbers
- [ ] `@tanstack/react-virtual` integrated
- [ ] memo + useCallback on rows
- [ ] Route lazy + skeleton
- [ ] State scope verified

---

## Next

Phase 6 — MSW. Next lesson: [24. MSW: why mock the API](24-msw-intro.md).
