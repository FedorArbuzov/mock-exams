# 12. Refresh flow: queue, race, logout cascade

## A scenario from the field

Prod incident: "Admin SPA spits out 401 every 15 minutes, users are mashing F5." Log analysis: access expired, **five parallel** `POST /auth/refresh/` calls — products, categories, user profile, notifications, stats — racing on refresh token rotation. The backend invalidates the old refresh token — everyone except the first gets a 401 → mass logout.

Ticket **AUTH-44**: single-flight refresh + retry original requests + logout cascade. This is the classic JWT SPA problem after [08-jwt-basics.md](08-jwt-basics.md) and [09-token-storage.md](09-token-storage.md).

## What you'll learn

- Interceptor pattern: 401 → refresh → retry.
- **Single-flight** queue — only one refresh in flight.
- Race conditions and token rotation.
- Logout cascade on failed refresh.
- Integration with `api/client.ts` ([04-api-client.md](04-api-client.md)).

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

**Single-flight:** the first 401 kicks off a refresh; the rest **wait** on that same Promise; after success — retry all with the new access token.

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

Extending [04-api-client.md](04-api-client.md):

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

The refresh endpoint must use `_skipAuthRetry: true` or a separate raw fetch to avoid an infinite loop:

```typescript
// inside refreshAccessToken — use raw fetch without interceptor
const res = await fetch("/api/v1/auth/refresh/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ refresh }),
});
```

Cleaner: split into `authFetch` vs `api` — team's call.

---

## Wire up the logout cascade

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

One failed refresh → **global** logout — the user re-authenticates.

---

## Retrying the original request

After refresh, `doFetch()` repeats the **same** path/body. Idempotent GET is safe. Retrying POST — be careful (duplicate creates). Pattern:

```typescript
if (res.status === 401 && init.method && init.method !== "GET" && init.method !== "HEAD") {
  // optional: don't auto-retry mutations
}
```

Admin: auto-retry GET only; mutations show "session expired, retry manually."

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

Fewer user-visible 401s when the tab is idle.

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

Test: shorten the mock access expiry by returning 401 on products until refresh is called.

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

Query retry + auth retry — risk of double retry. Configure:

```typescript
queries: { retry: (count, error) => {
  if (error instanceof ApiError && error.status === 401) return false;
  return count < 1;
}},
```

Let the **client interceptor** handle the 401 refresh; Query refetches automatically after success if you `throw` and the retry resolves.

Alternative: `queryClient.invalidateQueries()` after refresh — heavy-handed.

---

## Bootstrap vs interceptor

[10-auth-context.md](10-auth-context.md) bootstraps on load — same `refreshAccessToken()` function. Reuse the queue — no duplicate refresh on mount plus first API call.

---

## Token rotation

If Django returns a **new refresh token** on refresh:

```typescript
const data = await api<{ access: string; refresh?: string }>(...);
tokenStore.setAccess(data.access);
if (data.refresh) tokenStore.setTokens(data.access, data.refresh);
```

Miss the new refresh token → the next refresh fails → logout.

---

## Common mistakes

1. **Parallel refresh** — no single-flight queue.

2. **Refresh triggers itself** — infinite 401 loop.

3. **Blindly retrying POST** — duplicate records.

4. **401 without a refresh token** — should logout immediately, not refresh.

5. **Forgetting onAuthFailure** — UI stuck "authenticated" while all API calls fail.

6. **Race: logout during refresh** — cancel or ignore the stale refresh result.

---

## Checklist

- [ ] Single-flight `refreshPromise`
- [ ] 401 → refresh → retry GET
- [ ] Failed refresh → logout + navigate to login
- [ ] Refresh endpoint bypasses the interceptor
- [ ] MSW handler for refresh
- [ ] Query retry not fighting the interceptor

## Next

Next lesson: [13. Lab: login and a guarded section](13-lab-auth.md).
