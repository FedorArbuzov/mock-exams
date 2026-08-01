# 16. Global error UX: toasts, retry, offline

## Real-world scenario

Staging admin SPA. Three different screens show errors **differently**: products — a red `<div role="alert">`, settings — `alert()`, login — silence in the console. The user is confused: "Is this temporary, or should I call support?" Mobile LTE drops out — the "Save" form spins its spinner forever because the mutation doesn't handle offline.

Product owner: "We need a **unified** policy: a toast for recoverable, full-page for fatal, retry where it makes sense, an offline banner." You've already separated the boundary and Query ([14-error-boundaries.md](14-error-boundaries.md), [15-boundaries-router.md](15-boundaries-router.md)); now the **UX layer** on top of [04-api-client.md](04-api-client.md) and [react-basic: UI states](../react-basic/31-ui-states.md).

## What you'll learn

- Classifying errors: recoverable vs fatal vs auth
- Toast/inline/banner/modal — when to use which
- Retry: exponential backoff, idempotency, `refetch` vs `mutate`
- Offline detection: `navigator.onLine`, the `online`/`offline` events
- Global handlers in the API client and Query `MutationCache`
- Accessibility: `role="alert"`, focus management

---

## Classification for an admin SPA

| Class | Example | UX |
|-------|--------|-----|
| **Transient network** | timeout, 502 | Toast + "Retry" |
| **Validation** | 400 DRF `{ field: [...] }` | Inline next to the form field ([28-forms-rhf.md](28-forms-rhf.md)) |
| **Auth** | 401 after a failed refresh | Redirect to login ([12-refresh-flow.md](12-refresh-flow.md)) |
| **Forbidden** | 403 | "No access" page |
| **Not found** | 404 product | Empty state + link back |
| **Render bug** | null.slug | Error boundary fallback |
| **Offline** | `navigator.onLine === false` | Sticky banner, disable mutations |

A single HTTP 500 is **not** always a toast: the products list — an inline error panel with refetch; a background prefetch — a silent retry.

---

## The toast layer (a minimal implementation)

In [`examples/`](examples/package.json) there's no heavy UI lib — a context + portal is enough:

```tsx
// src/shared/notifications/ToastProvider.tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Toast = {
  id: string;
  variant: "error" | "success" | "info";
  message: string;
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  push: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6_000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`toast toast--${t.variant}`}>
            <span>{t.message}</span>
            {t.action ? (
              <button type="button" onClick={t.action.onClick}>
                {t.action.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast requires ToastProvider");
  return ctx;
}
```

**`aria-live="polite"`** — the screen reader announces new toasts without stealing focus. For **critical** blocking errors prefer an inline `role="alert"`, not a toast.

Mount `ToastProvider` in `main.tsx` **inside** `AuthProvider`, so a toast can trigger logout.

---

## Global API error mapping

Extend the interceptor from [04-api-client.md](04-api-client.md):

```tsx
// src/api/client.ts — fragment
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      body?.detail ?? res.statusText,
      res.status,
      body,
    );
  }
  return res.json() as Promise<T>;
}
```

A **`useApiErrorToast`** hook for mutations:

```tsx
export function useApiErrorToast() {
  const { push } = useToast();

  return useCallback(
    (error: unknown, retry?: () => void) => {
      if (error instanceof ApiError) {
        if (error.status === 401) return; // the refresh flow already handled it
        if (error.status >= 500) {
          push({
            variant: "error",
            message: "The server is temporarily unavailable",
            action: retry ? { label: "Retry", onClick: retry } : undefined,
          });
          return;
        }
      }
      push({
        variant: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    },
    [push],
  );
}
```

---

## Query: default retry and global onError

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 404) return false;
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error, _vars, _ctx, mutation) => {
        // optional: centralized log
        console.error("mutation failed", mutation.options.mutationKey, error);
      },
    },
  },
});
```

On the products page you should **still** show the `isError` UI ([react-basic: TanStack Query](../react-basic/20-tanstack-query.md)) — a global retry doesn't replace the local context "Failed to load the catalog".

---

## Offline banner

```tsx
import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

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

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div role="alert" className="offline-banner">
      No internet connection. Changes will be saved when the connection returns.
    </div>
  );
}
```

In mutations check `navigator.onLine` **before** submit, or use `networkMode: 'offlineFirst'` in Query v5 for PWA scenarios (an admin SPA more often blocks the button):

```tsx
const createProduct = useMutation({
  mutationFn: createProductApi,
  networkMode: "always",
  onMutate: () => {
    if (!navigator.onLine) {
      throw new Error("OFFLINE");
    }
  },
});
```

---

## Retry patterns

### Query refetch

```tsx
const { refetch, isFetching } = useProducts();

<button
  type="button"
  disabled={isFetching}
  onClick={() => refetch()}
>
  {isFetching ? "Loading…" : "Retry"}
</button>
```

### Mutation retry (carefully)

A POST create is **not** idempotent — don't auto-retry it 3 times. DELETE/PUT with an idempotency key — fine. A DRF POST `/api/v1/products/` without a key — only a manual retry by the user.

### Exponential backoff for polling

From [06-query-advanced.md](06-query-advanced.md): increasing `refetchInterval` on errors — advanced; for admin a fixed Query retry is enough.

---

## A unified `ErrorPanel` component

```tsx
type ErrorPanelProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorPanel({
  title,
  message,
  onRetry,
  retryLabel = "Retry",
}: ErrorPanelProps) {
  return (
    <div role="alert" className="error-panel">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
```

Use it in:
- Query list error
- Route `errorElement` ([15-boundaries-router.md](15-boundaries-router.md))
- Boundary fallback (with a different title)

---

## Logging without PII

In the global handler, send:
- the correlation id (the `X-Request-Id` header from Django)
- route path, HTTP method, status
- **do not** send: password, refresh token, full JWTs

Connection with [35-security-client.md](35-security-client.md) — we'll dig deeper into CSP and XSS later; errors must not render an API's `error.message` as HTML.

---

## Common mistakes

**"All errors in a toast."** The user missed the toast — doesn't know why the form didn't save. Validation — inline.

**"An alert() left over from dev in production."** Replace it with a toast or an ErrorPanel.

**"Retry a mutation on a 400 validation."** It will create duplicates or an infinite fail loop.

**"Offline = only a banner, buttons active."** Frustration on silent failures — disable or queue (out of scope).

**"A toast without aria-live."** An accessibility audit fail.

**"One text for 401 and 500."** 401 → the login flow from [10-auth-context.md](10-auth-context.md).

---

## Checklist

- [ ] List 4 classes of errors and the appropriate UX for each
- [ ] Why a POST create isn't auto-retried
- [ ] Where ToastProvider sits in the provider tree
- [ ] How the Query `retry` function distinguishes a 404 from a 502
- [ ] Why `OfflineBanner` + a disabled submit

---

## Next

Next lesson: [17. Lab: fallback UI and route errors](17-lab-errors.md) — you'll assemble error boundaries, Router, and Query reset in [`examples/`](examples/src/).
