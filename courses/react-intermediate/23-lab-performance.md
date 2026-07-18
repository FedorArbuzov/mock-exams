# 23. Лаба: оптимизация каталога

## Сценарий

Ticket **PERF-102**: «Products admin: slow filter, fat initial bundle». Объедините [18-rerender-model.md](18-rerender-model.md)–[22-suspense-data.md](22-suspense-data.md) в [`examples/`](examples/src/): virtual table, memo rows, lazy routes, optional `useSuspenseQuery`, Profiler до/after.

**Время:** ~60–75 минут. Django `:8092` или MSW ([27-lab-msw.md](27-lab-msw.md)) — нужен список ≥500 products для эффекта (можно mock array).

---

## Подготовка

```bash
cd courses/react-intermediate/examples
npm install
npm run dev
```

Сгенерируйте mock data (если API маленький):

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

## Задание 1. Baseline Profiler

1. Откройте React DevTools Profiler ([18-rerender-model.md](18-rerender-model.md)).
2. Страница `/products` — naïve `<table>` со всеми rows.
3. Record: 10 символов в filter input.
4. Сохраните скрин: total render time, количество `ProductRow` renders.

**Критерий:** зафиксирован baseline (число ms в PR description).

---

## Задание 2. Virtual table

Реализуйте `VirtualProductsTable` по [20-virtualization.md](20-virtualization.md):

- Scroll container height 480px
- `estimateSize: 48`, overscan 8
- Keys = `product.id`

Подключите к `ProductsListPage` с filter + `useMemo` filtered rows ([19-memo-patterns.md](19-memo-patterns.md)).

**Критерий:** DOM `<tr>` ≈ 20–30, не 2000; scroll плавный.

---

## Задание 3. Memo row + useCallback

```tsx
export const ProductRow = memo(function ProductRow({ ... }) { ... });
```

Parent: stable `handleEdit`, `handleToggle` via `useCallback`.

Profiler повтор — filter keystroke.

**Критерий:** row renders << baseline (document % in PR).

---

## Задание 4. Lazy routes

По [21-code-splitting.md](21-code-splitting.md):

| Route | Lazy |
|-------|------|
| `/products` | `ProductsListPage` |
| `/products/:id` | `ProductDetailPage` |
| `/settings` | stub |

Login **не** lazy.

`Suspense` + `PageSkeleton`. Preload detail chunk on row `onMouseEnter`.

```bash
npm run build
```

**Критерий:** отдельные chunks в `dist/assets/`; login path не тянет settings chunk.

---

## Задание 5. (Optional) useSuspenseQuery

Замените list fetch на `useSuspenseQuery` ([22-suspense-data.md](22-suspense-data.md)):

- `TableSkeleton` в Suspense
- `QueryErrorResetBoundary` + ErrorBoundary stack из [17-lab-errors.md](17-lab-errors.md)

**Критерий:** нет `if (isPending)` в table component.

---

## Задание 6. Filter state scope

Убедитесь filter state **не** в AuthContext ([18-rerender-model.md](18-rerender-model.md)). Sidebar не re-render на keystroke (Profiler: Sidebar absent or 0ms).

---

## Задание 7. Build metrics

Запишите в `PERF-102.md` (или PR):

| Metric | Before | After |
|--------|--------|-------|
| Profiler filter interaction | ? ms | ? ms |
| DOM rows | ~N | ~25 |
| Main chunk size (build) | ? KB | ? KB |

---

## Структура файлов (ориентир)

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

## Самопроверка

- [ ] Filter не лагает на 2000 rows
- [ ] Virtual scroll без белых дыр (overscan)
- [ ] Lazy settings не в login bundle
- [ ] Error/loading UX не regressed ([16-global-error-ux.md](16-global-error-ux.md))
- [ ] Preview build (`npm run preview`) — perf ближе к prod

---

## Подсказки

- Table virtual + `<table>` tricky — div grid OK ([20-virtualization.md](20-virtualization.md)).
- Memo без virtualization на 2000 rows — недостаточно.
- `StrictMode` — не сравнивайте dev absolute ms с prod.

---

## Типичные ошибки

**Virtual без fixed height container.**

**Lazy every component** — слишком много chunks.

**useSuspenseQuery без boundary** — white screen on 500.

**Filter in page lifting re-render sidebar.**

**Forgot build step** — только dev judgment.

---

## Чек-лист

- [ ] Baseline + after Profiler numbers
- [ ] `@tanstack/react-virtual` integrated
- [ ] memo + useCallback on rows
- [ ] Route lazy + skeleton
- [ ] State scope verified

---

## Далее

Фаза 6 — MSW. Следующий урок: [24. MSW: зачем мокать API](24-msw-intro.md).
