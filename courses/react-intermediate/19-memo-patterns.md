# 19. `memo`, `useMemo`, `useCallback` без фанатизма

## Сценарий с работы

После [18-rerender-model.md](18-rerender-model.md) Profiler показал: `ProductRow` рендерится 800 раз на один keystroke в фильтре — parent re-render + unstable `onEdit` callback. Вы добавили `React.memo` на row и `useCallback` на handler — стало 800 → **12** skip. Коллега увидел diff и обернул **ещё** `Sidebar`, `Header`, формы в memo «на будущее». Bundle сложнее, deps врут, через месяц баг: stale `shopId` в callback с `[]` deps.

Эта глава — **системный** подход к мемоизации в admin SPA, продолжение [react-basic: useRef, useMemo, useCallback](../react-basic/27-ref-memo-callback.md) без cult of performance.

## Что вы узнаете

- Когда `React.memo` реально помогает
- `useCallback` / `useMemo` как пара к memo и stable deps
- Антипаттерны из code review admin projects
- Взаимодействие с TanStack Query ([06-query-advanced.md](06-query-advanced.md))
- Компромисс читаемость vs perf
- Подготовка к [20-virtualization.md](20-virtualization.md)

---

## React.memo: shallow compare props

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

React сравнивает **старые и новые props** shallow. Если `product` и `onEdit` те же ссылки — skip render.

**Не помогает**, если:
- props меняются каждый раз (новый `product` object из map без stable data);
- `onEdit` inline `() => ...` без useCallback;
- children `children={<Expensive />}` создаётся в parent каждый render.

---

## useCallback для stable handlers

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

`navigate` из React Router 7 стабилен — deps `[navigate]` OK.

### Mutation callback

```tsx
const deleteMutation = useDeleteProduct();

const handleDelete = useCallback(
  (id: number) => {
    deleteMutation.mutate(id);
  },
  [deleteMutation.mutate], // prefer mutate, not whole mutation object
);
```

TanStack Query v5: `mutate` стабилен; не кладите весь `deleteMutation` в deps без нужды.

---

## useMemo для derived data

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

**`rows`** от Query: structural sharing — ссылка стабильна между refetch с тем же data.

Для sort:

```tsx
const sorted = useMemo(
  () => [...filtered].sort((a, b) => a.sku.localeCompare(b.sku)),
  [filtered],
);
```

Без useMemo `[...filtered].sort()` — новый массив → все memo rows re-render.

---

## Когда НЕ memo

| Ситуация | Рекомендация |
|----------|--------------|
| < 100 простых rows | memo optional |
| Дешёвый leaf (icon, badge) | skip memo |
| props всегда новые | fix data, не memo |
| «На всякий случай» | удалить |
| Server pagination 25 rows/page | memo избыточен |

Из [18-rerender-model.md](18-rerender-model.md): 5000 rows → **virtualization first**, memo на row second.

---

## custom compare (редко)

```tsx
export const ProductRow = memo(ProductRowInner, (prev, next) => {
  return (
    prev.product.id === next.product.id &&
    prev.product.title === next.product.title &&
    prev.onEdit === next.onEdit
  );
});
```

Используйте только если Profiler доказал: shallow compare fail из-за лишних полей в object, а передавать slim DTO неудобно. Иначе — передавайте `{ id, sku, title }` pick.

---

## Context + memo

Memo child **всё равно** re-render если читает context, который изменился:

```tsx
function Sidebar() {
  const { user } = useAuth(); // re-render on any auth context change
  return <nav>...</nav>;
}
```

`memo(Sidebar)` не спасёт от context. Split contexts ([10-auth-context.md](10-auth-context.md)) или selectors (Zustand [33-zustand-ui.md](33-zustand-ui.md)).

---

## Lists and keys

Из [react-basic: lists](../react-basic/07-lists-keys.md):

```tsx
{rows.map((p) => (
  <ProductRow key={p.id} product={p} onEdit={handleEdit} />
))}
```

**Index key** + reorder → wrong row state + memo useless.

---

## Query: не дублируйте cache в useMemo

```tsx
// Избыточно
const products = useMemo(() => data?.results ?? [], [data?.results]);
```

`data.results` уже stable reference от Query. useMemo добавляет шум.

Имеет смысл useMemo для **тяжёлой** трансформации `results` → tree/group by category.

---

## Компоненты с children

```tsx
function Layout({ children }: { children: React.ReactNode }) {
  return <div className="layout">{children}</div>;
}

// Parent
<Layout>
  <ProductsTable rows={rows} />  {/* children новый object каждый render Layout parent */}
</Layout>
```

`memo(Layout)` skip если `children` prop та же ссылка — но parent **создаёт** новый element tree → Layout re-render. Pattern: outlet pattern / composition ([react-basic: children](../react-basic/05-children-composition.md)).

---

## Практический workflow code review

1. Profiler доказал bottleneck?
2. Можно поднять/опустить state ([18-rerender-model.md](18-rerender-model.md))?
3. Virtualization нужна ([20-virtualization.md](20-virtualization.md))?
4. Только тогда memo row + useCallback handler + useMemo filter.
5. ESLint `exhaustive-deps` зелёный.
6. Preview build — повторный Profiler.

---

## Пример: admin table row

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

Parent передаёт **примитивы** + stable callback — идеал для memo.

---

## Типичные ошибки

**memo на parent table без memo rows.** Parent всё равно строит 5000 children.

**useCallback с missing deps.** Stale closure на `productId` в modal.

**useMemo для inline style object.** `{ color: 'red' }` — если не передаётся в memo child, не нужен.

**«React Compiler решит».** На 2025 не везде включён; понимайте модель вручную.

**Оптимизация error fallbacks.** Держите простыми ([14-error-boundaries.md](14-error-boundaries.md)).

---

## Чек-лист

- [ ] Условия bail out для `React.memo`
- [ ] Зачем `useCallback` с memo row
- [ ] Когда useMemo для filter/sort обязателен
- [ ] Почему memo не помогает против context
- [ ] Порядок: virtualization vs memo

---

## Далее

Следующий урок: [20. Виртуализация длинных списков](20-virtualization.md) — `@tanstack/react-virtual` для каталога Django.
