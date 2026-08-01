# 07. Interfaces, objects, readonly and index signatures

## Intro: a scenario from work

The shop catalog model in a BFF: ten files import `Product` from `types.ts`. A colleague added an `internalCost` field to the **interface** — all consumers compile, but they accidentally log a sensitive field to CI stdout. In another PR someone **mutates** a `readonly` array of ids via a cast `(ids as number[]).push(1)` — the types are fooled, the runtime allows it.

A third case: product metadata `attributes: { color?: string; size?: string; [key: string]: string }` — an **index signature** for arbitrary keys from Django admin `:8092` / FastAPI `:8090`. Without an index signature, TS complains about `attributes.material`. Interfaces are the main tool for **structural** JSON contracts, which you started in [01-landscape.md](01-landscape.md).

## What you'll learn

- Declaring an **`interface`** and the difference from `type` (overview).
- **`readonly`** for fields and arrays.
- **Optional** and **readonly** together.
- **Index signatures** `[key: string]: T`.
- **Excess property checking** on literal assignment.
- Extending interfaces with `extends`.
- The connection to objects from [`javascript-basic/07-objects`](../javascript-basic/07-objects.md).

## Interface: an object's contract

```typescript
interface Product {
  id: number;
  sku: string;
  title: string;
  price: number;
  status: "active" | "archived" | "draft";
}
```

Usage:

```typescript
function printProduct(p: Product): void {
  console.log(`${p.sku}: ${p.title} — ${p.price}`);
}

const item: Product = {
  id: 1,
  sku: "KB-001",
  title: "Keyboard",
  price: 79.99,
  status: "active",
};
```

**Structural typing:** a variable with **extra** fields is compatible when assigned **through a variable**:

```typescript
const fromApi = {
  id: 2,
  sku: "MS-002",
  title: "Mouse",
  price: 29.99,
  status: "active" as const,
  warehouse: "EU",
};

const p: Product = fromApi; // OK — the extra warehouse doesn't get in the way
```

But a **literal** with an extra field is an error:

```typescript
const bad: Product = {
  id: 3,
  sku: "X",
  title: "X",
  price: 1,
  status: "active",
  extra: true, // TS2353 excess property
};
```

## readonly: immutability at the type level

```typescript
interface CatalogSnapshot {
  readonly generatedAt: string;
  readonly productIds: readonly number[];
}

const snap: CatalogSnapshot = {
  generatedAt: new Date().toISOString(),
  productIds: [1, 2, 3],
};

// snap.generatedAt = "x"; // error
// snap.productIds.push(4); // error
```

`readonly` does not freeze **nested** objects deeply — like a shallow `Object.freeze` in JS. For deep immutability — `Readonly<T>` recursively (utility types later) or code discipline.

A pattern for the **GET /catalog** response from `:8090`: don't mutate the DTO after parse.

## Optional and readonly

```typescript
interface ProductDetail extends Product {
  readonly id: number;
  description?: string;
  specs?: Readonly<Record<string, string>>;
}
```

`extends` is an intersection under the hood for the fields.

## Index signatures

When the keys are **dynamic** but the values are of one type:

```typescript
interface StringAttributes {
  [key: string]: string;
}

interface ProductAttributes {
  color?: string;
  size?: string;
  [key: string]: string | undefined;
}
```

The second variant: explicit keys + index; all explicit fields must be compatible with the index (`string | undefined`).

```typescript
const attrs: ProductAttributes = {
  color: "black",
  material: "plastic",
};

function getAttr(a: ProductAttributes, name: string): string | undefined {
  return a[name];
}
```

Careful: an index signature **weakens** checking — a typo `a.colour` returns `undefined`, not a TS error.

## interface vs type alias

| | `interface` | `type` |
|---|------------|--------|
| Objects | idiomatic | yes |
| Union `A \| B` | no | yes |
| Declaration merge | yes (rarely) | no |
| extends | `extends` | `&` |

```typescript
type ProductStatus = "active" | "archived" | "draft";

interface Product {
  status: ProductStatus;
}
```

On the course: **objects → interface**, **unions → type**.

## Extension and composition

```typescript
interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

interface Product extends Timestamps {
  id: number;
  title: string;
}

// equivalent to Product = { id, title } & Timestamps
```

Like composition of Pydantic models in FastAPI — without runtime inheritance.

## Implementing an interface with a class (preview)

```typescript
interface Printable {
  format(): string;
}

class InvoiceLine implements Printable {
  constructor(
    public title: string,
    public price: number
  ) {}

  format(): string {
    return `${this.title}: ${this.price}`;
  }
}
```

`implements` checks the **shape** — classes in [`javascript-basic/21-classes`](../javascript-basic/21-classes.md); a deep dive in nodejs-basic.

## JSON and interface

An `interface` **does not exist** at runtime. After `JSON.parse` the object is **not validated**:

```typescript
const raw: unknown = JSON.parse('{"id":1,"title":"Desk"}');
// (raw as Product).title — not validation!
```

Keep the contract with `:8090` in a **shared** specification; the TS interface is a mirror for development. Runtime — Zod later.

## How this connects to the course

| Lesson | Relation |
|------|-------|
| [05. Unions](05-unions-intersections.md) | union fields in an interface |
| [08. Narrowing](08-narrowing.md) | `"key" in obj` |
| [09. Lab objects](09-lab-objects.md) | Product catalog |
| [06. Lab unions](06-lab-unions.md) | Product interface |
| [`javascript-basic/07`](../javascript-basic/07-objects.md) | references, spread |

## Common mistakes

**Thinking an interface validates JSON.** Compile-time only.

**Excess property on an object literal** — a surprise for beginners; through a variable it's quieter.

**Index signature `[key: string]: any`.** Kills type safety.

**readonly + mutation via cast.** Bypassing the system — a code smell.

**Duplicating an interface instead of importing.** One `types/product.ts` in the mock-exams monorepo.

**Confusing optional `?` and `| undefined` under strictOptional.** A rare strict flag.

## Summary

An **interface** describes the shape of an object for structural typing. **readonly** protects against reassignment and push. **Index signatures** — dynamic attribute keys. **extends** composes contracts. Literal assignment is stricter than assignment through a variable. Interfaces are the foundation of shop models before the catalog lab and the client to **:8090**.

## Checklist

- [ ] How does literal assign differ from assign through a variable (excess property)?
- [ ] What does `readonly` do on an array in an interface?
- [ ] When is an index signature needed?
- [ ] `interface` vs `type` for a union — which to choose?
- [ ] Why is `as Product` after parse not validation?
- [ ] An example of an `interface` with an optional and a nullable field

Next lesson: [08. Type narrowing](08-narrowing.md).
