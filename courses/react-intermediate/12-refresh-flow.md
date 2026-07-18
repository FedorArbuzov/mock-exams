# 12. Refresh flow: очередь, race, logout cascade

## Сценарий с работы

Prod incident: «Admin SPA каждые 15 минут сыпет 401, пользователи жмут F5». Log analysis: access expired, **пять параллельных** `POST /auth/refresh/` — products, categories, user profile, notifications, stats — race на refresh token rotation. Backend invalidates old refresh — все кроме первого получают 401 → mass logout.

Ticket **AUTH-44**: single-flight refresh + retry original requests + logout cascade. Это классика JWT SPA после [08-jwt-basics.md](08-jwt-basics.md) и [09-token-storage.md](09-token-storage.md).

## Что вы узнаете

- Interceptor pattern: 401 → refresh → retry.
- **Single-flight** queue — один refresh in flight.
- Race conditions и token rotation.
- Logout cascade при failed refresh.
- Integration с `api/client.ts` ([04-api-client.md](04-api-client.md)).

---

## Problem: thundering herd

```text
Access expired
  ├── GET /products     → 401
  ├── GET /categories   → 401
  └── GET /stats        → 401

Naive client:
  ├── POST /refresh  (×3 parallel)
  └── chaos
```

**Single-flight:** первый 401 запускает refresh; остальные **ждут** тот же Promise; после success — retry all with new access.

---

## refreshQueue module

```typescript
// features/auth/refreshQueue.ts
import { api } from "@/api/client";
import { tokenStore } from "./tokenStore";

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  const refresh = tokenStore.getRefresh();
  if (!refresh) throw new Error("No refresh token");

  refreshPromise = (async () => {
    try {
      const { access } = await api<{ access: string }>("/api/v1/auth/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
        // important: this call must NOT trigger auth interceptor retry loop
      });
      tokenStore.setAccess(access);
      return access;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
```

---

## api client with auth interceptor

Расширение [04-api-client.md](04-api-client.md):

```typescript
// api/client.ts (extended)
import { refreshAccessToken } from "@/features/auth/refreshQueue";
import { tokenStore } from "@/features/auth/tokenStore";

type ApiOptions = RequestInit & {
  raw?: boolean;
  /** internal: skip refresh retry */
  _skipAuthRetry?: boolean;
};

let onAuthFailure: (() => void) | null = null;

export function setOnAuthFailure(fn: () => void) {
  onAuthFailure = fn;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { raw, _skipAuthRetry, headers, ...init } = options;

  async function doFetch(): Promise<Response> {
    const token = tokenStore.getAccess();
    const mergedHeaders = new Headers(headers);
    if (token) mergedHeaders.set("Authorization", `Bearer ${token}`);
    if (init.body && !mergedHeaders.has("Content-Type")) {
      mergedHeaders.set("Content-Type", "application/json");
    }
    return fetch(path, { ...init, headers: mergedHeaders });
  }

  let res = await doFetch();

  if (res.status === 401 && !_skipAuthRetry && tokenStore.getRefresh()) {
    try {
      await refreshAccessToken();
      res = await doFetch();
    } catch {
      onAuthFailure?.();
      throw await ApiError.fromResponse(res);
    }
  }

  if (!res.ok) throw await ApiError.fromResponse(res);
  if (raw || res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
```

Refresh endpoint must use `_skipAuthRetry: true` or separate raw fetch to avoid infinite loop:

```typescript
// inside refreshAccessToken — use raw fetch without interceptor
const res = await fetch("/api/v1/auth/refresh/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ refresh }),
});
```

Cleaner: `authFetch` vs `api` split — team choice.

---

## Wire logout cascade

```tsx
// AuthProvider useEffect
import { setOnAuthFailure } from "@/api/client";

useEffect(() => {
  setOnAuthFailure(() => {
    logout(); // clears tokens, query, status
    navigate("/login", { replace: true });
  });
}, [logout, navigate]);
```

One failed refresh → **global** logout — user re-authenticates.

---

## Retry original request

After refresh, `doFetch()` repeats **same** path/body. Idempotent GET safe. POST retry — осторожно (duplicate create). Pattern:

```typescript
if (res.status === 401 && init.method && init.method !== "GET" && init.method !== "HEAD") {
  // optional: don't auto-retry mutations
}
```

Admin: auto-retry GET only; mutations show «session expired, retry manually».

---

## Proactive refresh (optional)

```typescript
// AuthProvider interval
useEffect(() => {
  const id = setInterval(async () => {
    const access = tokenStore.getAccess();
    if (access && isExpired(access, 60)) {
      try {
        await refreshAccessToken();
      } catch {
        /* onAuthFailure handles */
      }
    }
  }, 30_000);
  return () => clearInterval(id);
}, []);
```

Меньше user-visible 401 on tab idle.

---

## MSW refresh handler

```typescript
// mocks/handlers.ts
http.post("/api/v1/auth/refresh/", async ({ request }) => {
  const body = (await request.json()) as { refresh: string };
  if (body.refresh === "mock-refresh-token") {
    return HttpResponse.json({ access: "mock-access-token-refreshed" });
  }
  return HttpResponse.json({ detail: "Token invalid" }, { status: 401 });
}),
```

Test: shorten mock access expiry by returning 401 on products until refresh called.

---

## Sequence diagram

```text
Component A ──GET /products──► 401
Component B ──GET /categories──► 401
        │
        ├─► refreshQueue.refreshAccessToken()  [single flight]
        │         POST /refresh → new access
        │
        ├─► retry GET /products → 200
        └─► retry GET /categories → 200
```

---

## Interaction with TanStack Query

Query retry + auth retry — double retry risk. Configure:

```typescript
queries: { retry: (count, error) => {
  if (error instanceof ApiError && error.status === 401) return false;
  return count < 1;
}},
```

Let **client interceptor** handle 401 refresh; Query refetch after success automatically if you `throw` then retry resolves.

Alternative: `queryClient.invalidateQueries()` after refresh — heavy-handed.

---

## Bootstrap vs interceptor

[10-auth-context.md](10-auth-context.md) bootstrap on load — same `refreshAccessToken()` function. Reuse queue — no duplicate refresh on mount + first API call.

---

## Token rotation

If Django returns **new refresh** on refresh:

```typescript
const data = await api<{ access: string; refresh?: string }>(...);
tokenStore.setAccess(data.access);
if (data.refresh) tokenStore.setTokens(data.access, data.refresh);
```

Miss new refresh → next refresh fails → logout.

---

## Типичные ошибки

1. **Parallel refresh** — no single-flight queue.

2. **Refresh triggers itself** — infinite 401 loop.

3. **Retry POST blindly** — duplicate records.

4. **401 without refresh token** — should logout immediately, not refresh.

5. **Forget onAuthFailure** — stuck UI authenticated but all API fail.

6. **Race: logout during refresh** — cancel or ignore stale refresh result.

---

## Чек-лист

- [ ] Single-flight `refreshPromise`
- [ ] 401 → refresh → retry GET
- [ ] Failed refresh → logout + navigate login
- [ ] Refresh endpoint bypasses interceptor
- [ ] MSW handler for refresh
- [ ] Query retry не fighting interceptor

## Далее

Следующий урок: [13. Лаба: login и guarded раздел](13-lab-auth.md).
