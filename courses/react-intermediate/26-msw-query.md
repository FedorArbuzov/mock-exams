# 26. MSW + Query + переключение real/mock

## Сценарий с работы

Handlers готовы ([25-msw-handlers.md](25-msw-handlers.md)), MSW стартует ([24-msw-intro.md](24-msw-intro.md)). Проблема: разработчик переключил `VITE_USE_MSW=false`, но Query кэш от mock data — stale products. Другой баг: `queryKey` не включает `baseUrl`, flip mock/real без invalidate. Tech lead: «Единый API client, явный mock flag, reset Query on toggle, devtools label».

Эта глава связывает MSW с TanStack Query v5 ([06-query-advanced.md](06-query-advanced.md), [react-basic: Query](../react-basic/20-tanstack-query.md)) и auth ([10-auth-context.md](10-auth-context.md)).

## Что вы узнаете

- API client без веток mock в feature code
- Query keys и mock/real переключение
- `queryClient.clear()` vs `invalidateQueries`
- Devtools: distinguish mock data
- Prefetch и MSW delay
- Testing Query hooks с MSW node server

---

## Принцип: zero mock imports в features

```tsx
// ❌ features/products/useProducts.ts
import { MOCK_PRODUCTS } from "@/mocks/db";

// ✅ только api client
import { api } from "@/api/client";

export function useProducts(page = 1) {
  return useQuery({
    queryKey: ["products", { page }],
    queryFn: ({ signal }) =>
      api<PaginatedProducts>(`/api/v1/products/?page=${page}`, { signal }),
  });
}
```

MSW перехватывает тот же URL — feature не знает источник.

---

## Typed API client (recap)

Из [04-api-client.md](04-api-client.md):

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

Auth interceptor добавляет Bearer из [10-auth-context.md](10-auth-context.md) — одинаково для mock/real.

---

## Env и Vite proxy

| Mode | MSW | Request path |
|------|-----|--------------|
| `VITE_USE_MSW=true` | intercept | `/api/v1/...` |
| `VITE_USE_MSW=false` | off | proxy → `:8092` |

`queryKey` **не** должен включать `VITE_USE_MSW` если после toggle делаете `queryClient.clear()` — иначе duplicate cache entries.

---

## Toggle helper (dev only)

```tsx
// src/dev/mockToggle.ts
import { queryClient } from "@/app/queryClient";

export async function reloadMockMode(useMsw: boolean) {
  localStorage.setItem("VITE_USE_MSW", String(useMsw));
  queryClient.clear();
  window.location.reload(); // worker unregister/register проще full reload
}
```

MSW worker lifecycle — reload acceptable в dev panel.

Alternative без reload: `worker.stop()` / `worker.start()` + `queryClient.invalidateQueries()`.

---

## QueryClient defaults с MSW

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

При mock часто **отключают** refetch on focus — иначе лишние delayed requests в demo.

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

Mock login ([25-msw-handlers.md](25-msw-handlers.md)) возвращает те же поля что Django — AuthProvider не ветвится.

Refresh 401 scenario:

```tsx
// scenario auth-401 на refresh → logout cascade [12-refresh-flow.md](12-refresh-flow.md)
```

---

## Suspense queries + MSW delay

`useSuspenseQuery` suspend до MSW `delay` resolve — skeleton visible ([22-suspense-data.md](22-suspense-data.md)). Убедитесь Suspense boundary на route.

---

## Error integration

MSW 500 → Query `isError` → ErrorPanel ([16-global-error-ux.md](16-global-error-ux.md)). Scenario `products-500` для QA без ломания Django.

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

При mock в title страницы dev banner:

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

Mock и real **одинаковые keys** — после switch clear cache.

---

## Prefetch

```tsx
queryClient.prefetchQuery({
  queryKey: ["products", id],
  queryFn: ({ signal }) => api(`/api/v1/products/${id}/`, { signal }),
});
```

MSW handler для detail — [25-msw-handlers.md](25-msw-handlers.md). Delay prefetch — skeleton короче on navigate ([21-code-splitting.md](21-code-splitting.md)).

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

Тот же `useProducts` hook test — без browser worker. Полный курс — javascript-testing.

---

## MSW unhandled + Query

`onUnhandledRequest: "warn"` — Query retry on failed fetch если Django down и MSW off. Настройте retry не зациклить ([16-global-error-ux.md](16-global-error-ux.md)).

---

## Production build

MSW dynamic import только DEV ([24-msw-intro.md](24-msw-intro.md)):

```tsx
if (import.meta.env.DEV && useMock) {
  await import("./mocks/browser");
}
```

Production bundle **не** содержит handlers/db.

---

## Типичные ошибки

**Разные URL mock vs proxy** — `/api` vs full URL bypass.

**queryKey с `isMock`** без clear — duplicate stale entries.

**Feature import `@/mocks/db`** — breaks real API path.

**MSW handler не читает Authorization** — protected routes always 200 mock.

**Забыли invalidate auth on login** — old user products flash.

**Test server + browser worker одновременно** — duplicate handlers in e2e — pick one.

---

## Чек-лист

- [ ] Features use only `api()` client
- [ ] Toggle mock → clear Query cache
- [ ] Auth mock matches LoginResponse type
- [ ] queryKeys stable across modes
- [ ] MSW excluded from prod bundle

---

## Далее

Следующий урок: [27. Лаба: mock auth и products](27-lab-msw.md).
