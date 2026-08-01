# 24. TanStack Query in Next.js (client islands)

## Intro: a scenario from work

The SSR catalog ([15-lab-server-fetch.md](15-lab-server-fetch.md)) is great for SEO. But the "Recently viewed" sidebar needs to refresh every 30 seconds, the price filter should work without a full page reload, and the "Refresh" button shouldn't block the whole page. Rewriting everything as a Client Component with `useEffect` would be a step backward. The tech lead's call: "Server shell + a **client island** with TanStack Query."

TanStack Query ([react-basic/20-tanstack-query.md](../react-basic/20-tanstack-query.md)) in Next.js lives **only in Client Components**. The provider goes in a client wrapper layout. SSR prefetch + dehydrate is advanced material (react-intermediate); here we use a **hybrid**: server HTML for the first screen, Query for interactivity.

## What you'll learn

- Why Query is client-only
- `QueryClientProvider` in a client layout wrapper
- `useQuery` against the BFF `/api/proxy/items`
- `staleTime`, refetch, dedupe
- Server state vs. client state (cart — chapter 25)
- Prefetch overview (without full SSR dehydrate)
- The "Query everywhere on the site" anti-pattern

---

## Hybrid architecture

```text
app/catalog/page.tsx          Server Component — initial SSR list
components/catalog/
  CatalogRefreshPanel.tsx     "use client" + useQuery — live refresh
components/providers/
  QueryProvider.tsx           QueryClientProvider
app/layout.tsx                Server — wraps children with QueryProvider
```

| Data | Mechanism |
|--------|----------|
| First paint of the catalog | RSC `getItems()` |
| "Refresh" button | `refetch()` |
| Sidebar polling | `refetchInterval` |
| Cart | useState/Context (25) |

---

## QueryClientProvider wrapper

```tsx
// components/providers/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

type Props = { children: ReactNode };

export function QueryProvider({ children }: Props) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
```

```tsx
// app/layout.tsx — Server Component
import { QueryProvider } from "@/components/providers/QueryProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <QueryProvider>
          <header>...</header>
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
```

**One** `QueryClient` per app via `useState(() => new ...)` — don't create a new client on every render.

---

## API client for the BFF

```tsx
// lib/api/client.ts
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";
  const res = await fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text.slice(0, 120)}`);
  }

  return res.json() as Promise<T>;
}
```

Browser fetch goes to the same-origin BFF ([20-lab-route-handlers.md](20-lab-route-handlers.md)), not directly to `:8090`.

---

## `useQuery` in an island

```tsx
// components/catalog/CatalogRefreshPanel.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ItemsResponse } from "@/lib/api/types";

export function CatalogRefreshPanel() {
  const { data, isFetching, isError, error, refetch, dataUpdatedAt } =
    useQuery({
      queryKey: ["items"],
      queryFn: ({ signal }) =>
        api<ItemsResponse>("/items", { signal }),
    });

  return (
    <aside className="card">
      <h2>Live catalog (client)</h2>
      {isError ? (
        <p role="alert">{(error as Error).message}</p>
      ) : (
        <p className="muted">
          Items: {data?.total ?? "…"}
          {isFetching ? " (refreshing…)" : null}
        </p>
      )}
      <button type="button" onClick={() => refetch()}>
        Refresh
      </button>
      <small className="muted">
        Updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"}
      </small>
    </aside>
  );
}
```

```tsx
// app/catalog/page.tsx — add the island next to the SSR list
import { CatalogRefreshPanel } from "@/components/catalog/CatalogRefreshPanel";

export default async function CatalogPage() {
  const items = await getItems();
  return (
    <section>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1rem" }}>
        <div>{/* SSR list */}</div>
        <CatalogRefreshPanel />
      </div>
    </section>
  );
}
```

Two data sources here are **deliberate** for teaching purposes; in production, use either SSR+hydrate prefetch or a single source.

---

## Query keys

```tsx
queryKey: ["items"]
queryKey: ["items", { sale: true }]
queryKey: ["item", id]
```

The key is the cache identity. Filters are part of the key — otherwise you get stale, wrong data.

---

## Mutations (overview)

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

const qc = useQueryClient();
const mutation = useMutation({
  mutationFn: (id: number) => api(`/items/${id}`, { method: "DELETE" }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
});
```

For forms that work without JS, use Server Actions ([21-server-actions.md](21-server-actions.md)); Query mutations are for client UX.

---

## SSR prefetch (overview)

Advanced pattern (react-intermediate):

1. Server: `QueryClient` + `prefetchQuery` + `dehydrate`.
2. Pass `HydrationBoundary state={dehydrate(qc)}` to the client.
3. Client `useQuery` — instant cache, no loading flash.

In nextjs-basic, it's enough to understand **why** this exists — it removes the double fetch and the loading flash.

---

## DevTools (optional)

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// inside QueryProvider, dev only
{process.env.NODE_ENV === "development" ? (
  <ReactQueryDevtools initialIsOpen={false} />
) : null}
```

The devtools package is an optional dependency.

---

## Common mistakes

1. **`useQuery` in a Server Component** — build error.

2. **QueryClient outside `useState`** — cache resets on every render.

3. **Fetching `:8090` from the browser** — CORS; use the BFF instead.

4. **A single Query for the whole layout** — bloats the client bundle; use islands.

5. **Ignoring `staleTime`** — a refetch storm on every focus.

6. **Duplicating server cache and Query** without a strategy — confusing UX.

7. **Forgetting `signal` in queryFn** — stray requests after unmount.

8. **Server Actions + Query invalidate** — after an action, call `queryClient.invalidateQueries`.

---

## Checklist

- Why is QueryProvider `"use client"`?
- Where does the browser fetch get the API URL from?
- How does server-side `getItems()` differ from `useQuery`?
- Why do we need `queryKey`?
- What does `staleTime: 30_000` do?
- When should you use a mutation vs. a Server Action?
- What is dehydrate/hydrate (overview)?

Next lesson: [25. Lab: cart and client state](25-lab-client-state.md).
