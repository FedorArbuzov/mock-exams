# 11. Arrays and tuples: `Array<T>`, `readonly`, `as const`

## A scenario from work

The `GET http://localhost:8090/api/v1/items` response is a JSON array. In TypeScript you described it as `Product[]`, but in one place you called `.push()` on the catalog constant, and in another — passed `["electronics", 100]` where a tuple `[category, maxPrice]` was expected. `tsc` caught the second; the first slipped through, and the React admin panel got a **cache mutation** — the same bug as in [javascript-basic/08-arrays](../javascript-basic/08-arrays.md) with `sort()` on state.

Another case: order statuses `["pending", "paid", "shipped"]` — you need a **union of literals**, not `string[]`, so that the `switch` is exhaustive ([20-discriminated-unions](20-discriminated-unions.md)). The senior suggests `as const` + `(typeof STATUSES)[number]`.

## What you'll learn

- The syntax of **`T[]`** and **`Array<T>`**
- **`readonly T[]`** and `ReadonlyArray<T>`
- **Tuples** `[string, number]`, optional and rest elements
- **`as const`** — deep immutability and literal types
- The difference between an **array** and a **tuple** in an API
- Typical production bugs

---

## Arrays: `T[]` and `Array<T>`

```typescript
type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

const products: Product[] = [
  { id: 1, name: "Keyboard", price: 79.99, category: "electronics" },
  { id: 2, name: "Mouse", price: 29.99, category: "electronics" },
];

const ids: Array<number> = products.map((p) => p.id);
```

Both syntaxes are **equivalent**. Methods inherit the element type:

```typescript
const cheap = products.filter((p) => p.price < 50); // Product[]
const total = products.reduce((s, p) => s + p.price, 0); // number
```

**Important:** `filter` without a type guard doesn't narrow a union — for `(Product | null)[]` you need `filter((p): p is Product => p !== null)` ([19-type-guards](19-type-guards.md)).

---

## Readonly arrays

```typescript
const catalog: readonly Product[] = products;

// catalog.push(...)  // error TS2339
// catalog[0] = ...   // error
```

| Type | Mutation `push/sort` | Assignment by index |
|-----|---------------------|------------------------|
| `T[]` | allowed | allowed |
| `readonly T[]` | compile error | compile error |

**Runtime:** `readonly` **does not freeze** the object — it's only a TypeScript check. Shallow: a `readonly` array still allows mutating element **fields** if they aren't readonly.

The API snapshot pattern:

```typescript
function renderCatalog(items: readonly Product[]): void {
  // items.toSorted(...) OK in ES2023+
}
```

---

## Tuples

A fixed **length** and a **type for each position**:

```typescript
type PriceRange = [min: number, max: number];
type QueryPair = [field: string, value: string];

const electronicsCap: PriceRange = [0, 100];
const filter: QueryPair = ["category", "electronics"];

function inRange(price: number, [min, max]: PriceRange): boolean {
  return price >= min && price <= max;
}
```

### Optional and rest in a tuple

```typescript
type HttpResult = [status: number, body?: string];
type StringNumberRest = [string, ...number[]];

const row: StringNumberRest = ["qty", 1, 2, 3];
```

### Tuple vs array

```typescript
const a: string[] = ["a", "b", "c"];       // any length
const t: [string, string] = ["a", "b"];    // exactly 2
// const bad: [string, number] = ["x", 1, 2]; // error
```

**When a tuple in shop:** a pair `[category, maxPrice]`, grid coordinates, `[data, error]` before a discriminated union, a `useState` tuple in the react course.

---

## `as const`: literals and readonly deeply

```typescript
const ORDER_STATUSES = ["pending", "paid", "shipped", "cancelled"] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];
// "pending" | "paid" | "shipped" | "cancelled"
```

A category object:

```typescript
const CATEGORIES = {
  electronics: "electronics",
  furniture: "furniture",
} as const;

type CategoryKey = keyof typeof CATEGORIES;
```

Without `as const`, the status array becomes `string[]` — the union of literals is **lost**. More on `satisfies` — [17-enums-const](17-enums-const.md).

---

## Typing JSON from `:8090`

OpenAPI items — an **array of objects**, not a tuple:

```typescript
interface ItemDto {
  id: number;
  title: string;
  price: number;
}

async function fetchItems(): Promise<readonly ItemDto[]> {
  const res = await fetch("http://localhost:8090/api/v1/items");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: ItemDto[] = await res.json();
  return data;
}
```

The contract **doesn't guarantee** field order — a tuple for a single item isn't needed; an `ItemDto` interface is better.

---

## Multidimensional arrays

```typescript
type Matrix = number[][];
type Table = readonly (readonly string[])[];

const grid: Matrix = [
  [1, 2],
  [3, 4],
];
```

---

## Related courses

| Lesson | Relation |
|------|-------|
| [javascript-basic/08-arrays](../javascript-basic/08-arrays.md) | map/filter, mutations |
| [10-functions](10-functions.md) | rest `...args: T[]` |
| [12-lab-functions](12-lab-functions.md) | catalog filters |
| [14-utility-types](14-utility-types.md) | `Readonly`, `Pick` |
| [17-enums-const](17-enums-const.md) | `as const`, `satisfies` |

---

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| `[string, number][]` instead of a tuple | Confusion over «a pair of values» | `[string, number]` for one pair |
| Mutating `readonly` at runtime | readonly is compile-time only | A copy `[...arr]` or `toSorted` |
| `string[]` for statuses | Loss of the union | `as const` + derived union |
| Cast `as [A,B]` without a check | False confidence | Validation / Zod at the boundary |
| `[T]` vs `T[]` | A tuple of length 1 vs an array | Document explicitly |

---

## In production

- Store the catalog cache from `:8090` as `readonly Product[]` — a signal «don't mutate in place».
- Statuses and categories — a single `as const` source; keep guards in sync with the array ([19-type-guards](19-type-guards.md)).
- For CSV import — `string[][]`; for typed rows — `Product[]` after validation.

---

## Summary

`T[]` is a homogeneous collection of variable length. `readonly T[]` forbids mutations in the types. A **tuple** has fixed positions. **`as const`** preserves literals — the basis of the status union. Model JSON lists from FastAPI as `Dto[]`.

---

## Checklist

- How does `readonly Product[]` differ from `Product[]` at compile-time and runtime?
- When is `[string, number]` better than `{ field: string; value: number }`?
- How do you get a union from `const STATUSES = [...] as const`?
- Why doesn't `filter` remove `null` without a type guard?
- What does `Promise<readonly ItemDto[]>` type?

Next lesson: [12. Lab: typed shop functions](12-lab-functions.md).
