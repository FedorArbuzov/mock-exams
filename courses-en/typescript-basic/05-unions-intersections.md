# 05. Union, intersection and optional properties

## Intro: a scenario from work

A FastAPI `:8090` response for a product: the `discount` field is sometimes a **number**, sometimes **`null`** («no discount»). In JS you wrote `if (item.discount != null)`. In TS without a union, the compiler thinks `discount` is always `number` — access to `null` isn't reflected. QA files a bug: «the optional `description` field is missing from the JSON» — in TS you need `description?: string`, otherwise the code accesses `undefined` as a required string.

A second case: a function accepts **either** a `Product` **or** a `ProductId` (a number) — the **union** `Product | number`. A third: the type `AdminUser` = `User & { role: "admin" }` — an **intersection** to extend without duplicating fields. These three mechanisms are 80% of shop-catalog models before generics.

## What you'll learn

- **Union** `A | B` — a value of one of the types.
- **Intersection** `A & B` — everything at once.
- **Optional** properties `?` and `undefined` in types.
- **`null` vs `undefined` vs optional** — consistency with the API.
- Discriminated unions (preview) for `ProductStatus`.
- Patterns for DTOs from `:8090`.

## Union: «either this or that»

```typescript
type ProductId = number;
type ProductSku = string;

type ProductRef = ProductId | ProductSku;

function resolveRef(ref: ProductRef): string {
  if (typeof ref === "number") {
    return `id:${ref}`;
  }
  return `sku:${ref}`;
}
```

Without narrowing, the function body can't call methods that aren't common to all union members — [08-narrowing.md](08-narrowing.md).

### Literal union — shop statuses

```typescript
type ProductStatus = "active" | "archived" | "draft";

interface Product {
  id: number;
  title: string;
  status: ProductStatus;
}
```

A typo `"activ"` — **TS2322** at the assignment stage.

### Union with null — nullable fields

```typescript
interface PriceInfo {
  amount: number;
  discount: number | null; // an explicit null from JSON
}
```

Distinguish:

| Notation | Meaning |
|--------|-------|
| `discount: number` | always a number |
| `discount: number \| null` | a number or null |
| `discount?: number` | may be absent (undefined) |
| `discount?: number \| null` | no key, null, or a number |

With FastAPI/Pydantic, `Optional[float] = None` more often maps to `number | null`; a missing key — `?`.

## Optional properties

```typescript
interface Product {
  id: number;
  title: string;
  description?: string;
}

const keyboard: Product = {
  id: 1,
  title: "Keyboard",
  // description may be omitted
};

function printDesc(p: Product): void {
  const text = p.description ?? "(no description)";
  console.log(text);
}
```

`p.description` has type `string | undefined`. The `??` operator is from [`javascript-basic/19`](../javascript-basic/19-optional-nullish.md).

**The strict option** (`exactOptionalPropertyTypes` in tsconfig) comes later; on the course, remember: `?` ≠ «may be null» unless you specified `| null`.

## Intersection: «both at once»

```typescript
interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

interface ProductCore {
  id: number;
  title: string;
  price: number;
}

type Product = ProductCore & Timestamps;

const item: Product = {
  id: 1,
  title: "Mouse",
  price: 29.99,
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-15T10:00:00Z",
};
```

Intersection **combines** the fields. A name conflict with incompatible types produces `never` on the field — a rare edge case.

### Extending a user's role

```typescript
interface User {
  id: number;
  name: string;
}

type AdminUser = User & {
  role: "admin";
  permissions: string[];
};
```

An analog of an object spread in JS, but at the type level.

## Union vs intersection in practice

```typescript
type ApiError = { ok: false; error: string };
type ApiSuccess<T> = { ok: true; data: T };
type ApiResult<T> = ApiSuccess<T> | ApiError;

function handle<T>(result: ApiResult<T>): T {
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.data; // narrowing by the `ok` discriminant
}
```

A **discriminated union** — a shared marker field (`ok`, `status`, `type`) — is the idiom for BFF responses before parsing JSON from `:8090`.

## Combining optional and union

```typescript
interface CartLine {
  productId: number;
  qty: number;
  note?: string | null;
}
```

Document it on the team: «absent» vs `null` vs `""` — the three semantics from javascript-basic and API design.

## Type aliases vs interfaces (preview)

```typescript
type ProductStatus = "active" | "archived" | "draft";

interface Product {
  id: number;
  status: ProductStatus;
}
```

A union of literals is more often done with `type`; objects — `interface` ([07-interfaces-objects.md](07-interfaces-objects.md)). `type` can describe a union of primitives; `interface` can't.

## How this connects to the course

| Lesson | Relation |
|------|-------|
| [04. Literals](04-primitives-literals.md) | union members |
| [06. Lab unions](06-lab-unions.md) | ProductStatus in practice |
| [08. Narrowing](08-narrowing.md) | `typeof`, discriminant |
| [07. Interfaces](07-interfaces-objects.md) | optional, readonly |
| [`api-design`](../api-design/README.md) | nullable in contracts |

## Common mistakes

**Everything optional via `?` instead of `| null`.** The API explicitly sends `"field": null` — the type must include `null`.

**A union without narrowing — calling a shared method.** `(x: Cat | Dog).bark()` — an error if not all of them have `bark`.

**Intersection duplicating incompatible fields.** `A & B` where `id: string` and `id: number`.

**Confusing `\|` and `&` in an optional chain.** Union is an alternative; intersection is an overlay.

**Ignoring `undefined` with `?.`.** The result of an optional chain is often `T | undefined`.

**`string | "active"`** — redundant; `"active"` is already a subtype of `string`.

## Summary

**Union** models alternatives (`number | string`, statuses, success/error). **Intersection** merges contracts (`User & Admin`). **Optional `?`** — a field may be absent. Reconcile `null`/`undefined` with FastAPI **:8090**. Discriminated unions prepare you for safely parsing API responses.

## Checklist

- [ ] How does `A | B` differ from `A & B`?
- [ ] When `field?: string`, when `field: string | null`?
- [ ] Write `ProductStatus` as a union of three literals
- [ ] What is a discriminant in `ApiResult`?
- [ ] Why does a union require narrowing before `.toFixed()`?
- [ ] How does `??` work with an optional field?

Next lesson: [06. Lab: unions in the shop domain](06-lab-unions.md).
