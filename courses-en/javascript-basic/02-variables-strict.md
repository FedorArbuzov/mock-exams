# 02. Variables: `let`, `const`, `var`, strict mode

## Intro: a scenario from work

Friday code review. A senior leaves three comments in one file: "Why `var` here?", "Why `const` if you later do `config = loadConfig()` a second time?", "ReferenceError: Cannot access 'token' before initialization — look at line 88." The MR author is you, after three hours debugging JWT refresh in a Node BFF talking to FastAPI at `:8090`. It turns out `let token` is declared **below** the first `fetch`, and in strict mode (and ES modules are **always** strict) accessing `token` in the TDZ throws an error instead of giving `undefined` like the old `var`.

The second episode is an interview and production classic:

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 3, 3, 3 — not 0, 1, 2
```

The interviewer asks: "Why?" You remember "something about closures," but the root cause is the **function scope** of `var` and a single shared variable `i`. With `let`, each iteration gets **its own** binding.

The third is from a shop-catalog UI: `const CART = []`, reviewer: "a constant!" — but you **push** products on every click. `const` forbids **reassigning** the name `CART`; it does not forbid mutating the array's **contents**. Confusing "immutable reference" with "deeply immutable object" breaks both code review and React state.

This chapter is not a "let vs const vs var" table but a **memory and scope model** so you can predict behavior before running the code.

## What you'll learn

- Three ways to declare a variable: **`var`**, **`let`**, **`const`** — and when to use each.
- **Block** vs **function** scope.
- **Hoisting** and the **Temporal Dead Zone (TDZ)** — why `let` "breaks" before its declaration line.
- What **`const`** actually locks (the binding, not deep immutability).
- The **`"use strict"`** directive and why it is already on in modules.
- **`globalThis`**, naming style, basic literals and operators (a prelude to types).

## Three ways to declare a variable

```javascript
var legacyCounter = 0;   // ES5, function scope — don't use in new code
let retryCount = 0;      // block scope, can be reassigned
const API_BASE = "http://localhost:8090/api/v1";  // block scope, binding can't be reassigned
```

| Keyword | Scope | Binding reassignment | Hoisting |
|----------------|-------------------|------------------------|----------|
| `var` | function or global | yes | yes, as `undefined` |
| `let` | block `{ }` | yes | TDZ until declaration |
| `const` | block `{ }` | no | TDZ until declaration |

**Binding** is the link between a name and a memory cell. `const x = obj` locks in that **the name `x`** always points to **the same object** (while the scope lives); the object's properties may change.

**Course rule:** default to **`const`**. Use **`let`** when you need reassignment (`retryCount++`, `for (let i …)`). Use **`var`** only when reading legacy code, not in new code.

## `const` does not make an object immutable

A typical shop user object:

```javascript
const user = { name: "Ann", role: "customer" };

user.name = "Bob";       // OK — changing a property
user.lastLogin = new Date();  // OK — adding a property
// user = { name: "X" };  // TypeError: Assignment to constant variable

const cart = [];
cart.push({ sku: "KB-1", qty: 1 });  // OK
// cart = [];  // TypeError
```

For a **shallow** freeze — `Object.freeze(user)` (does not protect nested objects). For React and reducers — **immutable patterns** (a new object via spread) — [08-arrays.md](08-arrays.md), the react course. Here `const` means: "this name won't point to a different array/object," not "the array never changes."

## Block scope: `let` and `const`

```javascript
if (true) {
  let discount = 0.1;
  const maxItems = 100;
  console.log(discount); // 0.1
}
// console.log(discount); // ReferenceError: discount is not defined
// console.log(maxItems);   // ReferenceError
```

Blocks `if`, `for`, `while`, and `{ }` around `try` are all **separate scopes** for `let`/`const`. This reduces "leaking" of temporary variables to the outside and makes refactoring safer.

### Loops and async: the key difference between `var` and `let`

```javascript
// Bad: var — one variable i for the whole loop
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var", i), 0);
}
// var 3, var 3, var 3

// Good: let — a new binding on each iteration
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let", j), 0);
}
// let 0, let 1, let 2
```

Why: by the time the `setTimeout` callback runs, the `var` loop has already finished, `i === 3`. With `let`, each callback "closes over" **its own** value of `j`. We cover closures in [12-closures.md](12-closures.md); here **scope** is the cause that matters.

## Why `var` still shows up in legacy

**Function scope** — `var` is visible throughout the whole function, even when declared inside `if`:

```javascript
function processOrder() {
  if (true) {
    var status = "pending";
  }
  console.log(status); // "pending" — var "leaked" out of the if
}
```

**Hoisting** — a `var` declaration is "raised" to the top of the function, while the initialization stays in place:

```javascript
console.log(a); // undefined — not ReferenceError!
var a = 5;
// The engine conceptually: var a; console.log(a); a = 5;
```

With `let`/`const`:

```javascript
console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 5;
```

The zone from the start of the block to the `let b` line is the **Temporal Dead Zone**: the name is already in scope, but you can't reference it. This **intentionally** catches "used before declaration" bugs.

```javascript
let c = 1;
{
  // console.log(c); // OK, the outer c
  let c = 2;        // a different c in the inner block
  console.log(c); // 2
}
console.log(c);   // 1
```

## Names, style, and reserved words

```javascript
const userName = "ann";           // camelCase for variables and functions
const MAX_RETRIES = 3;            // UPPER_SNAKE for true config constants
const defaultPort = 8090;         // or const DEFAULT_PORT — the team decides

function calculateTotal(items) {  // verb + noun
  return items.reduce((s, i) => s + i.price, 0);
}
```

Reserved words can't be used as identifiers: `class`, `return`, `await` (at module top level). Full list — MDN "Lexical grammar."

`$`, `_`, and Unicode letters are allowed; in team mock-exams projects it's usually **ASCII** for compatibility with CI and grep.

## `"use strict"` — the ES5 strict mode

A directive at the **start of a file** or a **function body**:

```javascript
"use strict";

function leak() {
  mistyped = 1; // ReferenceError in strict — no accidental globals
}
```

In **ES modules** (`"type": "module"` in [examples/package.json](examples/package.json)) and in **class bodies**, strict is enabled **automatically**. Writing `"use strict"` in every lab file is not required.

| Without strict (sloppy) | With strict |
|---------------------|-----------|
| `mistyped = 1` creates a global | ReferenceError |
| duplicate parameter names `function f(a,a)` | SyntaxError |
| `delete` of non-deletable names | error or no-op in strict |
| `this` in a plain function without context | `undefined` (not `globalThis` like `window` in the browser) |

Strict does not make JS "strictly typed" — only **stricter** about some footguns. Static typing comes later with TypeScript.

## `globalThis`

A single reference to the global object:

```javascript
console.log(globalThis === global);  // true in Node
// in the browser: globalThis === window (or self in a worker)
```

**Don't pollute the global** with `globalThis.myHelper = …` — conflicts in large apps. In modules, export explicitly ([30-es-modules.md](30-es-modules.md)).

## Literals and basic operators (a bridge to lessons 04–05)

```javascript
const count = 42;                    // number
const price = 79.99;
const title = "Keyboard";            // string
const greeting = `Item: ${title}`;   // template literal
const inStock = true;                // boolean
const missing = null;                // an intentional "no value"
let notSet;                          // undefined

// Operators — details in 05-coercion-comparison.md
5 + 3;      // 8
"5" + 3;    // "53" — weak typing
5 === "5";  // false — use ===
5 == "5";   // true — avoid in new code
```

## Comments and documentation

```javascript
// Single-line — the why, not the what (when the code isn't self-explanatory)

/*
  Multi-line — rarely; for temporarily disabling a block
*/

/**
 * Parses the page query parameter into a number.
 * @param {string} raw — from the URL
 * @returns {number|null}
 */
function parsePage(raw) {
  // ...
}
```

JSDoc is useful before TypeScript and for IDE hints.

## How this connects to the course

| Lesson | Connection |
|------|-------|
| [03. Lab: first scripts](03-lab-first-scripts.md) | `let` vs `var` in a loop, template strings |
| [04. Primitives](04-primitives.md) | `typeof`, `null`, `undefined` |
| [05. Coercion](05-coercion-comparison.md) | `===`, `"5" + 3` |
| [11. Scope and hoisting](11-scope-hoisting.md) | TDZ, nested scopes, closures |
| [12. Closures](12-closures.md) | `for (let i)` + setTimeout |
| [14. this](14-this.md) | strict changes `this` in a plain call |
| [30. ES modules](30-es-modules.md) | implicit strict, `import` |

## Common mistakes

**`const` for a value you reassign.** A login retry counter is `let retries = 0`, not `const` followed by `retries = 1`.

**Thinking `const obj` forbids `obj.field = x`.** Only `obj = otherObject` is forbidden. For immutability — a new object, `structuredClone`, or libraries.

**`var` in loops with `setTimeout` / Promises.** The classic "all callbacks see the last i" bug. Replace with `let` or an IIFE in legacy code.

**Accessing `let`/`const` before its declaration line.** Copy-pasting a block of code to the top of a file — TDZ ReferenceError. With `var` it would have been a silent `undefined`.

**Shadowing an outer variable unintentionally.** `let data` inside an `if` and outside are different; easy to mix up while debugging a fetch response.

**Accidental globals in a sloppy script.** Without strict and modules, `typo = 1` creates a property on the global — hard-to-catch bugs. Modules + strict solve this.

## Summary

Modern JS: **`const` by default**, **`let` when reassigning**, **`var` — don't write it**. `let`/`const` live in **blocks** and fall into the **TDZ** before their declaration — better than `var` hoisting with `undefined`. `const` locks the **name**, not a deep freeze of the object. ES modules are already in **strict mode**. These rules are the foundation for types, functions, and async against the shop API.

## Checklist

- [ ] When `const`, when `let`? Give an example of each from the shop domain
- [ ] How does `let` differ from `var` in `for` + `setTimeout`?
- [ ] What is the TDZ and what will `console.log(x); let x = 1` print?
- [ ] Why is `const arr = []; arr.push(1)` legal?
- [ ] Do you need `"use strict"` in `examples/lab/*.js` files?
- [ ] What is `globalThis` and why avoid creating globals?

Next lesson: [03. Lab: first scripts](03-lab-first-scripts.md).
