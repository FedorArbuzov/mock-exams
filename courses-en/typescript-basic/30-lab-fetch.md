# 30. Lab: fetch to localhost:8090 with Zod

## Scenario

Build a **minimal typed API client** for the FastAPI shop: health, the item list, a single item by id, and optionally POST. All responses go through Zod; HTTP and schema errors are separated. This is a prototype of the layer that in the capstone will replace the file store with HTTP ([33-capstone.md](33-capstone.md)).

Builds on [29-fetch-typed.md](29-fetch-typed.md), [27-lab-zod.md](27-lab-zod.md), and the `:8090` test bench.

## What you'll do

- A client with `unknown` → parse
- Retry on a flaky network (optional)
- A CLI demo: print catalog / health
- A test for offline / invalid JSON (mock)

**Time:** ~45–60 minutes.  
**Where the code is:** `courses/typescript-basic/examples/lab-fetch/`.

---

## Setup

```bash
cd deploy/fastapi && docker compose up -d --build
curl http://localhost:8090/health
```

```text
lab-fetch/
├── package.json
├── tsconfig.json
└── src/
    ├── schemas/
    ├── http.ts
    ├── shop-client.ts
    └── main.ts
```

```bash
cd courses/typescript-basic/examples/lab-fetch
npm install
npm start
```

---

## Task 1. HTTP layer

`src/http.ts`:

```typescript
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`HTTP ${status}`);
  }
}

export async function fetchJson(
  url: string,
  init?: RequestInit
): Promise<unknown> {
  // network try/catch
  // res.ok check
  // return unknown from res.json()
}
```

Base URL: `http://localhost:8090`.

---

## Task 2. Schemas

Reuse or copy from [27-lab-zod.md](27-lab-zod.md):

- `ItemSchema`, `ItemListSchema`
- `HealthSchema`

---

## Task 3. ShopClient class

```typescript
// src/shop-client.ts
export class ShopClient {
  constructor(private readonly baseUrl: string) {}

  async health(): Promise<Health> { ... }

  async listItems(): Promise<Item[]> { ... }

  async getItem(id: number): Promise<Item> {
    const json = await fetchJson(`${this.baseUrl}/api/v1/items/${id}`);
    return ItemSchema.parse(json);
  }
}
```

---

## Task 4. main.ts CLI

```typescript
const client = new ShopClient("http://localhost:8090");

async function main() {
  const health = await client.health();
  console.log("API:", health);

  const items = await client.listItems();
  console.log(`Items: ${items.length}`);
  for (const item of items.slice(0, 10)) {
    console.log(`  ${item.id}  ${item.name}  $${item.price}`);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
```

---

## Task 5. Handling 404

```typescript
try {
  await client.getItem(999999);
} catch (err) {
  if (err instanceof HttpError && err.status === 404) {
    console.log("Item not found");
  }
}
```

Parse `err.body` via `NotFoundSchema` from lab-zod.

---

## Task 6. (Optional) Retry

Port of [javascript-basic/28-lab-async.md](../javascript-basic/28-lab-async.md):

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 200
): Promise<T> { ... }
```

Wrap `listItems` — useful while Docker is starting up.

---

## Task 7. Mock without an API

`src/mock-server.ts` or a fixture JSON for CI without Docker:

```typescript
const FIXTURE_ITEMS: unknown = [ /* ... */ ];
ItemListSchema.parse(FIXTURE_ITEMS);
```

Document `npm run demo:offline`.

---

## Success criteria

- [ ] `npm start` with `:8090` live prints health + items
- [ ] No `any` in src (eslint or a manual check)
- [ ] `getItem(badId)` — a meaningful error, exit 1
- [ ] A ZodError when swapping in a fixture with a string price
- [ ] A README with the Docker and npm commands

---

## Common mistakes

1. **Hardcoding a URL with trailing-slash issues** — use `new URL(path, base)`.

2. **Parsing before checking ok** — a 404 JSON isn't an Item.

3. **A floating promise in main** — always await + catch.

4. **Copy-pasting a schema from OpenAPI without verifying** — an id type mismatch.

5. **CORS confusion** — there's no CORS in Node; don't waste time on Origin headers.

---

## Connection to the capstone

In [33-capstone.md](33-capstone.md), extension B: `TaskStore` reads/writes via HTTP instead of `tasks.json`. The ShopClient from this lab is a template for the `api/` layer.

---

## Lab summary

Typed fetch = HttpError + unknown json + Zod parse. You're ready to connect the Task Tracker and the shop CLI to a single FastAPI bench, which ties together the JS, TS, and Python tracks of mock-exams.

---

## Checklist before submitting

- Where is the single parse point for items?
- What does the user see on a ZodError vs an HttpError?
- Does the offline mode work?

Next lesson: [31. Tooling and migration](31-tooling-migration.md).
