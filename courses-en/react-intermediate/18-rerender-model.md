# 18. Re-render: mental model and React DevTools

## Scenario from work

Ticket **PERF-88**: "The products page lags while typing in the filter." A junior added `React.memo` to every component — it got **worse**. The Profiler shows: the re-renders aren't coming from the table, but from the **auth Context** at the root ([10-auth-context.md](10-auth-context.md)): every keystroke in the filter lifts state in `ProductsPage`, but the **entire** subtree under `AuthProvider` re-renders, because you accidentally put `filterQuery` into that same context value object without memoization.

Tech lead: "Understand the re-render **model** first, then memo." This chapter is the foundation before [19-memo-patterns.md](19-memo-patterns.md), [20-virtualization.md](20-virtualization.md), and the lab in [23-lab-performance.md](23-lab-performance.md). Builds on [react-basic: useState](../react-basic/09-useState.md) and [27-ref-memo-callback](../react-basic/27-ref-memo-callback.md).

## What you'll learn

- What causes a re-render in React 19 function components
- Render phase vs commit phase
- How props/state/context trigger a tree walk
- React DevTools Profiler: flamegraph, "why did this render?"
- Common sources of unnecessary renders in an admin SPA
- When optimization is **not** needed

---

## What a render actually is

A **render** is a call to your function component: React runs the body, builds a **new** virtual tree, diffs it against the previous one (reconciliation), and schedules DOM updates.

A re-render does **not** always mean "the DOM is slow" — React can bail out on memo components, or when the result is unchanged.

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

Errors from [14-error-boundaries.md](14-error-boundaries.md) happen during the **render phase**. `useEffect` runs after paint.

---

## What triggers a component re-render

1. Its **own state** changed (`useState`, `useReducer`).
2. The **parent** re-rendered → the child is called again (unless it bails out).
3. A **context** the component reads got a new value ([react-basic: Context](../react-basic/29-context.md)).
4. An **external store** (Zustand subscription) — covered later in [33-zustand-ui.md](33-zustand-ui.md).
5. A **query** — a `useQuery` subscription: new `data`, `isFetching` → re-render.

**Does not trigger a re-render:** mutating `ref.current`, mutating a variable outside React, uncontrolled DOM changes.

---

## Example: filter and products table

```tsx
function ProductsPage() {
  const [filter, setFilter] = useState("");
  const { data } = useProducts(); // TanStack Query

  return (
    <>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label="Filter by SKU"
      />
      <ProductsTable rows={data?.results ?? []} filter={filter} />
    </>
  );
}
```

Every character typed in the input → `setFilter` → **ProductsPage** re-renders → **ProductsTable** re-renders → every row (unless memoized) re-renders.

With 50 rows this is fine. With 5000, you need virtualization ([20-virtualization.md](20-virtualization.md)), not blind memoization.

---

## Context and "wide" re-renders

```tsx
// AuthProvider.tsx — antipattern
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState(""); // products filter inside auth — bad

  const value = { user, filter, setFilter }; // new object on every render

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
```

Any `setFilter` call → new `value` → **all** consumers of `useAuth()` re-render, including the sidebar logo.

**Fix:** don't put products UI state inside the auth context; `useMemo` the value `{ user, login, logout }` ([10-auth-context.md](10-auth-context.md)).

---

## React DevTools Profiler

Install the React DevTools extension ([react-basic: DevTools](../react-basic/36-devtools.md)).

**Steps for PERF-88:**

1. Open Profiler → Record.
2. Type a few characters into the filter.
3. Stop → inspect the flamegraph.

Look at:
- **Render duration** — which components are expensive.
- **Why did this render?** (React 19 / DevTools) — props changed, hooks changed, parent rendered.

```text
ProductsPage (12ms)
  └── ProductsTable (11ms)
        └── ProductRow × 5000 (8ms total)
```

If a single ProductRow is cheap but there are 5000 of them, the problem is **quantity**, not memoization. Virtualize.

---

## StrictMode double render

In dev, [`StrictMode`](https://react.dev/reference/react/StrictMode) mounts twice to surface side effects. The Profiler will show **two** renders on mount — that's normal. Compare against a prod build (`npm run build && npm run preview`).

---

## Query and unnecessary renders

`useQuery` returns a new object on every notify, but TanStack Query does **structural sharing** for `data` — the `data` reference stays stable if the content hasn't changed.

A common mistake:

```tsx
const { data: products } = useProducts();
const sorted = [...(products?.results ?? [])].sort(...); // new array on EVERY render
```

`sorted` is a new reference → the memoized Table doesn't bail out. Fix: `useMemo` ([19-memo-patterns.md](19-memo-patterns.md)) or sort on the server ([05-pagination-filters.md](05-pagination-filters.md)).

---

## Lifting state and render scope

From [react-basic: lifting state](../react-basic/12-lifting-state.md): the closer state lives to the leaves, the smaller the subtree that re-renders.

```tsx
// Better: keep the filter scoped to the table only
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
  // filter doesn't bubble up to page — sidebar isn't affected
}
```

---

## Keys and remounts

Changing a component's `key` causes a **full remount** (state reset). From [react-basic: lists & keys](../react-basic/07-lists-keys.md):

```tsx
<ProductEditor key={productId} productId={productId} />
```

A remount is more expensive than a re-render. Don't change the key on every keystroke.

---

## Measure before you optimize

| Signal | Action |
|--------|----------|
| Profiler < 16ms per interaction | Probably fine |
| Long tasks in the Performance tab | Look at JS, not CSS |
| 5000 DOM nodes in the table | Virtualization |
| Context churn | Split the context, memoize the value |
| New props objects/functions | Targeted useMemo/useCallback |

Rule from [27-ref-memo-callback](../react-basic/27-ref-memo-callback.md): **measure first**.

---

## Admin SPA hot paths

1. **Products table** — filter keystrokes + DRF pagination ([07-lab-django-products.md](07-lab-django-products.md)).
2. **Auth refresh** — rare, but shouldn't re-render the whole tree; isolate it ([12-refresh-flow.md](12-refresh-flow.md)).
3. **Toast stack** — a new toast should only re-render the ToastProvider subtree if the value is memoized.
4. **Router navigation** — unmounting the old page isn't an "extra" render, it's normal.

---

## Common mistakes

**"Re-render = bad."** React is designed to re-render; the real problem is an **expensive** render or too large a tree.

**"Profiler in dev = prod."** Dev is slower; validate against a preview build.

**"Let's disable StrictMode to make it faster."** That just hides bugs, it doesn't fix performance.

**"Let's lift all state into Zustand without selectors."** Every subscriber updates — just as bad as a poorly split Context.

**"Let's optimize the login page."** Focus on the admin table hot path instead.

---

## Checklist

- [ ] Name 4 causes of a function component re-render
- [ ] Render vs commit phase — what happens where
- [ ] How the Profiler helps with PERF-88
- [ ] Why putting the filter in AuthContext is an antipattern
- [ ] When virtualization matters more than memo

---

## Next

Next lesson: [19. memo, useMemo, and useCallback without the cult](19-memo-patterns.md).
