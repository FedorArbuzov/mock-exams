# 29. Typed fetch: `unknown` vs `any` for JSON

## Scenario from work

```typescript
const data = await res.json();
console.log(data.items[0].price.toFixed(2));
```

After `tsc --noEmit` everything is green — if `data: any`. At runtime `items` is undefined — a crash in production. The senior demands: **`json()` → `unknown` → validate → typed**. A junior asks: "Why not `as Item[]`?" — because an assert doesn't check the runtime.

This chapter is a type-safe layer on top of [javascript-basic/29-fetch.md](../javascript-basic/29-fetch.md) and Zod from [26-zod-basics.md](26-zod-basics.md).

## What you'll learn

- Why `res.json()` is essentially untyped
- `unknown` vs `any` at the I/O boundary
- Type guards and narrowing without Zod (minimally)
- Generic `api<T>` — when it's safe, when it isn't
- A typed client for `:8090`
- Handling HTTP vs parse errors

---

## `fetch` and the Response type

```typescript
const res: Response = await fetch("http://localhost:8090/health");
const json: unknown = await res.json();
```

`Response.json()` in lib.dom returns `Promise<any>` — the **source of any**. The first line after json is an assignment to `unknown`.

---

## `any` vs `unknown`

| | any | unknown |
|---|-----|---------|
| Assignment | to everything | only to unknown/any |
| `.price` | OK without a check | TS error |
| Needs narrow | no | yes |
| Strict | disables checks | preserves them |

```typescript
let a: any = JSON.parse('{"x":1}');
a.foo.bar; // OK for the compiler — a bomb

let u: unknown = JSON.parse('{"x":1}');
// u.foo; // TS18046
if (typeof u === "object" && u !== null && "x" in u) {
  const obj = u as { x: unknown };
}
```

**Course rule:** external JSON is **unknown** until validation.

---

## Narrowing without Zod (a minimal guard)

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isItemList(value: unknown): value is Item[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (el) =>
      isRecord(el) &&
      typeof el.id === "number" &&
      typeof el.name === "string" &&
      typeof el.price === "number"
  );
}
```

For production — Zod is shorter and has better error messages.

---

## Typed API wrapper

```typescript
const API_BASE = "http://localhost:8090";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json", ...init?.headers },
      ...init,
    });
  } catch (err) {
    throw new Error(`Network error: ${String(err)}`);
  }

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    throw new HttpError(res.status, body);
  }

  return body;
}
```

---

## Parse at the boundary (Zod)

```typescript
import { ItemListSchema, type Item } from "./schemas/item.js";

export async function listItems(): Promise<Item[]> {
  const json = await request("/api/v1/items");
  return ItemListSchema.parse(json);
}
```

The `Item[]` type is **guaranteed** after a successful parse.

### Generic `api<T>` — carefully

```typescript
async function api<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const json = await request(path);
  return schema.parse(json);
}

const items = await api("/api/v1/items", ItemListSchema);
```

Without a schema parameter, the generic **lies**:

```typescript
async function api<T>(path: string): Promise<T> {
  return (await request(path)) as T; // UNSAFE
}
```

---

## POST with a typed body

```typescript
const CreateItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().nullable().optional(),
});

type CreateItem = z.infer<typeof CreateItemSchema>;

export async function createItem(input: CreateItem): Promise<Item> {
  const body = CreateItemSchema.parse(input);
  const json = await request("/api/v1/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return ItemSchema.parse(json);
}
```

Validate the **input** and the **output** — a symmetric contract.

---

## Separating errors

```typescript
export async function loadCatalog(): Promise<Item[]> {
  try {
    return await listItems();
  } catch (err) {
    if (err instanceof HttpError) {
      // log status + body
      throw err;
    }
    if (err instanceof z.ZodError) {
      throw new Error(`Invalid API response: ${err.message}`);
    }
    throw err;
  }
}
```

| Layer | Error type |
|------|------------|
| DNS, offline | network Error |
| 404, 500 | HttpError |
| JSON syntax | SyntaxError |
| Schema mismatch | ZodError |

---

## AbortController with types

```typescript
export async function listItemsWithTimeout(
  ms: number,
  signal?: AbortSignal
): Promise<Item[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  const combined = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
    const json = await request("/api/v1/items", { signal: combined });
    return ItemListSchema.parse(json);
  } finally {
    clearTimeout(timeout);
  }
}
```

---

## Browser vs Node

In Node 18+ the global `fetch` is typed via `@types/node` / the DOM lib. CORS — browser only ([javascript-basic/29-fetch.md](../javascript-basic/29-fetch.md)). The CLI capstone is Node, so CORS doesn't get in the way.

---

## Related courses

- JS fetch: [javascript-basic/29-fetch.md](../javascript-basic/29-fetch.md)
- Zod: [26-zod-basics.md](26-zod-basics.md), [27-lab-zod.md](27-lab-zod.md)
- Async: [28-async-types.md](28-async-types.md)
- Fetch lab: [30-lab-fetch.md](30-lab-fetch.md)
- Test bench: [deploy/fastapi/README.md](../../deploy/fastapi/README.md)

---

## Common mistakes

1. **`as Item[]` right after json()** — the main antipattern.

2. **Trusting a generic without a schema** — `<T>` is not magic.

3. **Not checking res.ok** — parsing an error body as success.

4. **any in one place** — it spreads across the project.

5. **Double parse of the body** — clone the Response if you need it twice.

6. **Ignoring a ZodError in the UI** — show "invalid server response".

---

## Summary

`fetch` + `json()` gives no types — use `unknown`. Narrow with Zod (preferred) or type guards. A wrapper centralizes HTTP errors. A generic API without a runtime schema is an unsafe cast. Validate input and output for POST. Separate network, HTTP, and schema errors.

---

## Checklist

- Why doesn't `res.json()` give `Item[]`?
- Why is `unknown` better than `any` for JSON?
- Is `api<T>` safe without Zod?
- What do you do on HTTP 200 and invalid JSON?
- Where in the shop client should you call parse — once?

Next lesson: [30. Lab: fetch + Zod](30-lab-fetch.md).
