# 02. Type annotations and inference

## Intro: a scenario from work

Code review of a BFF to the shop API. A junior annotated **every** variable:

```typescript
const title: string = "Keyboard";
const price: number = 79.99;
const qty: number = 2;
const total: number = price * qty;
```

Senior: «TypeScript already inferred the types — the noise clutters the diff». In the next file the same junior did **not** annotate a function's return — `return price + qty` glued a string to a number, because `price` came in from the query as a string, and TS inferred `any` from `JSON.parse`. Two extremes: **redundant** annotations and the **`any` hole**.

In [`javascript-basic/04-primitives`](../javascript-basic/04-primitives.md) you checked `typeof` at runtime. TypeScript does something similar **at compile time** — but only if you don't disable the check via `any`. On `:8090`, FastAPI returns `price` as a number in JSON; before integration you model the data locally and learn to **trust inference where it's obvious** and to **explicitly type the boundaries** (function parameters, API responses).

## What you'll learn

- Basic annotations: `string`, `number`, `boolean`, `void`, `unknown`.
- **Type inference** — when TS knows the type on its own.
- Where annotations are **required** and where they are **superfluous**.
- The **`any`** trap and why it's avoided under `strict`.
- Annotations for function parameters and return values.
- The connection to habits from javascript-basic (`typeof`, explicit parse).

## Explicit annotations

Syntax: **name : type**:

```typescript
let port: number = 8090;
let apiBase: string = "http://localhost:8090/api/v1";
let debug: boolean = false;

function greet(name: string): string {
  return `Hello, ${name}`;
}
```

For function **parameters**, annotations are almost always needed (without them — an implicit `any` in non-strict modes; under `noImplicitAny` — an error):

```typescript
function lineTotal(price: number, quantity: number): number {
  return price * quantity;
}
```

The **return type** can be omitted when the body is obvious — TS will infer `number`. In a library's public API and complex functions the return is **better stated explicitly** — a contract for callers.

## Type inference

```typescript
const title = "Keyboard";       // string (literal widening to string)
let price = 79.99;              // number
const ids = [1, 2, 3];          // number[]
const product = { id: 1, title: "Mouse", price: 29.99 };
// product: { id: number; title: string; price: number }
```

Course rule: **`const` + initializer** → confidently go without an annotation. **Boundaries** (function arguments, API fields, empty arrays) → explicitly:

```typescript
const items: { id: number; title: string }[] = [];
items.push({ id: 1, title: "Desk" }); // OK

const bad = [];
bad.push({ id: 1 }); // without an annotation: never[] or any[] — painful
```

### Best common type

```typescript
const values = [1, "two", true];
// (string | number | boolean)[] — a union of the elements
```

Like mixing types in JS, but **fixed** statically.

## Basic TypeScript types

| TS type | JS analog | Note |
|--------|-----------|------------|
| `string` | string | UTF-16 as in JS |
| `number` | number | one double + NaN, Infinity |
| `boolean` | boolean | |
| `bigint` | bigint | `100n` |
| `null` | null | a separate type |
| `undefined` | undefined | |
| `void` | `undefined` in return | «nothing useful» |
| `never` | unreachable | a function that always throws |

```typescript
function fail(msg: string): never {
  throw new Error(msg);
}

function logPrice(price: number): void {
  console.log(price);
  // return; — implicitly undefined, OK for void
}
```

`void` ≠ «return is forbidden» — you can `return;` or `return undefined`.

## `any` — the escape hatch (and the trap)

`any` turns off checking for a value:

```typescript
let payload: any = JSON.parse('{"price":"79.99"}');
const total: number = payload.price * 2; // compiles — a bomb at runtime
```

In [`javascript-basic`](../javascript-basic/04-primitives.md) the same bug appears with no warning. With **`strict: true`**, an implicit `any` is an error; an explicit `any` is a code smell.

```typescript
// eslint @typescript-eslint/no-explicit-any in mock-exams teams
function legacyHandler(data: any) { /* ... */ }
```

**Alternatives:**

```typescript
function parseUnknown(raw: string): unknown {
  return JSON.parse(raw);
}

const data = parseUnknown('{"id":1}');
// data.id — a TS error; narrowing is needed — lesson 08
```

| Type | Checks |
|-----|----------|
| `any` | off |
| `unknown` | must be narrowed before use |
| a concrete type | full checks |

## Annotations vs inference: practical rules

1. **Function parameters** — annotate.
2. **Return of public functions** — annotate if not trivial.
3. **Local `const`** with a literal — don't annotate without a reason.
4. **Empty collections** — annotate the element.
5. **Boundary with JSON / :8090** — `unknown` + parse, not `any`.

A shop-domain example:

```typescript
type Money = number; // an alias for readability; not yet branded

function formatRub(amount: Money): string {
  return `${amount.toFixed(2)} ₽`;
}

const unitPrice = 79.99;
formatRub(unitPrice); // inference: number → Money OK
```

## Functions: optional parameters and default values

```typescript
function fetchItems(
  baseUrl: string,
  page = 1,
  pageSize?: number
): string {
  const size = pageSize ?? 20;
  return `${baseUrl}/items?page=${page}&size=${size}`;
}

fetchItems("http://localhost:8090/api/v1");
// page: number, pageSize: number | undefined
```

The optional `?` and defaults come from JS ([`javascript-basic/10-functions`](../javascript-basic/10-functions.md)); TS reflects them in the type `T | undefined`.

## Type assertions (preview — be careful)

```typescript
const el = document.getElementById("root") as HTMLElement;
```

An assertion **does not change** the runtime — it only tells the compiler «trust me». For DOM and legacy it's sometimes necessary; for API JSON prefer validation. A double assertion `as unknown as Foo` is a red flag in review.

## Connection to javascript-basic

What you did at runtime:

```javascript
if (typeof value !== "number" || !Number.isFinite(value)) {
  throw new TypeError("price must be number");
}
```

In TS, for **internal** code:

```typescript
function charge(price: number): void {
  // typeof is not needed — the contract is at the input
}
```

Runtime checks stay at the **external** boundary (HTTP, `JSON.parse`, localStorage) — like Pydantic on `:8090` for the HTTP body.

## How this connects to the course

| Lesson | Relation |
|------|-------|
| [04. Primitives and literals](04-primitives-literals.md) | literal types, `as const` |
| [05. Unions](05-unions-intersections.md) | `string \| number` |
| [08. Narrowing](08-narrowing.md) | from `unknown` to a concrete type |
| [03. Lab](03-lab-first-ts.md) | TS errors in practice |
| [`javascript-basic/04`](../javascript-basic/04-primitives.md) | semantics of primitives |

## Common mistakes

**Annotating everything.** Noise; trust inference for simple `const`s.

**Not annotating an empty array.** `const x = []` → never[] / problems with push.

**`any` «temporarily» for years.** A single `any` infects the chain of assignments.

**Thinking types = validation.** `as Product` after parse does not check the fields.

**Confusing `void` and `undefined` in a return type.** For callbacks it sometimes matters — a rare edge case.

**Duplicating a type where inference is more precise.** `const x: number = 5` is superfluous.

## Summary

**Annotations** set the contract; **inference** removes the routine where the type is obvious from the value. Basic types mirror JS primitives. **`any`** disables protection — use **`unknown`** at boundaries. Parameters and API — explicitly; local `const`s — often without an annotation. Internal shop code is typed strictly; data from `:8090` — via parse + narrowing.

## Checklist

- [ ] When does TS infer a type without an annotation?
- [ ] Why annotate function parameters?
- [ ] How does `any` differ from `unknown`?
- [ ] What will inference produce for `const x = [1, 2, 3]`?
- [ ] Why is `const items = []` dangerous without a type?
- [ ] Where in a shop BFF is a runtime check needed, even with TS?

Next lesson: [03. Lab: first TypeScript](03-lab-first-ts.md).
