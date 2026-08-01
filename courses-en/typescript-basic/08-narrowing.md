# 08. Type narrowing

## Intro: a scenario from work

A BFF receives a webhook body: sometimes an **order creation**, sometimes a **cancellation**. The `type` field in the JSON is `"order.created" | "order.cancelled"`. While the type is `payload: unknown` or a wide union, you can't safely access `payload.orderId`. After `if (payload.type === "order.created")`, TypeScript **narrows** the union — `orderId` becomes available. Without this pattern developers write `(payload as any).orderId` — and again bugs like in plain JS.

A second case: `typeof price === "number"` — a legacy from [`javascript-basic/04`](../javascript-basic/04-primitives.md), but now the **compiler** understands the branches. A third: `error instanceof Error` in catch — not `error.message` on `unknown`. Narrowing is the bridge from **union/unknown** to concrete operations in shop code and parsers of `:8090` responses.

## What you'll learn

- **Control flow narrowing** — TS tracks `if`, `return`, `switch`.
- **`typeof`** for primitives.
- **`in`** for object fields.
- **`instanceof`** for classes and `Error`.
- **Discriminated unions** by a shared field.
- **Type predicates** `arg is T` (overview).
- The parse boundary pattern: `unknown` → validated type.

## Why narrowing

```typescript
function formatAmount(value: string | number): string {
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return value.trim();
}
```

Outside the `if`, `value` is `string | number`; inside the `number` branch — only `number`. Without the check, `.toFixed` is a TS2339 error.

## typeof

Works for: `"string"`, `"number"`, `"bigint"`, `"boolean"`, `"symbol"`, `"undefined"`, `"object"`, `"function"`.

```typescript
function parsePort(input: string | number): number {
  if (typeof input === "number") {
    return input;
  }
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid port");
  }
  return parsed;
}
```

**Traps** (as in JS):

```typescript
typeof null;        // "object" — doesn't reliably narrow to null
typeof [];          // "object"
typeof (() => {});  // "function"
```

For `null` — `value === null`; for an array — `Array.isArray(value)`.

## Truthiness narrowing

```typescript
function printTitle(title: string | undefined): void {
  if (title) {
    console.log(title.toUpperCase());
  }
}
```

Inside the branch, `title` is `string` (falsy `""` is cut off — remember from javascript-basic). For an **explicit** null/undefined, prefer `!= null` or `??`.

## The in operator

```typescript
type Cat = { meow: () => void };
type Dog = { bark: () => void };

function speak(pet: Cat | Dog): void {
  if ("meow" in pet) {
    pet.meow();
  } else {
    pet.bark();
  }
}
```

For a union of **objects** with different fields — the shop events idiom.

```typescript
interface CreatedEvent {
  type: "order.created";
  orderId: number;
}

interface CancelledEvent {
  type: "order.cancelled";
  reason: string;
}

type OrderEvent = CreatedEvent | CancelledEvent;

function handleEvent(e: OrderEvent): void {
  if (e.type === "order.created") {
    console.log("New order", e.orderId);
  } else {
    console.log("Cancelled:", e.reason);
  }
}
```

## Discriminated unions

A shared field (the **discriminant**) with a literal type:

```typescript
type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; items: Product[] }
  | { status: "error"; message: string };

function render(state: LoadState): string {
  switch (state.status) {
    case "idle":
      return "Click to load";
    case "loading":
      return "Loading from :8090...";
    case "success":
      return `Items: ${state.items.length}`;
    case "error":
      return state.message;
    default:
      const _exhaustive: never = state;
      return _exhaustive;
  }
}
```

`never` in `default` is an **exhaustiveness check**: forget a branch and TS warns you.

## instanceof

```typescript
function logError(err: unknown): void {
  if (err instanceof Error) {
    console.error(err.message, err.stack);
    return;
  }
  console.error("Unknown error", err);
}
```

Works with classes from `global`/`node`. Plain objects from JSON are **not** `instanceof` your interfaces.

```typescript
class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}
```

## Equality narrowing

```typescript
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // x and y: string
  }
}
```

Comparison with a **literal**:

```typescript
function setStatus(s: ProductStatus): void {
  if (s === "archived") {
  }
}
```

## Type predicates (overview)

```typescript
interface Product {
  id: number;
  title: string;
}

function isProduct(value: unknown): value is Product {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as Product).id === "number" &&
    "title" in value &&
    typeof (value as Product).title === "string"
  );
}

function consume(raw: unknown): void {
  if (isProduct(raw)) {
    console.log(raw.title);
  }
}
```

`value is Product` is a **custom narrowing**; for production JSON Zod is better; for the course — understanding the mechanism.

## unknown vs any at the boundary

```typescript
async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  return res.json();
}

// const data = await fetchJson("http://localhost:8090/api/v1/items");
// data.items — error; narrow or parse first
```

The chain for the shop API (simplified):

```typescript
function assertItemsPayload(data: unknown): asserts data is { items: Product[] } {
  if (
    typeof data !== "object" ||
    data === null ||
    !("items" in data) ||
    !Array.isArray((data as { items: unknown }).items)
  ) {
    throw new Error("Invalid items payload from API");
  }
}
```

**Assertion functions** `asserts data is T` — narrow after the call.

## Connection to javascript-basic

The runtime checks you wrote by hand are now **duplicated** by the compiler inside branches:

| JS habit | TS narrowing |
|----------|----------------|
| `typeof x === "number"` | yes |
| `Array.isArray(x)` | yes |
| `x && x.field` | truthiness |
| `x === null` | equality |

Outside narrow spots, TS **does not remember** the narrowing — each branch starts fresh.

## How this connects to the course

| Lesson | Relation |
|------|-------|
| [05. Unions](05-unions-intersections.md) | what to narrow |
| [02. unknown](02-annotations-inference.md) | parse input |
| [09. Lab objects](09-lab-objects.md) | guards for the catalog |
| [06. Lab](06-lab-unions.md) | the `ok` discriminant |
| [`javascript-basic/32`](../javascript-basic/32-error-handling.md) | catch unknown |

## Common mistakes

**Cast instead of narrow:** `(x as Product).id` — bypassing TS.

**Relying on `typeof null`.** Use `=== null`.

**Forgetting break in switch** — fall-through breaks the logic (TS won't always save you).

**instanceof for an interface.** Interfaces aren't in the runtime.

**Narrowing «outside» the if block.** TS doesn't carry knowledge across unrelated calls.

**A non-exhaustive switch** over a union — add a `never` default.

## Summary

**Narrowing** turns a `union` and `unknown` into a concrete type via `typeof`, `in`, `===`, `instanceof`, discriminant. **Control flow** analysis is TS's strength with no runtime cost. Discriminated unions model API responses and UI state. At the boundary with **:8090** — `unknown` + guards; `as` only with proof. Lab 09 reinforces it on the catalog.

## Checklist

- [ ] Narrow `string | number` via `typeof`
- [ ] Explain the discriminant on `LoadState`
- [ ] Why is `instanceof` not for `interface Product`?
- [ ] What does `value is Product` do?
- [ ] Why `const _x: never = state` in a switch?
- [ ] The difference between cast `as` and narrowing

Next lesson: [09. Lab: typed catalog](09-lab-objects.md).
