# 04. Typed API client: interceptors, ApiError

## Real-world scenario

Integration with Django :8092. QA: "On a 500 it shows `[object Object]`." Backend: "401 with no body." In react-basic the `api()` from [17-fetch-react.md](../react-basic/17-fetch-react.md) threw an `Error` with text — that was enough for items. The admin SPA needs a **single** layer: typed JSON, parsing DRF errors, the `Authorization` header, refresh retry ([12-refresh-flow.md](12-refresh-flow.md)).

Code review: "Don't smear `fetch` across the hooks — one `api/client.ts`." This lesson is the foundation for the Query hooks, auth, and MSW handlers.

## What you'll learn

- The `api<T>()` wrapper over `fetch` with generics.
- The **ApiError** class and parsing DRF/FastAPI bodies.
- The base URL and the Vite proxy `/api`.
- The interceptor pattern for the auth header (without React).
- Testing the client against :8092 and MSW.

---

## Why not raw fetch in every hook

```tsx
// ✗ anti-pattern
function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/v1/products/");
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
  });
}
```

Problems: duplicated `ok` checks, inconsistent error parsing, a forgotten `Content-Type`, no `signal`, hard to add JWT.

**Solution:** one `api/` module — all HTTP goes through it.

---

## ApiError

```typescript
// api/errors.ts
export type ApiErrorBody = {
  detail?: string | string[];
  [field: string]: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    let body: ApiErrorBody | null = null;
    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      try {
        body = (await res.json()) as ApiErrorBody;
      } catch {
        body = null;
      }
    }

    const message = extractMessage(body) ?? res.statusText ?? `HTTP ${res.status}`;
    return new ApiError(res.status, message, body);
  }
}

function extractMessage(body: ApiErrorBody | null): string | undefined {
  if (!body?.detail) return undefined;
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) return body.detail.join(", ");
  return undefined;
}
```

The UI can show `error.message` or field errors from `body` ([28-forms-rhf.md](28-forms-rhf.md)).

---

## api<T>() — the core of the client

```typescript
// api/client.ts
import { ApiError } from "./errors";

type ApiOptions = RequestInit & {
  /** Skip JSON parse (e.g. 204) */
  raw?: boolean;
};

let getAccessToken: (() => string | null) | null = null;

/** Inject from auth module — avoids circular imports */
export function setAccessTokenGetter(fn: () => string | null) {
  getAccessToken = fn;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { raw, headers, ...init } = options;

  const token = getAccessToken?.();
  const mergedHeaders = new Headers(headers);

  if (token) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  const res = await fetch(path, {
    ...init,
    headers: mergedHeaders,
  });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  if (raw || res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
```

**Base URL:** a relative `/api/v1/...` — the Vite proxy to :8092 ([00-environment.md](00-environment.md)). In production it's the same origin behind nginx ([36-production-build.md](36-production-build.md)).

---

## Usage in Query

```typescript
// features/products/hooks/useProductsQuery.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Paginated, Product } from "@/api/types/product";

export function useProductsQuery(params: URLSearchParams) {
  return useQuery({
    queryKey: ["products", params.toString()],
    queryFn: ({ signal }) =>
      api<Paginated<Product>>(`/api/v1/products/?${params}`, { signal }),
  });
}
```

Query passes down the `signal` — cancellation on unmount ([20-tanstack-query.md](../react-basic/20-tanstack-query.md)).

---

## Mutations and POST

```typescript
// features/auth/hooks/useLoginMutation.ts
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { LoginResponse } from "@/api/types/auth";

type LoginInput = { email: string; password: string };

export function useLoginMutation() {
  return useMutation({
    mutationFn: (body: LoginInput) =>
      api<LoginResponse>("/api/v1/auth/login/", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}
```

The trailing slash `/login/` is a DRF convention; without the slash a redirect is possible.

---

## Interceptor pattern (auth)

The client does **not** import React. The auth module registers a getter:

```typescript
// features/auth/tokenStore.ts — preview, details in 09–12
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (t: string | null) => {
    accessToken = t;
  },
};

// main.tsx or AuthProvider mount
import { setAccessTokenGetter } from "@/api/client";
import { tokenStore } from "@/features/auth/tokenStore";

setAccessTokenGetter(() => tokenStore.get());
```

The refresh interceptor — [12-refresh-flow.md](12-refresh-flow.md).

---

## The auth and product types

```typescript
// api/types/auth.ts
export type User = {
  id: number;
  email: string;
  role: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  user: User;
};

// api/types/product.ts
export type Product = {
  id: number;
  sku: string;
  title: string;
  price: string;
  is_active: boolean;
  category: { slug: string; name: string };
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
```

Keep these in sync with the Django serializers and [`mocks/handlers.ts`](examples/src/mocks/handlers.ts).

---

## Error handling in the UI

```tsx
function ProductsPage() {
  const query = useProductsQuery(new URLSearchParams());

  if (query.isError) {
    const err = query.error;
    const message =
      err instanceof ApiError
        ? err.message
        : "Failed to load the catalog";
    return (
      <div role="alert">
        <p>{message}</p>
        {err instanceof ApiError && err.status === 401 && (
          <p>Sign-in required.</p>
        )}
        <button type="button" onClick={() => query.refetch()}>
          Retry
        </button>
      </div>
    );
  }
  // ...
}
```

`instanceof ApiError` is more reliable than parsing a string.

---

## MSW and the client

MSW intercepts the same `fetch` — the client **doesn't change**:

```bash
VITE_ENABLE_MSW=true npm run dev
```

The handler returns JSON of the same shape as Django. The client has no idea about the mock.

---

## Comparison with FastAPI :8090

| | react-basic | react-intermediate |
|---|-------------|-------------------|
| Path | `/api/v1/items` | `/api/v1/products/` |
| List type | `Item[]` | `Paginated<Product>` |
| Auth header | none | Bearer access |

One client pattern — different types ([18-cors-fastapi.md](../react-basic/18-cors-fastapi.md)).

---

## Common mistakes

1. **Forgot `throw` on !ok** — Query treats the error as a success.

2. **`res.json()` twice** — the body stream is consumed; use `ApiError.fromResponse`.

3. **Circular import** — client → AuthContext → client. The injection getter solves it.

4. **Hardcoding `http://localhost:8092`** — breaks the proxy and production; use only `/api/...`.

5. **Ignoring the trailing slash** — a 301 on a POST breaks some clients.

6. **Generic `api<any>`** — you lose the types; specify `Product`, `Paginated<Product>`.

---

## Checklist

- [ ] `ApiError` parses the DRF `detail`
- [ ] `api<T>()` adds the JSON Content-Type for a body
- [ ] `setAccessTokenGetter` is registered (a stub is fine before auth)
- [ ] Query hooks use `api`, not raw fetch
- [ ] MSW and Django work with the same client

## Next

Next lesson: [05. Pagination, filters, the DRF contract](05-pagination-filters.md).
