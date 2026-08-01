# 28. Custom hooks: extracting logic from components

## Introduction: "A 400-line ProductPage — what do I do?"

Ticket: "Refactor ProductPage." The component mixes: loading `GET /api/v1/items/{id}`, managing the cart quantity, debounced reviews, tab switching, and three `useEffect`s. Code review: "Extract custom hooks." You're not sure **where** the line is between a hook and a util, and whether you can call a hook from `if (isAdmin)`.

A custom hook is an **ordinary function**, named with **`use`**, inside which other hooks are called. It doesn't add magic to React: it's a **reusable piece of state + effects logic** that several components of the shop SPA can share without copy-paste.

Connection to the course: after [27-ref-memo-callback.md](27-ref-memo-callback.md) you know ref/memo; hooks from [09-useState.md](09-useState.md), [14-useEffect.md](14-useEffect.md), [20-tanstack-query.md](20-tanstack-query.md) are the raw material for extraction. Context ([29-context.md](29-context.md)) is a different level of "globality"; a custom hook is **composition without a Provider**.

## What you'll learn

- When to extract logic into a custom hook vs an ordinary function.
- **Naming**: `useCart`, `useDebouncedValue`, `useMediaQuery`.
- **Rules of Hooks** — why you can't call a hook in an `if` / loop.
- A hook on top of `fetch` and TanStack Query to FastAPI `:8090`.
- Testability and file structure ([35-project-structure.md](35-project-structure.md)).

---

## Anatomy of a custom hook

```tsx
// hooks/useDebouncedValue.ts
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
```

Usage in the catalog (a continuation of [16-lab-effects.md](16-lab-effects.md)):

```tsx
function CatalogSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["items", { q: debouncedQuery }],
    queryFn: () => searchItems(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  // ...
}
```

The component describes the **UI**; the hook — the **behavior and synchronization**.

---

## Hook vs utility function

| | Custom hook | Utility (`formatPrice.ts`) |
|---|-------------|----------------------------|
| Calls React hooks | yes | no |
| Name | `use*` | anything |
| Where to call | only in a component/hook | anywhere |
| Example | `useCart()` | `formatPrice(19.99)` |

```tsx
// NOT a hook — a pure function
export function buildItemsUrl(base: string, params: Record<string, string>) {
  const url = new URL(`${base}/api/v1/items`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

// A hook — state + effect
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}
```

---

## Rules of Hooks

React relies on the **order** of hook calls between renders.

### ✅ Allowed

```tsx
function useItem(id: number | null) {
  const enabled = id != null;
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => fetchItem(id!),
    enabled,
  });
}
```

A condition **inside** a hook or via `enabled` — OK. Hooks at the top level of the `useItem` function.

### ❌ Not allowed

```tsx
function Bad({ skip }: { skip: boolean }) {
  if (skip) {
    return null;
  }
  const [x, setX] = useState(0); // hooks after an early return — a violation
}
```

```tsx
items.forEach(() => {
  useState(0); // a hook in a loop
});
```

```tsx
function notAHook() {
  useState(0); // a hook outside a component/custom hook
}
```

**ESLint `react-hooks/rules-of-hooks`** catches most cases.

### Why it matters

React stores hook state in an **array by call index**. If one render called 3 hooks and the next called 2, the state "shifts" — bugs on the level of "the cart shows the theme."

---

## Patterns for the mock-exams shop

### 1. `useLocalStorage` — a draft of the filters

```tsx
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

A key like `mock-exams-shop-filters` — survives a refresh on `/catalog`.

### 2. `useFetchItem` — a wrapper over Query

```tsx
const API = "http://localhost:8090";

async function fetchItem(id: number) {
  const res = await fetch(`${API}/api/v1/items/${id}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

export function useFetchItem(id: number) {
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => fetchItem(id),
  });
}
```

A single place for the Item types and 404 handling — see [17-fetch-react.md](17-fetch-react.md), [32-typescript-react.md](32-typescript-react.md).

### 3. `useToggle` — small but illustrative

```tsx
export function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  const set = useCallback((v: boolean) => setOn(v), []);
  return { on, toggle, set };
}
```

For the "Add product" modal in the admin preview.

### 4. Composing hooks

```tsx
export function useCatalogSearch() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  const queryResult = useQuery({ /* ... */ });
  return { query, setQuery, debounced, ...queryResult };
}
```

**Don't** nest 10 levels without need — one "feature hook" per screen is often enough.

---

## Return value: object vs tuple

```tsx
// Tuple — like useState, the order is fixed
return [value, setValue] as const;

// Object — named fields, easier to extend
return { items, isLoading, error, refetch };
```

For a project's public hooks, prefer an **object** — adding a field doesn't break destructuring.

---

## Naming conventions

| Name | Meaning |
|-----|-------|
| `useCart` | cart domain state |
| `useDebouncedValue` | generic, reusable |
| `useMediaQuery("(min-width: 768px)")` | a matchMedia subscription |
| `useItemsQuery` | an explicit link to Query |

**Don't** name it `getItems` if it uses hooks inside — only `use*`.

Files: `src/hooks/useDebouncedValue.ts` — one function or a related group ([35-project-structure.md](35-project-structure.md)).

---

## Custom hook and Context

| Task | Solution |
|--------|---------|
| Logic for one screen | `useCatalogPage()` |
| Data for half the tree without prop drilling | Context + `useCart()` reads the context ([30-lab-context.md](30-lab-context.md)) |
| Server data | TanStack Query |

A hook **can** use `useContext` inside — then `useCart` hides the Provider details.

```tsx
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart outside CartProvider");
  return ctx;
}
```

---

## Testing (preview)

Custom hooks are tested via **`@testing-library/react`** `renderHook` (course [javascript-testing](../javascript-path.md)):

```tsx
const { result } = renderHook(() => useDebouncedValue("a", 100));
await waitFor(() => expect(result.current).toBe("a"));
```

Pure utils — ordinary unit tests without React.

---

## Refactoring ProductPage: step by step

1. Identify **blocks** with their own state/effect: tabs, quantity, fetch.
2. For each block — a `useX` function, top-level hooks only.
3. Component: hooks at the top, then early returns ([31-ui-states.md](31-ui-states.md)), then JSX.
4. Move the Item types into `types/item.ts`.
5. API URL — `src/api/client.ts` → `:8090`.

**Goal:** `ProductPage.tsx` < 120 lines, reads like a table of contents.

---

## Common mistakes

**A hook called conditionally** — see Rules of Hooks.

**A hook doing too much** — a "god hook" like a god component; split it into `useItemDetails` + `useReviews`.

**Duplicating Query keys** — extract a factory `itemKeys.detail(id)` next to the hook.

**A side effect on every utility call** — `fetch` in `formatItem()` without a hook/effect — races and double requests.

**Forgetting cleanup** in a hook with a subscribe/timer — leaks when the route unmounts ([15-effect-patterns.md](15-effect-patterns.md)).

---

## Summary

Custom hooks are **reusable** React logic (state, effects, Query, context) with a `use*` name. Extract repeated pieces from shop pages, follow the Rules of Hooks, separate pure functions from hooks. The next step for global state is [29-context.md](29-context.md).

## Checklist

- [ ] The difference between a custom hook and a utility function
- [ ] The three rules of calling hooks
- [ ] An example of `useDebouncedValue` for API search
- [ ] When hook vs Context vs lifting state ([12-lifting-state.md](12-lifting-state.md))
- [ ] Where to store hooks in the project structure

Next lesson: [29. Context](29-context.md).
