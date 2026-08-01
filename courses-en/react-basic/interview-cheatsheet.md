# React Basic — Interview Cheatsheet

Test yourself **without peeking** at the chapters, then check against [37-interview-qa.md](37-interview-qa.md).

---

## Quick answers

### Fundamentals

| Question | Answer |
|--------|-------|
| React is | a UI library, declarative, components + hooks |
| JSX | syntax → `createElement`, not an HTML string |
| SPA vs MPA | SPA — one bundle, JSON API; MPA — full page reload |
| Virtual DOM | a UI description → diff → minimal DOM commit |
| Data flow | props down, events up; unidirectional |

### Components

| Question | Answer |
|--------|-------|
| props vs state | props from the parent read-only; state — `useState`, re-render |
| key in a list | stable id (`item.id`); index — bad on reorder |
| controlled input | `value` + `onChange` from state |
| lifting state | a common parent for siblings |
| composition | `children`, not inheritance |

### Hooks — rules

| Rule | Gist |
|---------|------|
| Top level only | not in if/loop/nested fn |
| Only a React fn / custom hook | not in utils |
| Call order | fixed between renders |

### Hooks — API

| Hook | Purpose |
|------|------------|
| `useState` | local state |
| `useEffect` | sync with the outside world after render |
| `useRef` | DOM, mutable without a re-render |
| `useMemo` | cache an expensive computation |
| `useCallback` | stable function reference |
| custom `use*` | reuse of stateful logic |

### useEffect deps

| Array | Behavior |
|--------|-----------|
| `[]` | mount + cleanup unmount |
| `[a, b]` | re-run when a or b changes |
| functional setState | `setX(prev => …)` — the up-to-date prev |

### Data fetching

| Approach | When |
|--------|-------|
| TanStack Query | default for server state :8090 |
| useEffect + fetch | learning; easy to get wrong |
| CORS | a browser+API problem, not React |

Query: **queryKey** = cache id; **invalidate** after a mutation.

### Router

| API | Purpose |
|-----|------------|
| `BrowserRouter` | HTML5 history |
| `Routes` / `Route` | path → element |
| `useParams` | `/items/:id` |
| `useSearchParams` | `?q=` URL state |
| `Outlet` | nested layout |

### Context

| Yes | No |
|----|-----|
| theme, cart, locale | server list (Query) |
| avoid drilling | every form field |
| memo `value` | god-context with 20 fields |

### UI states

```text
loading → skeleton/spinner
error   → message + retry
empty   ≠ error (200, items: [])
success → content
```

Query: `isLoading` (no data), `isFetching` (any request).

### TypeScript

| Pattern | Example |
|---------|--------|
| props interface | `ProductCardProps` |
| events | `ChangeEvent<HTMLInputElement>` |
| extend native | `ComponentProps<"button">` |
| generic list | `DataList<T extends { id }>` |
| API types | `Item`, `ItemsResponse` |

### Performance

| Action | Order |
|----------|---------|
| 1 | Profiler / DevTools measure |
| 2 | fix keys, Context value, Query |
| 3 | memo / useCallback / useMemo if needed |

StrictMode dev — **double render** intentionally.

### Project structure

```text
app/       providers, routes
pages/     thin route components
features/  catalog, cart domain
components/ui/  shared Button, Spinner
api/       client.ts, items.ts → :8090
types/     Item interfaces
hooks/     generic useDebouncedValue
```

---

## Mini snippets

```tsx
// debounced search hook consumer
const debouncedQ = useDebouncedValue(query, 300);

// Query catalog
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ["items"],
  queryFn: fetchItems,
});

// Cart functional update
setLines((prev) => [...prev, { id, title, qty: 1 }]);

// controlled input
<input value={q} onChange={(e) => setQ(e.target.value)} />

// early return states
if (isLoading) return <Skeleton />;
if (isError) return <ErrorPanel onRetry={refetch} />;
if (!items.length) return <Empty />;

// useRef focus
const ref = useRef<HTMLInputElement>(null);
useEffect(() => { ref.current?.focus(); }, []);
```

---

## mock-exams stack

| Layer | Port / tech |
|------|-------------|
| Vite React SPA | :5173 |
| FastAPI shop API | :8090 `/api/v1/items` |
| TanStack Query | cache server state |
| React Router | /catalog, /items/:id, /cart |
| Context | theme + client cart |

---

## Common pitfalls

1. Index as `key` — bugs on filter/reorder
2. `useEffect` without deps → infinite loop
3. Context `value={{ … }}` on every render → mass re-render
4. `fetch` in the render body — never
5. Empty cart vs error — different UX
6. CORS misconfig — "React broken"
7. `useCallback` everywhere without memo children — waste
8. Provider under a single Route — state lost
9. StrictMode — not a "double bug", a dev check
10. Server data in Context instead of Query — stale

---

## What to learn next

| Topic | Course |
|------|------|
| Auth, error boundaries | react-intermediate |
| Vitest, Testing Library | javascript-testing |
| REST contracts | api-design |
| Node BFF | nodejs-basic |
| Capstone shop SPA | [38-capstone.md](38-capstone.md) |

---

[← README](README.md) · [37-interview-qa](37-interview-qa.md) · [38-capstone](38-capstone.md)
