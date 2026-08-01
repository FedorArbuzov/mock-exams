# 20. TanStack Query: queries and cache

## A scenario from work

After [19-lab-fetch-items.md](19-lab-fetch-items.md), three screens in the shop request `/api/v1/items`: the sidebar, the home page, the modal. Each has its own `useEffect`, so you get **three identical** requests on mount. The user navigates away and comes back — loading again. The tech lead says: "We need a client-side cache and dedupe." **TanStack Query** (React Query v5) is the standard for server state in React: `useQuery`, keys, stale time, background refetch.

[`examples/package.json`](examples/package.json) already has `@tanstack/react-query` ^5.

## What you'll learn

- `QueryClient`, `QueryClientProvider`
- `useQuery`, `queryKey`, `queryFn`
- `staleTime`, `gcTime` (cacheTime)
- `isPending` vs `isLoading` vs `isFetching`
- Migrating `ItemsList` off manual fetch

---

## Server state vs client state

| | Client state | Server state |
|---|--------------|--------------|
| Examples | theme, modal open | items from `:8090` |
| Source of truth | React | **API** |
| Tool | `useState`, Context | **Query** |

Don't stash the whole catalog in Context "forever" — Query keeps it synced with the backend.

---

## Provider

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
```

`staleTime: 30_000` — data stays **fresh** for 30 seconds, so a remount won't refetch without a reason.

---

## `useQuery` basics

```tsx
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Item } from "@/api/types";

function ItemsList() {
  const { data, error, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["items"],
    queryFn: ({ signal }) => api<Item[]>("/api/v1/items", { signal }),
  });

  if (isPending) {
    return <p aria-busy="true">Loading catalog…</p>;
  }

  if (isError) {
    return (
      <div role="alert">
        <p>{error.message}</p>
        <button type="button" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return <p>The catalog is empty.</p>;
  }

  return (
    <>
      {isFetching ? <small>Refreshing…</small> : null}
      <ul>
        {data.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </>
  );
}
```

`queryFn` receives `{ signal }` — Query forwards the abort signal ([17-fetch-react.md](17-fetch-react.md)).

---

## `queryKey` — the cache identifier

The key is a **serializable array**:

```tsx
["items"]                           // the whole catalog
["items", { category: "peripherals" }]  // filtered
["items", itemId]                   // a single item
```

Two components with the **same** key → **one** request (dedupe). Different keys — different cache entries.

```tsx
useQuery({
  queryKey: ["items", { q, page }],
  queryFn: () => api<Item[]>(`/api/v1/items?${params}`),
});
```

Rule of thumb: anything that affects the API response must be in the `queryKey` ([26-url-state.md](26-url-state.md)).

---

## `staleTime` and `gcTime`

| Option | Meaning |
|-------|--------|
| `staleTime` | how many ms the data is considered **fresh** (no auto-refetch on mount) |
| `gcTime` | how many ms an unused cache entry stays in memory after unmount (default 5 min) |

```tsx
useQuery({
  queryKey: ["items"],
  queryFn: fetchItems,
  staleTime: 60_000,
});
```

For a catalog that rarely changes, like the shop's — 30-60 s. For realtime — 0 plus polling/WebSocket (react-intermediate).

---

## `isPending` vs `isLoading` vs `isFetching`

In **v5**:

| Flag | When it's true |
|------|------------|
| `isPending` | no data in cache, first fetch |
| `isLoading` | `isPending && isFetching` (a legacy term, still around) |
| `isFetching` | any fetch in flight (including background refetch) |

Show a skeleton on the **first** visit: `isPending`. A subtle indicator on refetch: `isFetching && !isPending`.

```tsx
if (isPending) return <Skeleton />;
// ...
{isFetching && !isPending && <span aria-live="polite">Refreshing…</span>}
```

In an interview, don't confuse v4 (`isLoading` = no data) with v5 (`isPending`).

---

## DevTools (optional)

```bash
npm i -D @tanstack/react-query-devtools
```

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

You can see keys, stale/fresh status, observers — invaluable for debugging the shop.

---

## Query for a single item

```tsx
function ItemDetail({ id }: { id: number }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["items", id],
    queryFn: ({ signal }) => api<Item>(`/api/v1/items/${id}`, { signal }),
    enabled: Number.isFinite(id),
  });
  // ...
}
```

`enabled: false` — don't fetch until there's a valid id (route params).

---

## Connection to FastAPI :8090

Same `api()` and `/api/v1/items` through the Vite proxy. Query doesn't change the contract — only the **cache and lifecycle**. OpenAPI: `:8090/docs`.

Mutations and invalidation — [21-mutations.md](21-mutations.md). CRUD lab — [22-lab-query.md](22-lab-query.md).

---

## Migrating from useEffect

```text
useState loading/error/data  →  useQuery flags + data
useEffect + abort            →  queryFn + signal
retry state                  →  refetch() / retry option
manual cache                 →  queryKey + staleTime
```

Remove the duplicate effect once the migration is verified working — don't leave both in place.

---

## Common mistakes

1. **Forgetting the Provider** — "No QueryClient set".

2. **Incomplete queryKey** — a filter lives in the URL, but the key is still `['items']` → wrong cache entry.

3. **queryFn that doesn't throw** — HTTP errors need to reject (your `api()` already throws).

4. **Copying the whole catalog into useState after the query** — duplicating server state.

5. **staleTime 0 everywhere** — unnecessary requests to `:8090`.

6. **Confusing isPending and isFetching** — the whole skeleton flashes on refetch.

---

## Summary

TanStack Query holds the shop API's **server state**: `useQuery` + `queryKey` + `queryFn`. It dedupes and caches across components. `staleTime` controls "freshness"; `gcTime` controls in-memory lifetime. In v5, the first load is `isPending`; a background refresh is `isFetching`. Wire up `QueryClientProvider` in `main.tsx` and migrate `ItemsList` from [19-lab-fetch-items.md](19-lab-fetch-items.md).

---

## Checklist

- Why is `queryKey` an array rather than a string?
- What happens with two `useQuery(['items'])` calls on mount?
- How does `staleTime` differ from `gcTime`?
- When should you show a skeleton: on `isPending` or `isFetching`?
- How does Query cancel a request on unmount?
- Where in the mock-exams project is the package already installed?

Next lesson: [21. Mutations and optimistic UI](21-mutations.md).
