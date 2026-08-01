# 19. Type guards: narrowing types at runtime

## Scenario from work

The BFF receives `unknown` from `res.json()` after a `fetch` to `:8090`. A junior casts `as Product` — `{ title: 123 }` arrives, and the admin panel crashes on `name.toUpperCase()`. You need **runtime checks** after which TypeScript **narrows** the type: `value is Product`, `typeof` / `in` / `instanceof`, and **assertion functions** `asserts value is T` for fail-fast at the API boundary.

Related to [08-narrowing](08-narrowing.md): that covered control flow; here you write **your own** predicates for the shop domain types.

## What you'll learn

- **User-defined type guard** `function isProduct(x: unknown): x is Product`
- **Assertion functions** `asserts value is T`
- Built-in guards and `filter` with a predicate
- `unknown` vs `any` at the I/O boundary
- Limitations and the `as` antipattern

---

## Why guards at the boundary

```typescript
async function fetchUnknown(): Promise<unknown> {
  const res = await fetch("http://localhost:8090/api/v1/items/1");
  return res.json();
}

async function loadProduct(): Promise<Product> {
  const data = await fetchUnknown();

  if (!isProduct(data)) {
    throw new Error("Invalid product payload");
  }

  return data; // Product — without `as`
}
```

TypeScript **trusts** the guard after the `if` branch.

---

## Built-in narrowing

### `typeof` — primitives

```typescript
function formatId(id: string | number): string {
  if (typeof id === "number") return String(id);
  return id.trim();
}
```

### `in` — object fields

```typescript
type Admin = { role: "admin"; permissions: string[] };
type Guest = { role: "guest" };

function canEdit(user: Admin | Guest): boolean {
  if ("permissions" in user) {
    return user.permissions.includes("edit");
  }
  return false;
}
```

### `instanceof` — classes

```typescript
function logProduct(item: Product | string) {
  if (item instanceof Product) {
    console.log(item.describe());
  }
}
```

`instanceof` is for **constructors**, not for interfaces.

---

## User-defined type guard

```typescript
export function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "number" &&
    typeof v.name === "string" &&
    typeof v.price === "number" &&
    typeof v.category === "string"
  );
}

function isProductArray(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every(isProduct);
}
```

### With `filter`

```typescript
const mixed: (Product | null)[] = [product, null, product];

const onlyProducts = mixed.filter((p): p is Product => p !== null);
// Product[] — not (Product | null)[]
```

Without `p is Product` the union is **not narrowed**.

---

## Assertion functions

```typescript
export function assertProduct(value: unknown): asserts value is Product {
  if (!isProduct(value)) {
    throw new Error("Expected Product shape");
  }
}

function process(data: unknown) {
  assertProduct(data);
  console.log(data.name); // Product
}
```

| | Type guard `is T` | Assertion `asserts` |
|---|-------------------|---------------------|
| Return | `boolean` | `void` |
| Error | caller decides | usually throw |

---

## Narrowing literal unions

Keep in sync with `as const` from [17-enums-const](17-enums-const.md):

```typescript
const PAYMENT_METHODS = ["card", "cash", "invoice"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function isPaymentMethod(s: string): s is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(s);
}
```

---

## `unknown` vs `any`

```typescript
function parseJson(text: string): unknown {
  return JSON.parse(text);
}
```

At the I/O boundary — **`unknown` + guard**, not `any`.

---

## Guard limitations

- A structural check does not replace Zod for complex rules.
- `isProduct` may not check `price >= 0` — business validation is separate.
- The predicate must be **honest** — a false `true` breaks typing at runtime.

---

## Related courses

| Lesson | Relation |
|------|-------|
| [08-narrowing](08-narrowing.md) | control flow |
| [11-arrays-tuples](11-arrays-tuples.md) | `filter` + `is T` |
| [21-lab-discriminated](21-lab-discriminated.md) | ApiResult |
| [javascript-basic/32-error-handling](../javascript-basic/32-error-handling.md) | throw at the boundary |

---

## Common mistakes

| Mistake | Cause | Fix |
|--------|---------|-------------|
| `as Product` on json | No runtime check | `isProduct` |
| Guard always `true` | Too lazy to check | Honest predicate |
| `instanceof` for an interface | No class | Structural guard |
| `filter(Boolean)` | Does not narrow | `filter((x): x is T => ...)` |

---

## In production

- A single point for guards for `:8090` — `product-guards.ts`, not `as` in every handler.
- FastAPI may return `title` — guard or mapper **before** the domain `Product`.
- Later Zod will replace manual guards — don't duplicate rules in two places.

---

## Summary

Guards connect a runtime check and compile-time types. `is X(value): value is X` for `unknown`. Assertions are fail-fast. `filter` with a predicate removes `null` from a union.

---

## Checklist

- Why is `unknown` better than `any` at the JSON boundary?
- Why does `filter(Boolean)` not yield `Product[]`?
- How does an assertion differ from a guard?
- When is `instanceof` not suitable?

Next lesson: [20. Discriminated unions](20-discriminated-unions.md).
