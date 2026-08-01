# 27. useRef, useMemo, useCallback: when and why

## Introduction: "Why does the input lose focus after every keystroke?"

Code review on the shop catalog. A colleague extracted the search field into a separate `SearchField` component, but the parent recreates an inline function on every `onChange` and passes it down. The reviewer writes: "Add `useCallback`." You add it — the focus still disappears. The real cause turns out to be something else: the parent changes `SearchField`'s `key` on every keystroke, so React **unmounts** the old input and mounts a new one.

The three hooks in this chapter are **tools**, not "default accelerators." `useRef` is a reference to the DOM and a mutable box that doesn't trigger re-renders. `useMemo` and `useCallback` **memoize** computations and functions — but only when there's a measurable reason for it (a heavy filter over 10,000 products, `React.memo` on a child component, a stable reference for `useEffect`).

After [`useState`](09-useState.md) and [`useEffect`](14-useEffect.md) you can manage state and side effects. This chapter fills in the gap: **imperative DOM access**, **performance without premature optimization**, and the connection to [TanStack Query](20-tanstack-query.md) (the cache already memoizes data — don't duplicate that logic).

## What you'll learn

- **`useRef`**: DOM access, focus, scroll, storing a timer id without a re-render.
- **`useMemo`**: expensive computations (catalog filtering, cart aggregation).
- **`useCallback`**: stable function references for memoized components and effect dependencies.
- **When NOT to use** memoization — the "measure first" rule.
- Connection to the shop UI: searching via `GET /api/v1/items`, debouncing from [16-lab-effects.md](16-lab-effects.md).

---

## useRef: a mutable box and the DOM

### Scenario: autofocus on the catalog search field

After navigating to `/catalog`, the user expects to start typing their query immediately. A controlled input from [10-events-controlled.md](10-events-controlled.md) doesn't need a ref for its value — but **focus** has to be set imperatively:

```tsx
import { useRef, useEffect } from "react";

function CatalogSearch({ value, onChange }: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <input
      ref={inputRef}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search the mock-exams shop…"
      aria-label="Search products"
    />
  );
}
```

**`ref={inputRef}`** — after commit, React writes the DOM node into `inputRef.current`. `useEffect` with `[]` runs after the first paint, without blocking the render.

### Refs don't trigger re-renders

```tsx
const renderCount = useRef(0);
renderCount.current += 1; // mutating .current doesn't cause React to re-render
```

Use it for:
- a debounce timer id ([16-lab-effects.md](16-lab-effects.md));
- a "previous value" of a prop for comparison;
- an "is the component still mounted" flag (careful — prefer `AbortController` for fetches).

**Don't store anything that needs to appear in the UI in a ref** — that's what `useState` is for.

### Forwarding refs (overview)

UI-kit buttons and inputs are often wrapped in `forwardRef` so the parent can call `.focus()` on them. We'll go deeper in react-intermediate; for now it's enough to know: a ref on your component won't reach the inner `<input>` without `forwardRef`.

---

## useMemo: caching a computed result

### Scenario: filtering 5,000 products on the client

FastAPI on `:8090` returns the list; until server-side pagination is in place ([api-design](../api-design/README.md)), filtering can live in the browser:

```tsx
import { useMemo, useState } from "react";

type Item = { id: number; title: string; description: string };

function CatalogList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {filtered.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </>
  );
}
```

**Dependencies** work like they do for `useEffect`: when `items` or `query` changes, the filter recomputes; otherwise the cached array is returned.

### When useMemo is justified

| Situation | Yes / No |
|----------|----------|
| Filtering/sorting thousands of elements | Yes |
| `items.map(x => x.price).reduce(...)` on every render with stable deps | Yes |
| `const doubled = n * 2` | **No** — cheaper without memo |
| "Just in case" | **No** — complicates deps and debugging |

**Rule:** working code first; profile with the React DevTools Profiler ([36-devtools.md](36-devtools.md)); only then reach for `useMemo`.

### useMemo and referential equality

A child `MemoizedList` wrapped in `React.memo` compares props **by reference**:

```tsx
const sorted = useMemo(
  () => [...items].sort((a, b) => a.title.localeCompare(b.title)),
  [items]
);
return <MemoizedList items={sorted} />;
```

Without `useMemo`, `[...items].sort()` creates a **new array** on every render → memo becomes useless.

---

## useCallback: a stable function

`useCallback(fn, deps)` is essentially `useMemo(() => fn, deps)`: it returns the **same** function as long as the deps haven't changed.

### Scenario: a memoized product card

```tsx
import { memo, useCallback, useState } from "react";

const ProductCard = memo(function ProductCard({
  item,
  onAdd,
}: {
  item: { id: number; title: string };
  onAdd: (id: number) => void;
}) {
  console.log("render", item.id);
  return (
    <article>
      <h3>{item.title}</h3>
      <button type="button" onClick={() => onAdd(item.id)}>
        Add to cart
      </button>
    </article>
  );
});

function CatalogPage({ items }: { items: { id: number; title: string }[] }) {
  const [cartIds, setCartIds] = useState<number[]>([]);

  const handleAdd = useCallback((id: number) => {
    setCartIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  return items.map((item) => (
    <ProductCard key={item.id} item={item} onAdd={handleAdd} />
  ));
}
```

Without `useCallback`, `handleAdd` is a new function on every render → `ProductCard` re-renders every time, and `memo` doesn't help.

### useCallback for useEffect

```tsx
const loadItems = useCallback(async () => {
  const res = await fetch("http://localhost:8090/api/v1/items");
  const data = await res.json();
  setItems(data.items);
}, []);

useEffect(() => {
  loadItems();
}, [loadItems]);
```

If `loadItems` is declared in the body without `useCallback`, the effect fires on every render. **A simpler alternative:** declare the async logic **inside** the effect instead of extracting it — see [15-effect-patterns.md](15-effect-patterns.md).

### TanStack Query already memoizes

For data from `:8090`, prefer Query ([20-tanstack-query.md](20-tanstack-query.md)): `useQuery` gives you stable `data`, `refetch`, and deduplication. Don't wrap a `fetch` in `useMemo` on top of Query — that's duplicated logic.

---

## Comparing the three hooks

| Hook | Re-renders on change | Typical use |
|------|-------------------------|---------------------|
| `useState` | yes | UI state |
| `useRef` | no (`.current`) | DOM, timers, mutable flags |
| `useMemo` | no (until deps change) | expensive derived data |
| `useCallback` | no (until deps change) | stable fn for memo / effect |

```text
User types in the search box
       │
       ▼
  setQuery → re-render CatalogList
       │
       ├── useMemo recomputes filtered (if query/items changed)
       ├── useCallback: handleAdd keeps the same reference → ProductCard skips re-render
       └── inputRef.current — same DOM node (focus preserved)
```

---

## Anti-patterns from code review

### 1. useCallback on every handler "for performance"

```tsx
// Overkill if the children aren't memoized and the list has < 100 items
const onClick = useCallback(() => setOpen(true), []);
```

### 2. useMemo with incomplete deps

ESLint's `react-hooks/exhaustive-deps` is your friend. A missing dep → **stale** data in the filter.

### 3. Using a ref instead of state for UI

```tsx
// Bad: mutating the ref won't update the counter on screen
countRef.current += 1;
```

### 4. Reading ref.current during render for UI logic

A ref can be `null` before commit. For conditional rendering, use state.

### 5. Changing the key just to "reset" a form

```tsx
<SearchField key={categoryId} /> // OK — category changed, new input
<SearchField key={query} />      // BAD — focus is lost on every keystroke
```

---

## Practical checklist for the shop catalog

1. **Focus on search** — `useRef` + `useEffect` once, on route mount.
2. **Debounce the request to :8090** — timer id in `useRef`, logic in [16-lab-effects.md](16-lab-effects.md); Query — `enabled: debouncedQuery.length > 0`.
3. **Heavy client-side filter** — `useMemo` over `[items, filters]`.
4. **List of memoized cards** — `useCallback` for `onAdd` / `onSelect`.
5. **Measure** — Profiler before and after; if there's no difference, remove the memoization.

---

## Common mistakes

**"useMemo/useCallback make React faster."** They add memory overhead and dep comparisons; they only help with a **narrow, specific** bottleneck.

**"ref.current is in sync with render."** After a state change, the ref is still stale until commit; an effect is the safe place to touch the DOM.

**"Empty [] deps for loadItems that uses props."** Stale closure — you'll load an outdated `shopId`. Specify the deps, or use a Query key instead.

**"React.memo everywhere in the tree."** Makes debugging harder; memoizing the leaf nodes of a list is the typical trade-off.

---

## Summary

- **`useRef`** — DOM, focus, mutable values without a re-render.
- **`useMemo`** — expensive derived data; stable references to arrays/objects for memoized children.
- **`useCallback`** — stable callbacks for `React.memo` and clean effect deps.
- **Don't optimize prematurely**; Query and list keys ([07-lists-keys.md](07-lists-keys.md)) often matter more.
- Lost focus is usually caused by a **key/remount** issue, not a missing `useCallback`.

## Checklist

- [ ] Explain the difference between `useState` and `useRef` for a timer id
- [ ] When `useMemo` is justified for a catalog filter
- [ ] Why `useCallback` matters with `React.memo` on `ProductCard`
- [ ] Why Query replaces a manual `useMemo` for fetching
- [ ] Name a cause of lost focus other than "no useCallback"

Next lesson: [28. Custom hooks](28-custom-hooks.md).
