# 04. Primitive types

## Intro: a scenario from work

Production alert: "The total for order #8842 is off by a cent." In the logs of a Node BFF talking to FastAPI at `:8090` you see `total: 109.97999999999999` instead of `109.98`. In parallel, QA files a bug: "The optional `middleName` field — undefined or null? The API returns null, the frontend checks `if (!user.middleName)` — all fine, but TypeScript complains." A third ticket: "Product ID from JSON `9007199254740993` matched a different product after parsing" — the classic **IEEE 754** and `Number.MAX_SAFE_INTEGER`.

In code review a junior writes:

```javascript
if (typeof user.id === "null") { /* ... */ }
```

The review sits for a week: `typeof null === "object"` is a historical bug, and it will **never** return `"null"`. In an interview you're asked to list the **falsy** values — the candidate forgets `0n` and `document.all` (a browser legacy).

Primitives are not a "boring exam table." They are the **data contract** between FastAPI Pydantic, JSON, JavaScript, and your future TypeScript. A `number` vs `string` mistake for `price` breaks checkout just as reliably as SQL injection breaks a backend — just more quietly.

## What you'll learn

- The seven **primitive** types in ES2020+ and how to check them.
- Why all **numbers** (except BigInt) are IEEE 754 doubles and what follows from that.
- **String**, immutability, template strings, basic methods.
- **Boolean**, the full list of **falsy** / **truthy**, and pitfalls in `if`.
- **`null` vs `undefined`** — semantics and JSON.
- **`BigInt`** and **`Symbol`** — when you actually need them.
- Primitive vs **wrapper object**; reliable type checks.

## Primitives and objects: two categories of values

In JavaScript a value is either a **primitive** or an **object**, including arrays, functions, and `Date`:

```javascript
// Primitives — stored "by value" on assignment
let a = 10;
let b = a;
b = 20;
console.log(a); // 10 — a did not change

// Objects — a reference; see lesson 07
const cartA = { items: 1 };
const cartB = cartA;
cartB.items = 2;
console.log(cartA.items); // 2
```

| Type | Example | `typeof` |
|-----|--------|----------|
| `undefined` | `let x;` | `"undefined"` |
| `null` | `const x = null` | `"object"` * |
| `boolean` | `true`, `false` | `"boolean"` |
| `number` | `42`, `3.14`, `NaN` | `"number"` |
| `bigint` | `100n` | `"bigint"` |
| `string` | `"hi"`, `` `hi` `` | `"string"` |
| `symbol` | `Symbol("id")` | `"symbol"` |

\* **`typeof null === "object"`** — a compatibility bug from 1995. The only reliable null test: **`value === null`**.

```javascript
typeof 42;              // "number"
typeof "hello";         // "string"
typeof true;            // "boolean"
typeof undefined;       // "undefined"
typeof Symbol("x");     // "symbol"
typeof 10n;             // "bigint"
typeof {};              // "object"
typeof [];              // "object" — an array is also an object!
typeof function(){};    // "function" — a subtype of object
```

## Number: one type for integers and decimals

Except for **BigInt**, all numbers are **IEEE 754 double-precision** (64 bits). Integers and decimals are one type:

```javascript
const price = 79.99;
const qty = 3;
const lineTotal = price * qty; // 239.97 — sometimes 239.96999999999997

console.log(0.1 + 0.2);              // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);      // false

// Practice for shop money: store cents as an integer or round explicitly
const cents = Math.round(79.99 * 100); // 7999
```

Literals:

```javascript
42;
3.14;
1e6;           // 1000000 — exponent
0xff;          // 255 — hex
0b1010;        // 10 — binary
NaN;           // Not a Number — result of invalid math
Infinity;
-Infinity;
```

### NaN and checks

`NaN` is the only value in JS that is **not equal to itself** under `===`:

```javascript
NaN === NaN;           // false
Number.isNaN(NaN);     // true — preferred
Number.isNaN("hello"); // false — no coercion
isNaN("hello");        // true — legacy string coercion
```

### Safe integers and BigInt

```javascript
Number.MAX_SAFE_INTEGER; // 9007199254740991 (2^53 - 1)

9007199254740992 === 9007199254740992 + 1; // true
true — precision loss!

const productId = 9007199254740993n; // BigInt literal
productId + 1n; // 9007199254740994n
// productId + 1; // TypeError — can't mix with number without explicit conversion
```

BigInt — for 64-bit snowflake IDs, blockchain, some Postgres `BIGINT` fields. The mock-exams shop API usually fits within a safe integer; knowing the boundary is a must for interviews.

```javascript
Number.isFinite(42); // true
Number.isFinite(Infinity); // false
Number.isInteger(3.0);     // true
Number.isInteger(3.14);    // false
```

## String: immutable UTF-16 sequences

Strings are **immutable** — methods return a **new** string:

```javascript
const sku = "KB-001";
sku.toUpperCase(); // "KB-001" if already upper, or "KB-001"
console.log(sku);  // "KB-001" — the original didn't change
```

Methods for everyday work with catalog data:

```javascript
"  Keyboard  ".trim();           // "Keyboard"
"a,b,c".split(",");              // ["a", "b", "c"]
"product.json".endsWith(".json"); // true
"Mouse".includes("ou");          // true
"Keyboard".slice(0, 3);          // "Key"
"€99".length;                    // may be 4 due to emoji surrogate pairs
```

Template strings (ES2015):

```javascript
const name = "Ann";
const item = "Desk";
const msg = `Customer ${name} ordered ${item}.
Total lines: ${2}`;
```

**Emoji and length:** `"👋".length === 2` (surrogate pair). To count "characters," sometimes use `[...str].length` or `Intl.Segmenter`.

## Boolean and truthy / falsy

Conditions and `&&`/`||` coerce operands to a boolean context, but don't always return `true`/`false` — see [05-coercion-comparison.md](05-coercion-comparison.md).

**Falsy** — values that behave like false in `if (x)`:

```javascript
Boolean(false);     // false
Boolean(0);         // false
Boolean(-0);        // false
Boolean(0n);        // false — BigInt zero
Boolean("");        // false
Boolean(null);      // false
Boolean(undefined); // false
Boolean(NaN);       // false
```

**Everything else is truthy**, including:

```javascript
Boolean([]);        // true — an empty array!
Boolean({});        // true
Boolean("0");       // true — a non-empty string
Boolean("false");   // true
```

```javascript
const port = 0;
if (port) {
  console.log("custom port"); // won't run — 0 is falsy
}
// For BFF port defaults use ?? — lessons 05, 19
```

## `null` vs `undefined`

| | `undefined` | `null` |
|---|-------------|--------|
| Meaning | "value not set" | "intentionally empty / no object" |
| Type | undefined | object (typeof bug for null) |
| JSON | key is omitted | `"field": null` |
| Typical source | missing property, no return, undeclared parameter | API, DB, explicit nulling |

```javascript
const user = { name: "Ann" };
console.log(user.middleName); // undefined — no such property

const response = JSON.parse('{"discount":null}');
console.log(response.discount); // null — the server explicitly said "no discount"

function greet(name) {
  console.log(name); // undefined if called as greet()
}
```

Modern default: **`??`** (nullish coalescing) — [19-optional-nullish.md](19-optional-nullish.md). `user.middleName ?? ""` substitutes `""` only for `null`/`undefined`, not for `0`.

## Symbol: unique keys

```javascript
const id = Symbol("product");
const id2 = Symbol("product");
console.log(id === id2); // false — each Symbol is unique

const meta = {
  name: "Keyboard",
  [id]: { internalSku: "KB-INTERNAL" },
};
console.log(meta[id]); // { internalSku: "KB-INTERNAL" }
console.log(Object.keys(meta)); // ["name"] — Symbol is not in keys
```

Used for **well-known symbols** (`Symbol.iterator`, `Symbol.toStringTag`) and hidden fields. In application shop code, rarer than strings; in libraries and frameworks — common.

## Primitive vs wrapper object

```javascript
"hello".toUpperCase(); // works — a temporary String object
```

The engine does **autoboxing**: it momentarily wraps the primitive, calls the method, and discards the wrapper. **Don't do:**

```javascript
const s = new String("x"); // object, not primitive — an antipattern
typeof s; // "object"
```

## Type checking in application code

```javascript
function formatPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError("price must be finite number");
  }
  return value.toFixed(2);
}

const items = [{ id: 1 }, { id: 2 }];
Array.isArray(items);     // true — not typeof

const data = null;
data === null;            // the only reliable null-check
data === undefined;       // undefined check

// typeof is useless for null:
typeof null === "object"; // true — a trap
```

Avoid `instanceof String` for primitives — it returns false. TypeScript will later replace some runtime checks with static typing.

## Parsing strings into numbers (a bridge to lab 06)

```javascript
Number("42");       // 42
Number("");         // 0 — careful!
Number(" 42 ");     // 42
Number("42px");     // NaN
parseInt("42px", 10);  // 42 — always specify radix 10
parseFloat("3.14em");  // 3.14
```

For the `?page=2` query from the shop URL — explicit parsing and a `Number.isFinite` check, not relying on `+page`.

## How this connects to the course

| Lesson | Connection |
|------|-------|
| [02. Variables](02-variables-strict.md) | `typeof`, literals |
| [05. Coercion](05-coercion-comparison.md) | string ↔ number conversion |
| [06. Lab: types](06-lab-types.md) | parseAge, falsy quiz |
| [07. Objects](07-objects.md) | primitive vs reference |
| [19. `??` and `?.`](19-optional-nullish.md) | null/undefined in the API |
| [35. JSON, Date](35-regex-json-date.md) | type serialization |
| [`fastapi/04-pydantic`](../fastapi/04-pydantic-v2.md) | the type contract on the backend |

## Common mistakes

**`typeof x === "null"`.** Never works. Use `x === null`.

**Comparing floats without an epsilon for money.** `0.1 + 0.2 === 0.3` — false. Rounding, integer cents, a decimal library in fintech.

**`if (array)` instead of `if (array.length)`.** `[]` is truthy — an empty catalog passes the check.

**`parseInt("08")` without a radix.** In ES5 it was octal; now it's `8`, but the `parseInt(s, 10)` habit is mandatory.

**Mixing BigInt and Number in arithmetic.** Explicit `Number(big)` or `BigInt(num)`, deliberately.

**`isNaN(x)` instead of `Number.isNaN(x)`.** The former coerces — `"hello"` becomes NaN, so true.

**Storing large IDs in a number.** Above `MAX_SAFE_INTEGER` — collisions; use BigInt or string IDs.

## Summary

Seven primitives: **undefined, null, boolean, number, bigint, string, symbol**. Number is a double (except BigInt); money and float comparisons require discipline. String is immutable; falsy is eight values, everything else is truthy. `null` is intentional emptiness in JSON; `undefined` is "no value." `typeof null === "object"` — remember it for interviews. Reliable checks: `=== null`, `Array.isArray`, `Number.isFinite`, `typeof` for string/boolean/undefined.

## Checklist

- [ ] List the 7 primitives without a hint
- [ ] Name all the falsy values
- [ ] Why is `0.1 + 0.2 !== 0.3`?
- [ ] When do you need BigInt instead of number?
- [ ] How does `null` differ from `undefined` in an API response?
- [ ] How do you correctly check that a value is `null`?
- [ ] Why is `typeof []` `"object"` and not `"array"`?

Next lesson: [05. Type coercion and comparison](05-coercion-comparison.md).
