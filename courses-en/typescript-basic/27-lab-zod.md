# 27. Lab: validating FastAPI JSON with Zod

## Scenario

The shop catalog client calls `GET http://localhost:8090/api/v1/items`. The response **must** match the FastAPI/Pydantic contract, but the network, proxies, and manual edits break the payload. Your task is to describe Zod schemas, parse real responses from the test bench, and handle errors the way a production BFF does.

Builds on [26-zod-basics.md](26-zod-basics.md), [javascript-basic/29-fetch.md](../javascript-basic/29-fetch.md), and the test bench [deploy/fastapi/README.md](../../deploy/fastapi/README.md).

## What you'll do

- Bring up (or check) FastAPI on `:8090`
- Describe schemas for Item, the list, health, and 422/404 errors
- Write a typed client with `parse` at the boundary
- Test it on deliberately broken JSON (mock)

**Time:** ~50–65 minutes.  
**Where the code is:** `courses/typescript-basic/examples/lab-zod/`.

---

## Setup

```bash
# from the repository root
cd deploy/fastapi
docker compose up -d --build

curl http://localhost:8090/health
curl http://localhost:8090/api/v1/items
```

Lab structure:

```text
lab-zod/
├── package.json
├── tsconfig.json
└── src/
    ├── schemas/
    │   ├── item.ts
    │   ├── health.ts
    │   └── errors.ts
    ├── client.ts
    ├── validate-fixtures.ts
    └── demo.ts
```

```bash
cd courses/typescript-basic/examples/lab-zod
npm install
npm run demo
```

---

## Task 1. The `Item` schema

Study the response of `GET /api/v1/items`. On the [`deploy/fastapi`](../../deploy/fastapi/README.md) test bench it's a wrapper:

```json
{
  "items": [
    { "id": 1, "title": "Demo item", "description": "From course stack" }
  ],
  "total": 1
}
```

Describe:

```typescript
// src/schemas/item.ts
import { z } from "zod";

export const ItemSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
});

export const ItemListResponseSchema = z.object({
  items: z.array(ItemSchema),
  total: z.number().int(),
});

export type Item = z.infer<typeof ItemSchema>;
export type ItemListResponse = z.infer<typeof ItemListResponseSchema>;
```

**Don't guess** — verify against the `/docs` Swagger or `curl http://localhost:8090/api/v1/items`.

### Criterion

- `ItemListResponseSchema.parse(await res.json())` against the live API without a ZodError

---

## Task 2. Health and the root

```typescript
// src/schemas/health.ts
import { z } from "zod";

export const HealthSchema = z.object({
  status: z.literal("ok").or(z.string()), // relax it if your bench differs
  service: z.string().optional(),
  version: z.string().optional(),
});
```

Adapt it to the actual `{ "status": "ok", ... }` of your deploy.

---

## Task 3. FastAPI errors

404:

```json
{ "detail": "Not found" }
```

422:

```json
{
  "detail": [
    { "loc": ["body", "price"], "msg": "...", "type": "..." }
  ]
}
```

```typescript
// src/schemas/errors.ts
import { z } from "zod";

export const NotFoundSchema = z.object({
  detail: z.string(),
});

export const ValidationErrorSchema = z.object({
  detail: z.array(
    z.object({
      loc: z.array(z.union([z.string(), z.number()])),
      msg: z.string(),
      type: z.string(),
    })
  ),
});
```

---

## Task 4. Typed client

```typescript
// src/client.ts
const API_BASE = "http://localhost:8090";

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await res.json();
  if (!res.ok) {
    throw new HttpError(res.status, body);
  }
  return body;
}

export async function listItems(): Promise<Item[]> {
  const json = await apiGet("/api/v1/items");
  const parsed = ItemListResponseSchema.parse(json);
  return parsed.items;
}

export async function getHealth(): Promise<Health> {
  const json = await apiGet("/health");
  return HealthSchema.parse(json);
}
```

Implement `HttpError` with a `status` field and `body: unknown`. For 404, try `NotFoundSchema.safeParse(body)`.

---

## Task 5. Broken JSON (mock)

File `src/validate-fixtures.ts`:

```typescript
import { ItemListResponseSchema } from "./schemas/item.js";

const broken = {
  items: [{ id: 1, title: "Demo", description: "ok" }],
  total: "1",
};

const result = ItemListResponseSchema.safeParse(broken);
if (!result.success) {
  console.log("Expected failure:", result.error.issues[0]?.message);
}
```

### Requirements

- Show that **without** Zod a `total` field as a string breaks the arithmetic (`total + 1` → `"11"`)
- Print `flatten()` for debugging the shape

---

## Task 6. Demo

`src/demo.ts`:

```typescript
async function main() {
  const health = await getHealth();
  console.log("Health:", health);

  const items = await listItems();
  console.table(items.slice(0, 5).map((i) => ({ id: i.id, title: i.title, description: i.description })));

  // optional: POST with an invalid body → catch 422 and parse ValidationErrorSchema
}

main().catch(console.error);
```

---

## Task 7. (Optional) Connection to the Task Tracker

A schema for the capstone's tasks.json:

```typescript
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  status: z.enum(["todo", "done"]),
  createdAt: z.string().datetime(),
  tags: z.array(z.string()).default([]),
  dueDate: z.string().datetime().nullable().default(null),
});

export const TaskFileSchema = z.array(TaskSchema);
```

Use it in [24-lab-strict.md](24-lab-strict.md) instead of `as Task[]`.

---

## Success criteria

- [ ] `npm run demo` with `:8090` up — an items table without errors
- [ ] `validate-fixtures.ts` demonstrates a fail on a string price
- [ ] Types `Item`, `Health` — only `z.infer`, without duplicating interfaces
- [ ] HTTP 404/422 not masked as success
- [ ] README: how to bring up the bench and run the lab

---

## Common mistakes

1. **A schema from memory** — on the mock-exams bench the field is `title`, not `name`; the list is `{ items, total }`. Verify against the API.

2. **`res.json()` without checking `res.ok`** — you parse `{ detail: "Not found" }` as items.

3. **`.parse` all over the app** — client.ts is enough.

4. **Ignoring optional fields** — extra fields are stripped by Zod by default (`strip`), unknown keys — `.strict()` if you need a contract.

5. **No fallback if Docker isn't up** — document a skip or a fixture JSON.

---

## Related courses

- Zod theory: [26-zod-basics.md](26-zod-basics.md)
- Fetch: [29-fetch-typed.md](29-fetch-typed.md), [30-lab-fetch.md](30-lab-fetch.md)
- FastAPI Pydantic: a mirror of the schemas on the Python side
- Capstone: [33-capstone.md](33-capstone.md)

---

## Lab summary

You connected the OpenAPI-real backend to TypeScript via Zod: one schema — runtime check + static type. This is the standard pattern for react-basic (TanStack Query + parse) and the nodejs BFF.

---

## Checklist before submitting

- Where did you get the Item shape?
- What does the client do on a ZodError?
- Is there a test for a broken fixture?
- Are you ready to reuse the schemas in the capstone?

Next lesson: [28. Async types](28-async-types.md).
