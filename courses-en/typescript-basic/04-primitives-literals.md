# 04. Primitives and literal types

## Intro: a scenario from work

Integration with FastAPI `:8090`: in OpenAPI the `status` field is an enum `active | archived | draft`. On the frontend a junior compares `if (product.status === "Active")` — wrong case, the branch never fires. In parallel, the TS model was written as `status: string` — the compiler **stays silent**, even though the error is obvious with a **literal union** `status: "active" | "archived" | "draft"`.

A second ticket: `productId` in the URL — `9007199254740993`. In [`javascript-basic/04-primitives`](../javascript-basic/04-primitives.md) you remember `MAX_SAFE_INTEGER`. In TS, `number` is the same IEEE 754; for a snowflake ID you need `bigint` or `string`.

A third case: config `mode: "dev"` | `"prod"` — someone accidentally assigned `"development"`. A **literal type** + union catches it at `tsc`. Primitives in TS mirror JS with an **extra layer** of precision at compile time.

## What you'll learn

- TS primitives: `string`, `number`, `boolean`, `bigint`, `null`, `undefined`.
- **Literal types** — a type as one specific value.
- **`as const`** — freezing literals in objects and arrays.
- The difference between `string` and `"keyboard"` as a type.
- Preparation for the **union** of shop statuses ([05-unions-intersections.md](05-unions-intersections.md)).
- The connection to JSON from `:8090` and Pydantic enums.

## Primitives: the same values as in JavaScript

TypeScript **does not add** new runtime primitives (beyond the fact that you don't write new syntax):

```typescript
const title: string = "Keyboard";
const price: number = 79.99;
const inStock: boolean = true;
const bigId: bigint = 9007199254740993n;
const empty: null = null;
const missing: undefined = undefined;
```

The semantics of `number` — double, `0.1 + 0.2`, `NaN` — are as in [javascript-basic/04](../javascript-basic/04-primitives.md). TS doesn't save you from float bugs — only from assigning the **wrong type**.

```typescript
const lineTotal: number = price * 3; // OK
const broken: number = "79.99";      // TS2322
```

## Literal types

A **literal** as a type — exactly one value:

```typescript
let port: 8090 = 8090;
port = 8091; // error — 8090 is expected

let method: "GET" | "POST" = "GET";
method = "DELETE"; // error
```

For the shop API:

```typescript
type ProductStatus = "active" | "archived" | "draft";

const status: ProductStatus = "active";
// const bad: ProductStatus = "Active"; // TS2322 — case matters
```

Compared to Python/FastAPI: `Literal["active", "archived"]` in Pydantic — the same contract on the backend; on the client — **keep** the strings in sync with OpenAPI.

### Widening

```typescript
let x = "active"; // let → type string (widened)
const y = "active"; // const without as const → still string for const...
```

Actually, for `const y = "active"` inference produces the literal `"active"` (not widened to string) — handy for readonly configs:

```typescript
const y = "active";
// type of y: "active"

let z = "active";
// type of z: string
```

## `as const` — deep literals

```typescript
const config = {
  apiBase: "http://localhost:8090/api/v1",
  timeout: 5000,
  methods: ["GET", "POST"] as const,
} as const;

// config.apiBase: "http://localhost:8090/api/v1"
// config.methods: readonly ["GET", "POST"]
// config.methods.push("DELETE"); // error
```

Without `as const`:

```typescript
const loose = { role: "admin" };
// loose.role: string — not "admin"
```

A pattern for **frozen** shop constants and route paths in nodejs-basic.

## Strings, templates, unions of literals

```typescript
type SkuPrefix = "KB-" | "MS-" | "DS-";

function isKeyboardSku(sku: string): sku is `${SkuPrefix}${string}` {
  return sku.startsWith("KB-");
}
```

Template literal types are an advanced topic; on the basic course it's enough to know that `type Event = "click" | "focus"` is an ordinary union of literals.

## Number and BigInt

```typescript
const safeId: number = 9007199254740991; // OK
// const unsafe: number = 9007199254740993; // possibly a lint warning

const dbId: bigint = 9007199254740993n;
// dbId + 1n OK; dbId + 1 — TS error
```

For IDs from a Postgres `BIGINT`, a BFF often uses **`string` in JSON** or `bigint` after an explicit parse — coordinate with the [`fastapi`](../fastapi/README.md) schema.

## Boolean and truthiness

TS does not distinguish truthy/falsy in types — only `boolean`:

```typescript
function setFeatured(flag: boolean): void {
  console.log(flag);
}

setFeatured(true);
// setFeatured(1); // TS error — would pass in JS
```

The `if (port)` logic with `port: number` is still the `0` trap from javascript-basic; types don't replace `??` for defaults.

## Symbols and unique keys

```typescript
const brand: unique symbol = Symbol("brand");
type BrandedPrice = number & { [brand]: true };
```

On the basic course — just know that `symbol` exists; branded types come later.

## Primitives in objects and JSON

`JSON.parse` doesn't give you `bigint`/`undefined` in standard JSON:

```typescript
interface ItemDto {
  id: number;
  title: string;
  price: number;
  featured: boolean;
}
```

`null` fields from the API — `string | null` or optional `?` — in [05-unions-intersections.md](05-unions-intersections.md).

## How this connects to the course

| Lesson | Relation |
|------|-------|
| [05. Unions](05-unions-intersections.md) | union of literals `ProductStatus` |
| [02. Inference](02-annotations-inference.md) | widening `let` vs `const` |
| [06. Lab unions](06-lab-unions.md) | shop status |
| [`javascript-basic/04`](../javascript-basic/04-primitives.md) | runtime semantics |
| [`fastapi/04-pydantic`](../fastapi/04-pydantic-v2.md) | Literal, Enum on the backend |

## Common mistakes

**`status: string` instead of a union of literals.** You lose typo checking.

**Confusing `"active"` (a type) and `string`.** Assigning an arbitrary string is only allowed for `string`.

**Expecting TS to fix floats.** `number` remains IEEE 754.

**Forgetting the `n` on a BigInt.** `9007199254740993` is a number with precision loss.

**`as const` on everything.** Readonly gets in the way of mutations where a mutable builder is needed.

**Case mismatch with the API.** `"active"` vs `"ACTIVE"` — an agreement with OpenAPI :8090.

## Summary

TS primitives mirror JS. **Literal types** narrow `string`/`number` down to specific values — ideal for shop statuses and HTTP methods. **`as const`** freezes deep literals in configs. `bigint` for large IDs; `boolean` does not mix with `number`. The next step — **unions** of several literals and optional fields.

## Checklist

- [ ] How does `string` differ from the type `"active"`?
- [ ] What does `as const` do on a config object?
- [ ] Why does `let x = "a"` have type `string`, while `const y = "a"` is often `"a"`?
- [ ] When should you choose `bigint` over `number`?
- [ ] How does a literal union help for `ProductStatus`?
- [ ] Recall: `0.1 + 0.2` in TS is still not `0.3`

Next lesson: [05. Union, intersection and optional](05-unions-intersections.md).
