# 25. Handlers, scenarios, задержки и ошибки

## Сценарий с работы

MSW включён ([24-msw-intro.md](24-msw-intro.md)) — login и products работают offline. QA просит сценарии: «401 на expired token», «500 на save», «slow 3G catalog». Hardcode в компонентах неприемлем. Вы расширяете [`handlers.ts`](examples/src/mocks/handlers.ts): **`delay`**, conditional responses, **`http.post` reset**, сценарии через query/header/cookie.

Цель — один файл handlers + runtime switch для демо error UX ([16-global-error-ux.md](16-global-error-ux.md)) и будущих Vitest tests.

## Что вы узнаете

- MSW v2 `http`, `HttpResponse`, `delay`, `bypass`
- Resolver context: `params`, `request`, `cookies`
- In-memory DB для CRUD mock
- Симуляция ошибок и latency
- Организация handlers по domain
- `onUnhandledRequest` policies

---

## Базовый handler anatomy

```tsx
import { http, HttpResponse, delay } from "msw";

export const productsHandlers = [
  http.get("/api/v1/products/", async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get("page") ?? "1";
    const search = url.searchParams.get("search") ?? "";

    await delay(300);

    let results = mockProducts.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()),
    );

    return HttpResponse.json({
      count: results.length,
      next: null,
      previous: null,
      results,
    });
  }),
];
```

**`delay(300)`** — правдоподобный loading для Query ([06-query-advanced.md](06-query-advanced.md)) и skeletons ([22-suspense-data.md](22-suspense-data.md)).

---

## In-memory store

```tsx
// src/mocks/db.ts
type Product = {
  id: number;
  sku: string;
  title: string;
  price: string;
  is_active: boolean;
  category: { slug: string; name: string };
};

let products: Product[] = [
  /* seed */
];
let nextId = 100;

export const db = {
  products: {
    list: () => products,
    get: (id: number) => products.find((p) => p.id === id),
    create: (input: Omit<Product, "id">) => {
      const row = { ...input, id: nextId++ };
      products = [...products, row];
      return row;
    },
    update: (id: number, patch: Partial<Product>) => {
      products = products.map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      );
      return db.products.get(id);
    },
    remove: (id: number) => {
      products = products.filter((p) => p.id !== id);
    },
    reset: () => {
      products = [...seedProducts];
      nextId = 100;
    },
  },
};
```

Handlers читают/пишут `db` — CRUD lab [31-lab-crud.md](31-lab-crud.md) без Django.

---

## POST / PATCH / DELETE

```tsx
http.post("/api/v1/products/", async ({ request }) => {
  await delay(200);
  const body = (await request.json()) as Omit<Product, "id">;
  if (!body.sku || !body.title) {
    return HttpResponse.json(
      { sku: ["Обязательное поле."], title: ["Обязательное поле."] },
      { status: 400 },
    );
  }
  const created = db.products.create(body);
  return HttpResponse.json(created, { status: 201 });
}),

http.patch("/api/v1/products/:id/", async ({ params, request }) => {
  const id = Number(params.id);
  const existing = db.products.get(id);
  if (!existing) {
    return HttpResponse.json({ detail: "Not found." }, { status: 404 });
  }
  const patch = await request.json();
  const updated = db.products.update(id, patch);
  return HttpResponse.json(updated);
}),

http.delete("/api/v1/products/:id/", async ({ params }) => {
  const id = Number(params.id);
  if (!db.products.get(id)) {
    return HttpResponse.json({ detail: "Not found." }, { status: 404 });
  }
  db.products.remove(id);
  return new HttpResponse(null, { status: 204 });
}),
```

Validation shape как DRF ([05-pagination-filters.md](05-pagination-filters.md)).

---

## Auth handlers расширенные

```tsx
// src/mocks/authHandlers.ts
let sessions: Map<string, { email: string; role: string }> = new Map();

http.post("/api/v1/auth/login/", async ({ request }) => {
  await delay(400);
  const body = (await request.json()) as { email: string; password: string };

  if (body.password !== "admin") {
    return HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 });
  }

  const access = `mock-access-${crypto.randomUUID()}`;
  const refresh = `mock-refresh-${crypto.randomUUID()}`;
  sessions.set(refresh, { email: body.email, role: "admin" });

  return HttpResponse.json({
    access,
    refresh,
    user: { id: 1, email: body.email, role: "admin" },
  });
}),

http.post("/api/v1/auth/refresh/", async ({ request }) => {
  const body = (await request.json()) as { refresh: string };
  const session = sessions.get(body.refresh);
  if (!session) {
    return HttpResponse.json({ detail: "Token is invalid" }, { status: 401 });
  }
  return HttpResponse.json({
    access: `mock-access-${crypto.randomUUID()}`,
  });
}),
```

Связка с [12-refresh-flow.md](12-refresh-flow.md).

---

## Scenario switch

```tsx
// src/mocks/scenario.ts
export type MockScenario =
  | "happy"
  | "products-500"
  | "products-slow"
  | "auth-401";

let currentScenario: MockScenario = "happy";

export function setMockScenario(next: MockScenario) {
  currentScenario = next;
}

export function getMockScenario() {
  return currentScenario;
}
```

В handler:

```tsx
http.get("/api/v1/products/", async () => {
  const scenario = getMockScenario();

  if (scenario === "products-slow") {
    await delay(5000);
  }
  if (scenario === "products-500") {
    return HttpResponse.json(
      { detail: "Internal server error" },
      { status: 500 },
    );
  }

  return HttpResponse.json({ count: 0, next: null, previous: null, results: [] });
});
```

Dev panel (temporary):

```tsx
<select
  onChange={(e) => setMockScenario(e.target.value as MockScenario)}
  aria-label="MSW scenario"
>
  <option value="happy">Happy</option>
  <option value="products-500">Products 500</option>
  <option value="products-slow">Slow</option>
</select>
```

Или **`X-Mock-Scenario`** header в fetch wrapper ([04-api-client.md](04-api-client.md)) — handlers читают `request.headers.get("X-Mock-Scenario")`.

---

## Per-request override

```tsx
http.get("/api/v1/products/:id/", async ({ params, request }) => {
  if (request.headers.get("X-Mock-Error") === "404") {
    return HttpResponse.json({ detail: "Not found." }, { status: 404 });
  }
  const product = db.products.get(Number(params.id));
  if (!product) {
    return HttpResponse.json({ detail: "Not found." }, { status: 404 });
  }
  return HttpResponse.json(product);
});
```

E2E tests задают header без global scenario.

---

## bypass к real API

```tsx
import { bypass } from "msw";

http.get("/api/v1/health/", async () => {
  const response = await fetch(bypass("http://localhost:8092/api/v1/health/"));
  return response;
});
```

Mixed mode: MSW для auth, real Django для heavy reports — редко, но возможно.

---

## Организация файлов

```text
src/mocks/
  db.ts
  scenario.ts
  handlers/
    products.ts
    auth.ts
    index.ts
  browser.ts
```

```tsx
// handlers/index.ts
import { productsHandlers } from "./products";
import { authHandlers } from "./auth";

export const handlers = [...authHandlers, ...productsHandlers];
```

---

## GraphQL / WebSocket

MSW v2 поддерживает `graphql` helper — out of scope; DRF REST — наш focus.

---

## Reset между tests

```tsx
beforeEach(() => {
  db.products.reset();
  setMockScenario("happy");
});
```

Vitest + `setupServer` — [javascript-testing](../javascript-path.md).

---

## Типичные ошибки

**Mutate seed array in place без copy** — tests leak state.

**404 без DRF `{ detail }` shape** — ApiError message wrong.

**delay без await** — race.

**Scenario global без reset** — QA видит 500 forever.

**Handler path без trailing slash** — Django APPEND_SLASH mismatch.

**Login returns 200 с пустым body** — AuthProvider hang ([10-auth-context.md](10-auth-context.md)).

---

## Чек-лист

- [ ] CRUD handlers с in-memory db
- [ ] delay для realistic loading
- [ ] 400/401/404/500 shapes как DRF
- [ ] Scenario switch для QA
- [ ] Handlers split по domain

---

## Далее

Следующий урок: [26. MSW + Query + переключение real/mock](26-msw-query.md).
