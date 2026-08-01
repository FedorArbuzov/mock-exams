# 05. Type coercion and comparison

## Intro: a scenario from work

An incident in shop checkout. The frontend sent `{ "quantity": "2", "price": "79.99" }` — strings from `<input type="text">`. The Node BFF without validation computed `total = body.quantity * body.price` — and got `159.98` (lucky). In another order `quantity = "2"` and `sku = "10"` produced `"210"` somewhere in a `+` concatenation. A FastAPI backend on `:8090` with Pydantic would have rejected the body with a 422; the "trust-based" JS layer did not.

In an interview they show:

```javascript
[] == ![];  // true
```

And ask "why." Walking through Abstract Equality Comparison takes five minutes — a great filter, but this should never exist in **your** code.

Code review:

```javascript
const port = config.port || 3000;
```

Reviewer: "If port === 0, this breaks." Author: "But zero is falsy!" — yes, and a **deliberate** port 0 (rare, but in tests and bind) gets reset to 3000. Fix: `config.port ?? 3000`.

Coercion is not "evil JavaScript." It's a set of **explicit rules** the engine applies when you use `==`, `+` with a string, or `if (value)`. The goal of this chapter is to **predict** the behavior and **write code without surprises**: `===`, explicit `Number()`, `??`.

## What you'll learn

- **Implicit coercion** — when and why it kicks in.
- **Explicit conversion** — `Number`, `String`, `Boolean`, `parseInt`.
- **`===` vs `==`**, the rare `x == null` pattern.
- **`Object.is`**, locale-aware string comparison.
- **Logical operators** `&&`, `||`, `??` — what they **return**.
- **`switch`**, conditions, common interview pitfalls.

## Implicit coercion: the engine "guesses"

JavaScript is **weakly typed**: operators often coerce operands to a common type.

### Addition and `+`

`+` is special: if **at least one** operand is a string (or Symbol), the result is a string (concatenation):

```javascript
"5" + 1;      // "51" — number 1 → "1"
"5" + true;   // "5true"
"qty: " + 2;  // "qty: 2"
```

If both are "numeric" — addition:

```javascript
5 + 1;        // 6
"5" - 1;      // 4 — minus always pulls toward number
"5" * "2";    // 10
"5" / 2;      // 2.5
true + 1;     // 2 — true → 1
"" + false;   // "false"
```

**Course rule:** in form, API, and shop-total code, **don't rely** on implicit coercion. Be explicit:

```javascript
const qty = Number(form.quantity);
const price = Number(form.price);
if (!Number.isFinite(qty) || !Number.isFinite(price)) {
  throw new Error("invalid numbers");
}
const total = qty * price;
```

### Strange edges (know them, don't use them)

```javascript
[] + [];        // "" — arrays → "" + ""
[] + {};        // "[object Object]"
{} + [];        // in an expression statement may give 0 — don't rely on it
Number("");     // 0
Number(null);   // 0
Number(undefined); // NaN
```

## Explicit conversion

```javascript
Number("42");       // 42
Number("");         // 0 — a common trap
Number("hello");    // NaN
Number(null);       // 0
Number(undefined);  // NaN
Number(false);      // 0
Number(true);       // 1

parseInt("42px", 10);   // 42 — radix 10 is mandatory
parseFloat("3.14em");   // 3.14

String(42);         // "42"
String(null);       // "null"
Boolean(0);         // false
Boolean("0");       // true — a non-empty string
```

`Number()` vs `parseInt`: for a **clean** string `"42"` both are fine. For `"42px"` — only `parseInt`/`parseFloat`. For user validation — `Number` + `Number.isFinite`.

## Comparison: `===` strict equality

**`===`** compares **without** type coercion:

```javascript
5 === 5;              // true
5 === "5";            // false
0 === false;          // false
null === undefined;   // false
NaN === NaN;          // false
```

**`!==`** — negation.

**Rule:** in new code **always** use `===` and `!==`.

## Comparison: `==` abstract equality

**`==`** coerces types by the ECMA-262 algorithm (a long table). Examples:

```javascript
5 == "5";           // true — string → number
0 == false;         // true
"" == 0;            // true
null == undefined;  // true — the only pair that is "equal" under ==
[] == false;        // true — [] → "" → 0, false → 0
```

An **acceptable** idiom:

```javascript
if (value == null) {
  // value === null || value === undefined
}
```

In the TypeScript era people often write it explicitly: `value === null || value === undefined` or `value ?? default`.

## `Object.is`

Like `===`, but:

```javascript
Object.is(NaN, NaN);  // true
Object.is(+0, -0);    // false (+0 === -0 gives true)
Object.is(5, "5");    // false
```

React uses `Object.is` to compare state (Strict Mode). In application code, rarer than `===`.

## String comparison

```javascript
"a" < "b";                    // true — UTF-16 code units
"2" < "10";                   // true — string comparison!
"ä".localeCompare("z", "de"); // locale-aware sort
```

For sorting shop customer names — **`localeCompare`**, not `<`. Using `sort` on numbers as strings is a bug; the comparator `(a,b) => a - b` — [08-arrays.md](08-arrays.md).

## Logical operators: not just true/false

`&&` and `||` return **one of the operands**, not necessarily a boolean:

```javascript
true && "yes";    // "yes"
false && "yes";   // false
null ?? "default";  // "default" — nullish coalescing
0 ?? "default";     // 0 — only null/undefined
0 || "default";     // "default" — 0 is falsy!
"" || "guest";      // "guest"
```

Patterns:

```javascript
// Short-circuit — side effect
user && sendEmail(user.email);

// Default — careful with 0 and ""
const port = config.port || 3000;   // breaks on port: 0
const portOk = config.port ?? 3000; // OK for 0

const name = user?.name ?? "Guest"; // optional chaining + nullish — lesson 19
```

The difference **`||` vs `??`** is critical for BFF configs (port, timeout `0`, an empty string as a valid value).

## Coercion in conditions

```javascript
if (items.length) { /* there are items */ }
if (user?.email) { /* email is set and truthy */ }
if (discount != null) { /* not null and not undefined */ }
```

An empty array **`[]` is truthy** — check `.length`. The string `"0"` is truthy — don't confuse it with the number 0.

## `switch` uses `===`

```javascript
const status = "1";
switch (status) {
  case 1:
    console.log("number one"); // won't run
    break;
  case "1":
    console.log("string one"); // will run
    break;
}
```

The HTTP status from fetch is sometimes a string in headers; convert deliberately.

## Coercion in JSON and the API

JSON doesn't know `undefined` — the key is omitted on `stringify`. `null` is preserved. FastAPI on `:8090` returns strict types; the JS client must **not** mix `"79.99"` and `79.99` in one formula.

```javascript
const body = JSON.parse('{"price":79.99}');
typeof body.price; // "number" — JSON numbers

const bad = JSON.parse('{"price":"79.99"}');
typeof bad.price; // "string" — the contract is broken on the backend or middleware
```

## How this connects to the course

| Lesson | Connection |
|------|-------|
| [04. Primitives](04-primitives.md) | falsy, typeof, Number |
| [06. Lab: types](06-lab-types.md) | predict, parseAge, getPort |
| [16. Control flow](16-control-flow.md) | if, switch, loops |
| [19. `??` and `?.`](19-optional-nullish.md) | safe defaults |
| [32. Errors](32-error-handling.md) | input validation |
| [`fastapi/04-pydantic`](../fastapi/04-pydantic-v2.md) | coercion at the API boundary |

## Common mistakes

**`==` "for brevity."** It saves zero characters, at the cost of an hour debugging `"5" == 5`.

**`||` for a default numeric port/timeout.** Use `??` when `0` is valid.

**`+"42"` as the only validation.** `+"42abc"` → NaN; check `Number.isFinite`.

**Comparing floats without rounding.** Money — integer cents or a decimal lib.

**Truthiness of an empty array/object.** `if (users)` is true for `[]`; you need `users.length`.

**Explaining `[] == ![]` in production.** An academic exercise; in code — `===`.

**Forgetting the radix in `parseInt`.** Always `parseInt(s, 10)`.

## Summary

Coercion is automatic conversion in `==`, `+`, `if`. In application code: **`===`**, explicit **`Number`/`String`**, **`??`** instead of `||` where falsy is valid. `||` and `&&` return operands — a feature for defaults and guards. `switch` uses strict `===`. Understanding coercion explains form and config bugs; disciplined coding style prevents them.

## Checklist

- [ ] Result of `"3" + 2` and `"3" - 2`?
- [ ] When is `==` acceptable (one idiom)?
- [ ] How does `||` differ from `??` for `port: 0`?
- [ ] Why does `Number("") === 0`?
- [ ] `NaN === NaN`? How do you check for NaN?
- [ ] `[]` in `if ([])` — true or false?
- [ ] Write a safe `parsePrice(input)` → number | null

Next lesson: [06. Lab: types and comparison](06-lab-types.md).
