# 18. Re-render: mental model и React DevTools

## Сценарий с работы

Ticket **PERF-88**: «Страница products тормозит при вводе в фильтр». Junior добавил `React.memo` на каждый компонент — стало **хуже**. Profiler показывает: re-render идут не от таблицы, а от **Context** auth в корне ([10-auth-context.md](10-auth-context.md)): каждый keystroke в фильтре поднимает state в `ProductsPage`, но **весь** subtree под `AuthProvider` перерисовывается, потому что вы случайно положили `filterQuery` в тот же context value object без memoization.

Tech lead: «Сначала **модель** re-render, потом memo». Эта глава — фундамент перед [19-memo-patterns.md](19-memo-patterns.md), [20-virtualization.md](20-virtualization.md) и лабой [23-lab-performance.md](23-lab-performance.md). База из [react-basic: useState](../react-basic/09-useState.md) и [27-ref-memo-callback](../react-basic/27-ref-memo-callback.md).

## Что вы узнаете

- Что вызывает re-render в React 19 function components
- Render phase vs commit phase
- Как props/state/context триггерят обход дерева
- React DevTools Profiler: flamegraph, «why did this render?»
- Типичные источники лишних render в admin SPA
- Когда оптимизация **не** нужна

---

## Что такое render

**Render** — вызов вашей function component: React выполняет тело, строит **новый** virtual tree, сравнивает с предыдущим (reconciliation), планирует DOM updates.

Re-render **не** всегда значит «тормозит DOM»: React может bail out на memo-компонентах или если результат тот же.

```text
setState / setQuery / parent re-render
              │
              ▼
    React schedules update
              │
              ▼
    Render phase (components run)
              │
              ▼
    Commit phase (DOM, refs, useLayoutEffect)
              │
              ▼
    useEffect (passive)
```

Ошибки из [14-error-boundaries.md](14-error-boundaries.md) случаются в **render phase**. `useEffect` — после paint.

---

## Что триггерит re-render компонента

1. **Собственный state** изменился (`useState`, `useReducer`).
2. **Родитель** re-render → ребёнок вызывается снова (если не bail out).
3. **Context**, который компонент читает, получил новый value ([react-basic: Context](../react-basic/29-context.md)).
4. **Store external** (Zustand subscribe) — позже [33-zustand-ui.md](33-zustand-ui.md).
5. **Query** — `useQuery` подписка: новые `data`, `isFetching` → re-render.

**Не триггерит:** изменение `ref.current`, mutation переменной вне React, uncontrolled DOM.

---

## Пример: фильтр и таблица products

```tsx
function ProductsPage() {
  const [filter, setFilter] = useState("");
  const { data } = useProducts(); // TanStack Query

  return (
    <>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label="Фильтр по SKU"
      />
      <ProductsTable rows={data?.results ?? []} filter={filter} />
    </>
  );
}
```

Каждый символ в input → `setFilter` → **ProductsPage** re-render → **ProductsTable** re-render → каждая строка (если не memo) re-render.

Если 50 строк — OK. Если 5000 — нужна virtualization ([20-virtualization.md](20-virtualization.md)), не слепой memo.

---

## Context и «широкие» re-render

```tsx
// AuthProvider.tsx — антипаттерн
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState(""); // фильтр products в auth — плохо

  const value = { user, filter, setFilter }; // новый object каждый render

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
```

Любой `setFilter` → новый `value` → **все** потребители `useAuth()` re-render, включая sidebar logo.

**Fix:** не класть UI state products в auth context; `useMemo` для value `{ user, login, logout }` ([10-auth-context.md](10-auth-context.md)).

---

## React DevTools Profiler

Установите React DevTools extension ([react-basic: DevTools](../react-basic/36-devtools.md)).

**Шаги для PERF-88:**

1. Откройте Profiler → Record.
2. Введите несколько символов в фильтр.
3. Stop → flamegraph.

Смотрите:
- **Render duration** — какие компоненты дорогие.
- **Why did this render?** (React 19 / DevTools) — props changed, hooks changed, parent rendered.

```text
ProductsPage (12ms)
  └── ProductsTable (11ms)
        └── ProductRow × 5000 (8ms total)
```

Если ProductRow дешёвый, но их 5000 — проблема **количество**, не memo. Virtualize.

---

## StrictMode double render

В dev [`StrictMode`](https://react.dev/reference/react/StrictMode) монтирует дважды для выявления side effects. Profiler покажет **два** render на mount — норма. Сравнивайте prod build (`npm run build && npm run preview`).

---

## Query и лишние render

`useQuery` возвращает новый object каждый notify, но TanStack Query **structural sharing** для `data` — ссылка на `data` стабильна, если содержимое не изменилось.

Частая ошибка:

```tsx
const { data: products } = useProducts();
const sorted = [...(products?.results ?? [])].sort(...); // новый массив КАЖДЫЙ render
```

`sorted` новая ссылка → memo-Table не bail out. Fix: `useMemo` ([19-memo-patterns.md](19-memo-patterns.md)) или sort на сервере ([05-pagination-filters.md](05-pagination-filters.md)).

---

## Подъём state (lifting) и render scope

Из [react-basic: lifting state](../react-basic/12-lifting-state.md): state ближе к листьям → меньше subtree re-render.

```tsx
// Лучше: фильтр только вокруг таблицы
function ProductsPage() {
  const { data } = useProducts();
  return (
    <section>
      <ProductsToolbarAndTable rows={data?.results ?? []} />
    </section>
  );
}

function ProductsToolbarAndTable({ rows }: { rows: Product[] }) {
  const [filter, setFilter] = useState("");
  // filter не поднимается к page — sidebar не страдает
}
```

---

## Keys и remount

Смена `key` у компонента — **полный remount** (state сброс). Из [react-basic: lists & keys](../react-basic/07-lists-keys.md):

```tsx
<ProductEditor key={productId} productId={productId} />
```

Remount дороже re-render. Не меняйте key на каждый keystroke.

---

## Измерьте до оптимизации

| Сигнал | Действие |
|--------|----------|
| Profiler < 16ms на interaction | Вероятно OK |
| Long tasks в Performance tab | Искать JS, не CSS |
| 5000 DOM nodes в table | Virtualization |
| Context churn | Split context, memo value |
| Новые props objects/functions | useMemo/useCallback **точечно** |

Правило из [27-ref-memo-callback](../react-basic/27-ref-memo-callback.md): **measure first**.

---

## Admin SPA hot paths

1. **Products table** — filter keystrokes + DRF pagination ([07-lab-django-products.md](07-lab-django-products.md)).
2. **Auth refresh** — редкий, но не должен re-render всё дерево; isolate [12-refresh-flow.md](12-refresh-flow.md).
3. **Toast stack** — новый toast → только ToastProvider subtree если value memoized.
4. **Router navigation** — unmount старой page — не «лишний» render, норма.

---

## Типичные ошибки

**«Re-render = bad».** React designed to re-render; проблема — **дорогой** render или слишком большое дерево.

**«Profiler в dev = prod».** Dev slower; validate preview build.

**«Отключим StrictMode чтобы быстрее».** Скрывает bugs, не лечит perf.

**«Поднимем весь state в Zustand без selectors».** Все подписчики обновятся — как плохой Context.

**«Оптимизируем login page».** Фокус на hot path admin table.

---

## Чек-лист

- [ ] Назовите 4 причины re-render function component
- [ ] Render vs commit phase — что где
- [ ] Как Profiler помогает с PERF-88
- [ ] Почему filter в AuthContext — антипаттерн
- [ ] Когда virtualization важнее memo

---

## Далее

Следующий урок: [19. memo, useMemo, useCallback без фанатизма](19-memo-patterns.md).
