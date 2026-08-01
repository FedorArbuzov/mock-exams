# 25. Handlers, scenarios, delays, and errors

## A story from work

MSW is on ([24-msw-intro.md](24-msw-intro.md)) — login and products work offline. QA asks for scenarios: "401 on an expired token", "500 on save", "slow 3G catalog". Hardcoding them in components is unacceptable. You extend [`handlers.ts`](examples/src/mocks/handlers.ts): **`delay`**, conditional responses, a **`http.post` reset**, and scenarios via query/header/cookie.

The goal — one handlers file + a runtime switch to demo error UX ([16-global-error-ux.md](16-global-error-ux.md)) and future Vitest tests.

## What you'll learn

- MSW v2 `http`, `HttpResponse`, `delay`, `bypass`
- Resolver context: `params`, `request`, `cookies`
- An in-memory DB for a CRUD mock
- Simulating errors and latency
- Organizing handlers by domain
- `onUnhandledRequest` policies

---

## Basic handler anatomy

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

**`delay(300)`** — a believable loading state for Query ([06-query-advanced.md](06-query-advanced.md)) and skeletons ([22-suspense-data.md](22-suspense-data.md)).

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

Handlers read/write `db` — the CRUD lab [31-lab-crud.md](31-lab-crud.md) without Django.

---

## POST / PATCH / DELETE

```tsx
http.post("/api/v1/products/", async ({ request }) => {
  await delay(200);
  const body = (await request.json()) as Omit<Product, "id">;
  if (!body.sku || !body.title) {
    return HttpResponse.json(
      { sku: ["This field is required."], title: ["This field is required."] },
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

Validation shape like DRF ([05-pagination-filters.md](05-pagination-filters.md)).

---

## Extended auth handlers

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

Ties in with [12-refresh-flow.md](12-refresh-flow.md).

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

In the handler:

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

Or a **`X-Mock-Scenario`** header in the fetch wrapper ([04-api-client.md](04-api-client.md)) — handlers read `request.headers.get("X-Mock-Scenario")`.

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

E2E tests set the header without a global scenario.

---

## bypass to the real API

```tsx
import { bypass } from "msw";

http.get("/api/v1/health/", async () => {
  const response = await fetch(bypass("http://localhost:8092/api/v1/health/"));
  return response;
});
```

Mixed mode: MSW for auth, real Django for heavy reports — rare, but possible.

---

## File organization

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

MSW v2 supports a `graphql` helper — out of scope; DRF REST is our focus.

---

## Reset between tests

```tsx
beforeEach(() => {
  db.products.reset();
  setMockScenario("happy");
});
```

Vitest + `setupServer` — [javascript-testing](../javascript-path.md).

---

## Common mistakes

**Mutate the seed array in place without a copy** — tests leak state.

**404 without the DRF `{ detail }` shape** — ApiError message is wrong.

**delay without await** — race.

**Global scenario without a reset** — QA sees 500 forever.

**Handler path without a trailing slash** — Django APPEND_SLASH mismatch.

**Login returns 200 with an empty body** — AuthProvider hangs ([10-auth-context.md](10-auth-context.md)).

---

## Checklist

- [ ] CRUD handlers with an in-memory db
- [ ] delay for realistic loading
- [ ] 400/401/404/500 shapes like DRF
- [ ] Scenario switch for QA
- [ ] Handlers split by domain

---

## Next

Next lesson: [26. MSW + Query + switching real/mock](26-msw-query.md).
