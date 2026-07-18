# 04. Typed API client: interceptors, ApiError

## Сценарий с работы

Интеграция с Django :8092. QA: «При 500 показывается `[object Object]`». Backend: «401 без тела». В react-basic `api()` из [17-fetch-react.md](../react-basic/17-fetch-react.md) бросал `Error` с текстом — хватало для items. Admin SPA нужен **единый** слой: типизированный JSON, парсинг DRF errors, заголовок `Authorization`, retry refresh ([12-refresh-flow.md](12-refresh-flow.md)).

Code review: «Не размазывайте `fetch` по hooks — один `api/client.ts`». Этот урок — фундамент для Query hooks, auth и MSW handlers.

## Что вы узнаете

- Обёртка `api<T>()` над `fetch` с generics.
- Класс **ApiError** и разбор DRF/FastAPI тел.
- Базовый URL и Vite proxy `/api`.
- Interceptor pattern для auth header (без React).
- Тестирование client против :8092 и MSW.

---

## Зачем не голый fetch в каждом hook

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

Проблемы: дублирование проверки `ok`, разный парсинг ошибок, забытый `Content-Type`, нет `signal`, сложно добавить JWT.

**Решение:** один модуль `api/` — все HTTP через него.

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

UI может показать `error.message` или field errors из `body` ([28-forms-rhf.md](28-forms-rhf.md)).

---

## api<T>() — ядро client

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

**Base URL:** относительный `/api/v1/...` — Vite proxy на :8092 ([00-environment.md](00-environment.md)). Production — тот же origin за nginx ([36-production-build.md](36-production-build.md)).

---

## Использование в Query

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

Query пробрасывает `signal` — отмена при unmount ([20-tanstack-query.md](../react-basic/20-tanstack-query.md)).

---

## Mutations и POST

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

Trailing slash `/login/` — convention DRF; без slash возможен redirect.

---

## Interceptor pattern (auth)

Client **не** импортирует React. Auth модуль регистрирует getter:

```typescript
// features/auth/tokenStore.ts — preview, детали в 09–12
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (t: string | null) => {
    accessToken = t;
  },
};

// main.tsx или AuthProvider mount
import { setAccessTokenGetter } from "@/api/client";
import { tokenStore } from "@/features/auth/tokenStore";

setAccessTokenGetter(() => tokenStore.get());
```

Refresh interceptor — [12-refresh-flow.md](12-refresh-flow.md).

---

## Типы auth и product

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

Согласуйте с Django serializers и [`mocks/handlers.ts`](examples/src/mocks/handlers.ts).

---

## Обработка ошибок в UI

```tsx
function ProductsPage() {
  const query = useProductsQuery(new URLSearchParams());

  if (query.isError) {
    const err = query.error;
    const message =
      err instanceof ApiError
        ? err.message
        : "Не удалось загрузить каталог";
    return (
      <div role="alert">
        <p>{message}</p>
        {err instanceof ApiError && err.status === 401 && (
          <p>Требуется вход.</p>
        )}
        <button type="button" onClick={() => query.refetch()}>
          Повторить
        </button>
      </div>
    );
  }
  // ...
}
```

`instanceof ApiError` — надёжнее, чем парсить строку.

---

## MSW и client

MSW перехватывает тот же `fetch` — client **не меняется**:

```bash
VITE_ENABLE_MSW=true npm run dev
```

Handler возвращает JSON той же формы, что Django. Client не знает про mock.

---

## Сравнение с FastAPI :8090

| | react-basic | react-intermediate |
|---|-------------|-------------------|
| Path | `/api/v1/items` | `/api/v1/products/` |
| List type | `Item[]` | `Paginated<Product>` |
| Auth header | нет | Bearer access |

Один client pattern — разные types ([18-cors-fastapi.md](../react-basic/18-cors-fastapi.md)).

---

## Типичные ошибки

1. **Забыли `throw` на !ok** — Query считает ошибку успехом.

2. **`res.json()` дважды** — body stream consumed; используйте `ApiError.fromResponse`.

3. **Circular import** — client → AuthContext → client. Injection getter решает.

4. **Hardcode `http://localhost:8092`** — ломает proxy и production; только `/api/...`.

5. **Игнор trailing slash** — 301 на POST ломает некоторые клиенты.

6. **Generic `api<any>`** — теряете типы; задайте `Product`, `Paginated<Product>`.

---

## Чек-лист

- [ ] `ApiError` парсит DRF `detail`
- [ ] `api<T>()` добавляет JSON Content-Type для body
- [ ] `setAccessTokenGetter` зарегистрирован (можно stub до auth)
- [ ] Query hooks используют `api`, не raw fetch
- [ ] MSW и Django работают с одним client

## Далее

Следующий урок: [05. Пагинация, фильтры, DRF контракт](05-pagination-filters.md).
