# 17. Enum, `as const` and `satisfies`

## A scenario from work

Shop order statuses: `pending`, `paid`, `shipped`, `cancelled`. The team argues: an **enum**, a union with `as const`, or strings «as received» from the API. A junior declared `enum OrderStatus` — an extra object in the bundle; the switch isn't exhaustive — a new status from the backend silently falls into `default`. The team lead: `const ORDER_STATUSES = [...] as const` + `satisfies readonly string[]`.

## What you'll learn

- **String / numeric enum** — pros and cons
- **`const enum`** and tree-shaking
- **`as const`** and a derived union
- **`satisfies`** — a check without losing literals
- The union object pattern and validation with `:8090`

---

## String enum

```typescript
enum OrderStatus {
  Pending = "pending",
  Paid = "paid",
  Shipped = "shipped",
  Cancelled = "cancelled",
}

function isFinal(status: OrderStatus): boolean {
  return status === OrderStatus.Cancelled;
}
```

**Pros:** a namespace, autocompletion. **Cons:** a runtime object; not all style guides like enum.

---

## Numeric enum (be careful)

```typescript
enum Direction {
  Up,    // 0
  Down,  // 1
}
```

The reverse mapping is a trap. For shop — **string** literals.

---

## `const enum`

Inlined at compile time — no runtime object. Downsides with isolated modules / a bundler. For HTTP codes, literals are often enough.

---

## A modern alternative: `as const` + union

```typescript
const ORDER_STATUSES = ["pending", "paid", "shipped", "cancelled"] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

function assertOrderStatus(value: string): asserts value is OrderStatus {
  if (!(ORDER_STATUSES as readonly string[]).includes(value)) {
    throw new Error(`Invalid status: ${value}`);
  }
}
```

Labels for the UI:

```typescript
const STATUS_LABELS = {
  pending: "Awaiting payment",
  paid: "Paid",
  shipped: "Shipped",
  cancelled: "Cancelled",
} as const satisfies Record<OrderStatus, string>;
```

---

## The `satisfies` operator

Checks conformance to a type while **preserving** the narrow literals:

```typescript
type Route = "/" | "/cart" | "/checkout";

const ROUTES = {
  home: "/",
  cart: "/cart",
  checkout: "/checkout",
} as const satisfies Record<string, Route>;
```

Without `satisfies`, the annotation `Record<string, Route>` **widens** the values to `Route`, losing the specific keys.

---

## Union object pattern

```typescript
const Category = {
  Electronics: "electronics",
  Furniture: "furniture",
} as const;

type Category = (typeof Category)[keyof typeof Category];
```

A single source of truth for the runtime and the types.

---

## Enum vs union

| Criterion | `enum` | `as const` + union |
|----------|--------|---------------------|
| Runtime JS | An object | Literals / an array |
| A new API status | Divergence | Validation + extension |
| Exhaustive switch | Yes | Yes + `never` ([20](20-discriminated-unions.md)) |
| Modern style guides | Often «avoid» | Preferred |

---

## Data from `:8090`

```typescript
function toOrderStatus(raw: string): OrderStatus {
  if ((ORDER_STATUSES as readonly string[]).includes(raw)) {
    return raw as OrderStatus;
  }
  throw new Error(`Unknown order status: ${raw}`);
}
```

Later — Zod `.enum([...])`.

---

## `satisfies` for a seed config

```typescript
type ProductSeed = { name: string; price: number; category: Category };

const SEED_PRODUCTS = [
  { name: "Keyboard", price: 79.99, category: Category.Electronics },
] as const satisfies readonly ProductSeed[];
```

---

## Related courses

| Lesson | Relation |
|------|-------|
| [11-arrays-tuples](11-arrays-tuples.md) | `as const` |
| [19-type-guards](19-type-guards.md) | assert status |
| [20-discriminated-unions](20-discriminated-unions.md) | tagged status |

---

## Common mistakes

| Mistake | Cause | Fix |
|--------|---------|-------------|
| Numeric enum for statuses | A habit from C# | String union |
| Forgot `as const` | `string[]` | Assertion |
| Switch without `never` | A new status silently hits default | `assertNever` |
| `enum` + string API duplicates | Two sources | A single `as const` |

---

## In production

- Airbnb/modern TS — union + `as const`; enum only if the team agreed.
- Statuses from the backend — validate at the boundary, not `string` in the domain.
- `satisfies` for theme, routes, category maps.

---

## Summary

**Enum** is convenient but gives you runtime. **`as const`** + union is the default for shop statuses. **`satisfies`** checks a config without losing literals. Validate and narrow values from `:8090`.

---

## Checklist

- How do you get `type OrderStatus` from an array of constants?
- Why `satisfies Record<OrderStatus, string>`?
- Why is a numeric enum dangerous for statuses?
- How do you handle a new status from the API?

Next lesson: [18. Lab: Product hierarchy](18-lab-classes.md).
