# 15. Dependencies, cleanup, and `useEffect` patterns

## A scenario from work

Search in the shop catalog sends a request to FastAPI `:8090` **on every character** — the backend receives `k`, `ke`, `key`, `keyb`… The tech lead opens the Network tab and sees 40 requests per second. The developer adds a `useEffect` with `[query]`, but reads a **stale** `page` from the closure inside the effect — pagination "gets stuck" at 1. Another colleague puts `fetch` in an effect **without** cancellation: the user quickly changes the filter, responses arrive **out of order**, and the UI shows the wrong result.

This chapter is about the **dependency array**, **cleanup**, **stale closures**, and why "fetch in an effect" is often better replaced with TanStack Query or a custom hook with debounce.

## What you'll learn

- The rules of the dependency array and `exhaustive-deps`
- Cleanup for timers, subscriptions, and **canceling a fetch**
- Stale closure: why an effect "sees old" values
- Anti-patterns: fetch without a guard, effect as an event handler, derived state in an effect
- The "sync props → local state" pattern (carefully)

---

## Dependency array: a contract with React

React compares deps **shallowly** (`Object.is`). If at least one element changed — cleanup the old effect, then a new setup.

```tsx
useEffect(() => {
  document.title = `Shop — ${category}`;
}, [category]);
```

**All** values from the setup's closure that can change between renders and should affect the effect must be in deps:

```tsx
function ItemCounter({ itemId }: { itemId: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [itemId]); // on product change — a new interval
}
```

The functional updater `setCount(c => c + 1)` does **not** require `count` in deps — React provides the current value.

---

## ESLint `react-hooks/exhaustive-deps`

The plugin flags missing deps. Disabling it with `// eslint-disable` — only **with a comment explaining why**. A typical legitimate case is a ref for "the latest value without a re-run" (advanced, [27-ref-memo-callback.md](27-ref-memo-callback.md)).

---

## Cleanup: timers and debounce

A debounced search **must** clear the previous timer:

```tsx
function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearch(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search products…"
    />
  );
}
```

On fast typing, cleanup cancels the "pending" calls — only the last one, after 300 ms, survives. Lab: [16-lab-effects.md](16-lab-effects.md).

**A stable `onSearch`:** if the parent passes an inline `(q) => ...` on every render, the effect re-runs unnecessarily. Wrap it in `useCallback` ([27-ref-memo-callback.md](27-ref-memo-callback.md)) or lift the debounce into a custom hook ([28-custom-hooks.md](28-custom-hooks.md)).

---

## Stale closure

An effect "freezes" values as of its **last** run:

```tsx
function BrokenPagination() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch(`/api/v1/items?page=${page}`)
      .then((r) => r.json())
      .then(setItems);
  }, []); // BUG: page is always 1 in the effect
}
```

The fix — add `page` to deps **or** a functional pattern / Query.

Another example — an interval with stale state:

```tsx
// Bad: count in the closure goes stale
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []); // count = 0 forever

// Good: functional updater or ref
useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + 1);
  }, 1000);
  return () => clearInterval(id);
}, []);
```

See [12-closures.md](../javascript-basic/12-closures.md) in javascript-basic.

---

## Fetch in an effect: guard and AbortController

```tsx
type Item = { id: number; name: string; price: number };

function ItemList({ category }: { category: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ category });
        const res = await fetch(`/api/v1/items?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Item[] = await res.json();
        if (!cancelled) setItems(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (!cancelled) setError(err instanceof Error ? err.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [category]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p role="alert">{error}</p>;
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

| Anti-pattern | Problem |
|--------------|---------|
| fetch without `AbortController` | setState after unmount, response races |
| no `res.ok` | 404 treated as "success" ([29-fetch.md](../javascript-basic/29-fetch.md)) |
| effect without deps despite props | data doesn't update |
| duplicating fetch in render + effect | double requests |

Vite proxy `/api` → `:8090` — [18-cors-fastapi.md](18-cors-fastapi.md).

---

## Effect as "sync props → state"

Sometimes you need **local** editing that resets when `itemId` changes:

```tsx
function ItemEditor({ item }: { item: Item }) {
  const [draft, setDraft] = useState(item.name);

  useEffect(() => {
    setDraft(item.name);
  }, [item.id, item.name]);

  return <input value={draft} onChange={(e) => setDraft(e.target.value)} />;
}
```

This is a **controlled escape hatch**. An alternative — `key={item.id}` on the component, so React remounts and resets state. Don't copy the entire API object in an effect unnecessarily — the risk of extra renders.

---

## "Fetch on mount only" vs reactivity

```tsx
// Only on mount — data goes stale when shopId changes
useEffect(() => { loadItems(shopId); }, []);

// Reactively — correct for shopId from props
useEffect(() => { loadItems(shopId); }, [shopId]);
```

For CRUD and caching — **TanStack Query** ([20-tanstack-query.md](20-tanstack-query.md)) instead of manual boilerplate.

---

## Separation of responsibilities

```text
User input (instant)  →  useState + onChange
Debounced side effect →  useEffect + cleanup
Server data           →  useQuery (later) or effect + abort
User action (click)   →  event handler, not an effect
```

---

## Common mistakes

1. **Empty `[]` while using props/state** — stale data and a stale closure.

2. **An object/array in deps without memoization** — `{ filter }` is new on every render → the effect fires each time.

3. **No cleanup for setTimeout** — debounce doesn't work, a request storm on `:8090`.

4. **setState on an unmounted component** — a warning; you need an abort or a `cancelled` flag.

5. **Effect instead of `useMemo`** — a derived value via `setState` in an effect → an extra render.

6. **Two effects for one task** — combine them or extract into a hook.

---

## Summary

The dependency array is an explicit contract: when deps change, React re-runs the effect. Cleanup cancels timers, subscriptions, and fetches. A stale closure arises when an effect doesn't see fresh props/state — fix the deps or use functional updaters. Fetch in an effect requires `AbortController`, an `ok` check, and a guard against races. Debounce — via cleanup `clearTimeout`. For the shop API, Query is preferable after [17-fetch-react.md](17-fetch-react.md).

---

## Checklist

- What does React compare between effect runs?
- Why `return () => clearTimeout(timer)` in a debounce?
- Why does `[]` + `page` inside the effect cause a pagination bug?
- How do you cancel a fetch on unmount?
- When is an effect for `setDraft` justified?
- What replaces a manual fetch-effect in a production catalog?

Next lesson: [16. Lab: search with debounce](16-lab-effects.md).
