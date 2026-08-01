# 26. MSW + Query + switching real/mock

## A story from work

The handlers are ready ([25-msw-handlers.md](25-msw-handlers.md)), MSW starts up ([24-msw-intro.md](24-msw-intro.md)). Problem: a developer switched `VITE_USE_MSW=false`, but the Query cache from mock data shows stale products. Another bug: `queryKey` doesn't include `baseUrl`, so flipping mock/real without invalidate is broken. Tech lead: "One API client, an explicit mock flag, reset Query on toggle, a devtools label."

This chapter connects MSW with TanStack Query v5 ([06-query-advanced.md](06-query-advanced.md), [react-basic: Query](../react-basic/20-tanstack-query.md)) and auth ([10-auth-context.md](10-auth-context.md)).

## What you'll learn

- An API client with no mock branches in feature code
- Query keys and mock/real switching
- `queryClient.clear()` vs `invalidateQueries`
- Devtools: distinguishing mock data
- Prefetch and MSW delay
- Testing Query hooks with the MSW node server

---

## Principle: zero mock imports in features

```tsx
// ❌ features/products/useProducts.ts
import { MOCK_PRODUCTS } from "@/mocks/db";

// ✅ only the api client
import { api } from "@/api/client";

export function useProducts(page = 1) {
  return useQuery({
    queryKey: ["products", { page }],
    queryFn: ({ signal }) =>
      api<PaginatedProducts>(`/api/v1/products/?page=${page}`, { signal }),
  });
}
```

MSW intercepts the same URL — the feature doesn't know the source.

---

## Typed API client (recap)

From [04-api-client.md](04-api-client.md):

```tsx
const baseUrl = import.meta.env.VITE_API_BASE ?? "";

export async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.detail ?? res.statusText, res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
```

The auth interceptor adds the Bearer from [10-auth-context.md](10-auth-context.md) — the same for mock/real.

---

## Env and the Vite proxy

| Mode | MSW | Request path |
|------|-----|--------------|
| `VITE_USE_MSW=true` | intercept | `/api/v1/...` |
| `VITE_USE_MSW=false` | off | proxy → `:8092` |

`queryKey` should **not** include `VITE_USE_MSW` if you run `queryClient.clear()` after a toggle — otherwise you get duplicate cache entries.

---

## Toggle helper (dev only)

```tsx
// src/dev/mockToggle.ts
import { queryClient } from "@/app/queryClient";

export async function reloadMockMode(useMsw: boolean) {
  localStorage.setItem("VITE_USE_MSW", String(useMsw));
  queryClient.clear();
  window.location.reload(); // a full reload is simpler than worker unregister/register
}
```

MSW worker lifecycle — a reload is acceptable in a dev panel.

Alternative without a reload: `worker.stop()` / `worker.start()` + `queryClient.invalidateQueries()`.

---

## QueryClient defaults with MSW

```tsx
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: import.meta.env.VITE_USE_MSW !== "true",
    },
  },
});
```

With a mock, refetch on focus is often **disabled** — otherwise extra delayed requests in the demo.

---

## Auth + MSW

Login mutation:

```tsx
export function useLogin() {
  const queryClient = useQueryClient();
  const { setSession } = useAuth();

  return useMutation({
    mutationFn: (body: LoginInput) =>
      api<LoginResponse>("/api/v1/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      setSession(data);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
```

Mock login ([25-msw-handlers.md](25-msw-handlers.md)) returns the same fields as Django — AuthProvider doesn't branch.

Refresh 401 scenario:

```tsx
// scenario auth-401 on refresh → logout cascade [12-refresh-flow.md](12-refresh-flow.md)
```

---

## Suspense queries + MSW delay

`useSuspenseQuery` suspends until the MSW `delay` resolves — the skeleton is visible ([22-suspense-data.md](22-suspense-data.md)). Make sure there's a Suspense boundary on the route.

---

## Error integration

MSW 500 → Query `isError` → ErrorPanel ([16-global-error-ux.md](16-global-error-ux.md)). The `products-500` scenario for QA without breaking Django.

```tsx
const scenario = getMockScenario();
// handler returns 500
```

Toast on mutation error — unchanged.

---

## React Query Devtools

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

{import.meta.env.DEV && (
  <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
)}
```

With a mock, a dev banner in the page title:

```tsx
{import.meta.env.VITE_USE_MSW === "true" && (
  <div className="dev-banner">API: MSW mock</div>
)}
```

---

## queryKey conventions

```tsx
["products", { page, search }]     // list
["products", productId]            // detail
["auth", "me"]                     // current user
```

Mock and real use the **same keys** — after a switch, clear the cache.

---

## Prefetch

```tsx
queryClient.prefetchQuery({
  queryKey: ["products", id],
  queryFn: ({ signal }) => api(`/api/v1/products/${id}/`, { signal }),
});
```

MSW handler for detail — [25-msw-handlers.md](25-msw-handlers.md). Delay the prefetch — a shorter skeleton on navigate ([21-code-splitting.md](21-code-splitting.md)).

---

## Vitest + MSW node (preview)

```tsx
import { setupServer } from "msw/node";
import { handlers } from "@/mocks/handlers";

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

The same `useProducts` hook test — without a browser worker. Full course — javascript-testing.

---

## MSW unhandled + Query

`onUnhandledRequest: "warn"` — Query retries on a failed fetch if Django is down and MSW is off. Configure retry not to loop ([16-global-error-ux.md](16-global-error-ux.md)).

---

## Production build

MSW dynamic import DEV only ([24-msw-intro.md](24-msw-intro.md)):

```tsx
if (import.meta.env.DEV && useMock) {
  await import("./mocks/browser");
}
```

The production bundle does **not** contain handlers/db.

---

## Common mistakes

**Different URLs mock vs proxy** — `/api` vs a full URL bypass.

**queryKey with `isMock`** without clear — duplicate stale entries.

**Feature imports `@/mocks/db`** — breaks the real API path.

**MSW handler doesn't read Authorization** — protected routes always 200 mock.

**Forgot to invalidate auth on login** — old user's products flash.

**Test server + browser worker at the same time** — duplicate handlers in e2e — pick one.

---

## Checklist

- [ ] Features use only the `api()` client
- [ ] Toggle mock → clear the Query cache
- [ ] Auth mock matches the LoginResponse type
- [ ] queryKeys stable across modes
- [ ] MSW excluded from the prod bundle

---

## Next

Next lesson: [27. Lab: mock auth and products](27-lab-msw.md).
