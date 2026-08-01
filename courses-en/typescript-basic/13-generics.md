# 13. Generics: generic functions and interfaces

## A scenario from work

In a shop service there are three repositories: `Product`, `Order`, `Customer`. A junior copies `findById(id: number): Product | undefined` three times. When `Warehouse` is added — a fourth copy. The team lead asks for **one** `findById<T extends HasId>(...)` with the constraint «T has an `id` field».

Another case: `wrapResponse(data)` must return `{ data: T, meta: ... }` while **preserving** the type `T`, not `unknown`. Generics are «the type is refined at the call site» without sacrificing to `any`.

## What you'll learn

- **Generic functions** `<T>` and type inference
- **Generic interfaces** (`Repository<T>`, `ApiList<T>`)
- **Constraints** `T extends HasId`
- Multiple type parameters and a **default** generic
- Antipatterns and variance (practical intuition)

---

## A generic function: the basic pattern

```typescript
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

const a = first([1, 2, 3]);           // number | undefined
const b = first(["keyboard", "mouse"]); // string | undefined
```

TypeScript **infers** `T` from the argument. Explicit passing: `first<Product>(products)`.

When inference breaks (an empty array `[]`):

```typescript
const empty = [] as Product[]; // or a generic default
```

---

## Why not `any`

```typescript
function identityBad(x: any): any { return x; }
function identity<T>(x: T): T { return x; }

const p = identity({ id: 1, name: "Desk" });
// { id: number; name: string } — the type is preserved
```

A real shop case: `cache.get<T>(key)` returns the same `T` you put in.

---

## Constraints: `extends`

```typescript
type HasId = { id: number };

function findById<T extends HasId>(
  items: readonly T[],
  id: number
): T | undefined {
  return items.find((item) => item.id === id);
}

type Product = HasId & { name: string; price: number };

const found = findById(products, 1); // Product | undefined
```

**Why `extends`:** inside the function `item.id` is available.

### A constraint on keys

```typescript
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

pluck(products[0], "name");  // string
// pluck(products[0], "foo"); // error
```

---

## Generic interfaces

```typescript
interface Repository<T extends HasId> {
  getAll(): Promise<readonly T[]>;
  getById(id: number): Promise<T | undefined>;
  save(entity: T): Promise<T>;
}

interface ProductRepo extends Repository<Product> {
  findByCategory(category: string): Promise<Product[]>;
}
```

Implementation — [15-lab-generics](15-lab-generics.md).

### API list wrapper

```typescript
interface ApiList<T> {
  items: T[];
  total: number;
  page: number;
}

async function fetchProductPage(): Promise<ApiList<Product>> {
  const res = await fetch("http://localhost:8090/api/v1/items?page=1");
  return res.json();
}
```

The pagination contract — [`fastapi/17-pagination`](../fastapi/17-pagination-filters.md).

---

## Multiple type parameters

```typescript
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

function mapValues<T extends object, R>(
  obj: T,
  fn: (value: T[keyof T]) => R
): Record<keyof T, R> {
  const result = {} as Record<keyof T, R>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    result[key] = fn(obj[key]);
  }
  return result;
}
```

---

## A generic class (a teaser)

```typescript
class Box<T> {
  #value: T;
  constructor(value: T) { this.#value = value; }
  get(): T { return this.#value; }
  map<R>(fn: (v: T) => R): Box<R> {
    return new Box(fn(this.#value));
  }
}
```

In detail — [16-classes](16-classes.md).

---

## Default type parameter

```typescript
interface Paginated<T, M = { page: number; total: number }> {
  items: T[];
  meta: M;
}
```

---

## Variance (intuition)

Under `strictFunctionTypes` you can't assign `(p: { name: string }) => void` where `(p: Product) => void` is expected — parameters are **contravariant**. Don't pass a «too narrow» callback without understanding the contract.

---

## Related courses

| Lesson | Relation |
|------|-------|
| [10-functions](10-functions.md) | `first<T>` |
| [14-utility-types](14-utility-types.md) | `Partial<T>` |
| [15-lab-generics](15-lab-generics.md) | Repository |
| [19-type-guards](19-type-guards.md) | `filter` with `p is T` |

---

## Common mistakes

| Mistake | Cause | Fix |
|--------|---------|-------------|
| `T extends any` | Disables checks | A concrete constraint |
| `findById` → `HasId` | Didn't preserve T | `T \| undefined` |
| Generic without using T | An unnecessary parameter | Remove it |
| Copy-paste of 5 repositories | Fear of generics | `Repository<T>` |

---

## In production

- A single `Repository<T extends HasId>` — a bridge to the HTTP client for `:8090` in the nodejs course.
- Generics at the **boundary** (cache, API wrapper); domain types — concrete `Product`, `Order`.
- Not `<any>` «just to make it compile» — fix the argument or the constraint.

---

## Summary

Generics parameterize types without erasing them to `any`. `T extends Constraint` limits the allowed types. Generic interfaces are contracts for shop and the API. Inference works in most calls.

---

## Checklist

- How is `identity<T>(x: T): T` better than `(x: any) => any`?
- Why `T extends HasId` in `findById`?
- How does TS infer `T` in `first([1,2,3])`?
- When is a generic **not** needed?

Next lesson: [14. Utility types](14-utility-types.md).
