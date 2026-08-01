# 16. Lab: search with debounce

## Scenario

Product owner: "Catalog search shouldn't hit the API on every letter — like the big shops, a 300 ms delay." You already know [15-effect-patterns.md](15-effect-patterns.md): debounce via `useEffect` + `clearTimeout`. In this lab you'll build a **SearchBar** and a **CatalogPreview**: local input is instant, the "official" search request is delayed. No FastAPI yet — we filter a mock array; the pattern transfers to `:8090` in [19-lab-fetch-items.md](19-lab-fetch-items.md).

**Time:** ~45–60 minutes.  
**Where the code goes:** [`examples/src/`](examples/src/).

---

## Setup

```bash
cd courses/react-basic/examples
npm install
npm run dev   # http://localhost:5173
```

Create the files:

```text
src/
  components/
    SearchBar.tsx
    CatalogPreview.tsx
  data/
    mockItems.ts
  lab/
    DebouncedSearchLab.tsx
```

Wire the lab into `App.tsx` (temporarily):

```tsx
import { DebouncedSearchLab } from "./lab/DebouncedSearchLab";

export function App() {
  return <DebouncedSearchLab />;
}
```

---

## Task 1. Mock data `mockItems.ts`

```tsx
export type ShopItem = {
  id: number;
  name: string;
  category: string;
  price: number;
};

export const MOCK_ITEMS: ShopItem[] = [
  { id: 1, name: "Mechanical Keyboard", category: "peripherals", price: 79.99 },
  { id: 2, name: "USB-C Hub", category: "accessories", price: 49.0 },
  { id: 3, name: "27\" Monitor", category: "displays", price: 299.0 },
  { id: 4, name: "Wireless Mouse", category: "peripherals", price: 39.5 },
  { id: 5, name: "Laptop Stand", category: "accessories", price: 59.0 },
];
```

---

## Task 2. `SearchBar` — controlled input + debounce

Props:

```tsx
type SearchBarProps = {
  onDebouncedChange: (query: string) => void;
  delayMs?: number;
};
```

Requirements:

- the local `query` updates **immediately** on input;
- `onDebouncedChange` is called after `delayMs` (default **300**) following the last change;
- on unmount or a new character — **cancel** the previous timer (`clearTimeout` in cleanup);
- placeholder: "Search the catalog…".

### Template

```tsx
import { useEffect, useState } from "react";

export function SearchBar({ onDebouncedChange, delayMs = 300 }: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDebouncedChange(query.trim());
    }, delayMs);
    return () => clearTimeout(timer);
  }, [query, delayMs, onDebouncedChange]);

  return (
    <input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search the catalog…"
      aria-label="Search"
    />
  );
}
```

Wrap `onDebouncedChange` in `useCallback` in the parent if you see extra effect firings.

---

## Task 3. `CatalogPreview`

Shows:

- a "Debounced query: …" line (the current value **after** debounce);
- a "Filter requests: N" counter — incremented on each debounced change;
- a list of products whose `name` contains the query **case-insensitively** (an empty query shows all products).

```tsx
function filterItems(items: ShopItem[], q: string) {
  if (!q) return items;
  const lower = q.toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(lower));
}
```

---

## Task 4. `DebouncedSearchLab`

Assemble the page:

```tsx
export function DebouncedSearchLab() {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchCount, setSearchCount] = useState(0);

  const handleDebounced = useCallback((q: string) => {
    setDebouncedQuery(q);
    setSearchCount((n) => n + 1);
  }, []);

  const visible = useMemo(
    () => filterItems(MOCK_ITEMS, debouncedQuery),
    [debouncedQuery],
  );

  return (
    <main>
      <h1>Debounced search</h1>
      <SearchBar onDebouncedChange={handleDebounced} />
      <p>Debounced query: «{debouncedQuery}»</p>
      <p>Filter requests: {searchCount}</p>
      <ul>
        {visible.map((item) => (
          <li key={item.id}>{item.name} — {item.price} €</li>
        ))}
      </ul>
    </main>
  );
}
```

---

## Verification

1. Quickly type `keyboard` — **searchCount** should grow by **1** (not 8).
2. Clear the field — the debounced query is `""`, all 5 products again.
3. React Strict Mode: searchCount shouldn't "double" due to missing cleanup (if it doubles only in dev on remount — see the discussion in [14-useEffect.md](14-useEffect.md)).
4. (Optional) `console.log` inside the debounced callback — one line per typing pause.

---

## Task 5. (Optional) Custom hook `useDebouncedValue`

Extract the debounce into `src/hooks/useDebouncedValue.ts`:

```tsx
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
```

`SearchBar` simplifies to `const debounced = useDebouncedValue(query)` + an effect on `debounced`. The full version — [28-custom-hooks.md](28-custom-hooks.md).

---

## Success criteria

- [ ] Typing in the field is responsive, filtering is delayed
- [ ] Timer cleanup in `SearchBar`
- [ ] Fast typing doesn't inflate `searchCount`
- [ ] An empty query shows the full list
- [ ] TypeScript with no errors: `npm run typecheck`

---

## Common mistakes in the lab

1. **Debounce in `onChange` without an effect** — you call the API/filter immediately.

2. **Forgot `clearTimeout`** — several pending callbacks.

3. **Debounce and the local query in one state** — the input "lags".

4. **`onDebouncedChange` inline in JSX** — the effect re-runs every render.

5. **Filtering by `query` instead of the debounced value** — the point of the lab is lost.

---

## Relation to the course

- Effect basics: [14-useEffect.md](14-useEffect.md)
- Patterns: [15-effect-patterns.md](15-effect-patterns.md)
- API search: [19-lab-fetch-items.md](19-lab-fetch-items.md), `:8090`
- Query + URL: [26-url-state.md](26-url-state.md)

---

## Lab summary

You separated the **instant UI** (controlled input) from the **deferred side effect** (debounced query). Cleanup guarantees a single "final" request per series of keystrokes — the foundation of a shop live-search without DDoSing your own FastAPI.

---

## Checklist before submitting

- Where is the cleanup in the code?
- What happens without debounce for 10 characters?
- How do you move the debounced query into `fetch('/api/v1/items?q=...')`?
- Why `useCallback` for `handleDebounced`?

Next lesson: [17. fetch in React](17-fetch-react.md).
