# 38. Interview Q&A: a walkthrough of the top 35 questions

## Intro: why this chapter

In a JavaScript interview you're rarely asked to "list the array methods". More often — to **explain the behavior of code**, find a bug in a snippet, describe the output order, or design a small utility in words. This chapter contains **detailed answers** to the questions from [interview-cheatsheet.md](interview-cheatsheet.md).

**How to work with the chapter:**

1. Read the question, **cover** the answer, and answer out loud for 1–2 minutes.
2. Open the explanation and compare: not just "what", but **why**.
3. If you failed — go back to the lesson in the "Where in the course" column.

---

## Block 1. Types and syntax

### 1. Seven primitives? Why is `typeof null === "object"`?

**Answer.** The primitives in ES2020+: `undefined`, `null`, `boolean`, `number`, `bigint`, `string`, `symbol`. Everything else is objects (including arrays, functions, `Date`).

`typeof null === "object"` is a **bug from the first version of JS** (1995): the internal tag for `null` matched the tag for an object. Fixing it would break the existing web. A reliable check for `null`: `value === null`.

**Where in the course:** [04-primitives.md](04-primitives.md).

---

### 2. All falsy values?

**Answer.** Exactly eight values coerce to `false` in `Boolean(x)`:

`false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`.

**Important:** `[]`, `{}`, `"0"` are **truthy**. An empty array in `if (items)` is true; check `items.length`.

**Where in the course:** [04-primitives.md](04-primitives.md), [05-coercion-comparison.md](05-coercion-comparison.md).

---

### 3. `==` vs `===`? When is `== null` acceptable?

**Answer.** `===` compares **without type coercion**. `==` applies the Abstract Equality Comparison algorithm (strings ↔ numbers, `null == undefined`, etc.).

In new code — **always `===`**, except for the idiom:

```javascript
if (value == null) {
  // value === null || value === undefined
}
```

**Why not `==` everywhere:** `"5" == 5` → true; `"" == 0` → true — hidden bugs in forms and APIs.

**Where in the course:** [05-coercion-comparison.md](05-coercion-comparison.md).

---

### 4. `||` vs `??` on `0` and `""`?

**Answer.**

| Expression | Result | Reason |
|-----------|-----------|---------|
| `0 \|\| 3000` | `3000` | `0` is falsy |
| `0 ?? 3000` | `0` | only null/undefined |
| `"" \|\| "default"` | `"default"` | `""` is falsy |
| `"" ?? "default"` | `""` | the empty string was set intentionally |

`||` — "the first truthy"; `??` — "if nullish, substitute the default". For ports, counters, and prices use `??`.

**Where in the course:** [05-coercion-comparison.md](05-coercion-comparison.md), [19-optional-nullish.md](19-optional-nullish.md).

---

### 5. `let` vs `const` vs `var`?

**Answer.**

| | Scope | Reassignment | Hoisting |
|---|---------|----------------|----------|
| `var` | function | yes | yes, as `undefined` |
| `let` | block | yes | TDZ until the declaration |
| `const` | block | no binding* | TDZ |

\* `const obj = {}; obj.x = 1` — OK; `obj = {}` — TypeError.

**Rule:** `const` by default, `let` if you reassign, `var` — don't use.

**Where in the course:** [02-variables-strict.md](02-variables-strict.md).

---

### 6. What is the TDZ?

**Answer.** The **Temporal Dead Zone** — the interval from the start of the block to the line `let x = …`, where `let`/`const` already "know" the variable, but accessing it is a `ReferenceError`. A safeguard against using it before initialization.

```javascript
console.log(a); // ReferenceError (not undefined!)
let a = 1;
```

With `var`, hoisting gives `undefined` without an error — a source of bugs.

**Where in the course:** [02-variables-strict.md](02-variables-strict.md), [11-scope-hoisting.md](11-scope-hoisting.md).

---

## Block 2. Functions and scope

### 7. What is a closure? An example?

**Answer.** A **closure** is a function plus the lexical environment in which it was created. The inner function reads the outer function's variables **after** the outer one has returned.

```javascript
function makeCounter() {
  let n = 0;
  return () => ++n;
}
const inc = makeCounter();
inc(); // 1
inc(); // 2
```

**Uses:** private state, factories, debounce, memoize, callbacks with context.

**Where in the course:** [12-closures.md](12-closures.md).

---

### 8. Arrow vs function — `this`, `arguments`, `new`?

**Answer.**

| | `function` | Arrow |
|---|------------|-------|
| `this` | dynamic (from the call) | lexical (from outside) |
| `arguments` | yes | no (rest `...args`) |
| `new` | allowed (if not arrow) | TypeError |
| `prototype` | yes | no |

Object methods with `this` — regular functions; callbacks inside methods — often arrows.

**Where in the course:** [10-functions.md](10-functions.md), [14-this.md](14-this.md).

---

### 9. `obj.method()` vs `const f = obj.method; f()`?

**Answer.** In the first case the call is **as a method** — `this = obj`. In the second — a **bare function** — in strict/module `this = undefined`. Hence bugs with `setTimeout(obj.save)` and `array.map(obj.transform)`.

**Fix:** an arrow wrapper, `bind`, or `call`.

**Where in the course:** [14-this.md](14-this.md).

---

### 10. `call`, `apply`, `bind`?

**Answer.** All set `this` explicitly:

- `fn.call(ctx, a, b)` — arguments as a list;
- `fn.apply(ctx, [a, b])` — an array of arguments;
- `fn.bind(ctx, a)` — a **new** function with a fixed `this` (and partially with arguments).

`bind` doesn't call the function immediately — handy for callbacks.

**Where in the course:** [14-this.md](14-this.md).

---

## Block 3. Objects and prototypes

### 11. Shallow vs deep copy?

**Answer.** `{ ...obj }` and `Object.assign` are a **shallow** copy: nested objects are shared.

```javascript
const a = { nested: { x: 1 } };
const b = { ...a };
b.nested.x = 2;
a.nested.x; // 2
```

Deep — `structuredClone` (plain data), or explicit copying of the nested parts, or a library.

**Where in the course:** [07-objects.md](07-objects.md).

---

### 12. The prototype chain?

**Answer.** An object has a hidden `[[Prototype]]` reference. Property lookup: object → prototype → … → `null`. Array methods live on `Array.prototype`.

**Where in the course:** [20-prototypes.md](20-prototypes.md).

---

### 13. `class` vs a constructor?

**Answer.** `class` is syntactic sugar over prototypes: methods on `ClassName.prototype`, `extends` sets up the chain. The behavior of `new` and `instanceof` is the same family.

**Where in the course:** [20-prototypes.md](20-prototypes.md), [21-classes.md](21-classes.md).

---

### 14. What does `new` do?

**Answer.** (1) Create an object with `[[Prototype]] = Fn.prototype`. (2) Call `Fn` with `this` = this object. (3) If `Fn` didn't return an object — return the created one.

**Where in the course:** [20-prototypes.md](20-prototypes.md).

---

### 15. `hasOwnProperty` vs `in`?

**Answer.** `in` — the property is **anywhere** in the chain. `Object.hasOwn(obj, key)` — only the **own** one. To enumerate "own" fields — `hasOwn`, not `for...in` without a check.

**Where in the course:** [07-objects.md](07-objects.md), [20-prototypes.md](20-prototypes.md).

---

## Block 4. Asynchrony

### 16. Order: sync, `Promise.then`, `setTimeout(0)`?

**Answer.** Synchronous code → **all microtasks** (Promise) → **one macrotask** (setTimeout). The classic: `1, 4, 3, 2`.

**Where in the course:** [24-event-loop.md](24-event-loop.md).

---

### 17. Microtask vs macrotask?

**Answer.** Micro: `Promise.then`, `queueMicrotask`. Macro: `setTimeout`, Node I/O callbacks, `setImmediate`. Microtasks run as a **batch** after the current stack, before the next macro.

**Where in the course:** [24-event-loop.md](24-event-loop.md).

---

### 18. `Promise.all` vs `allSettled` vs `race`?

**Answer.**

- `all` — all succeed, or the first error cancels the meaning of "all";
- `allSettled` — always an array of `{ status, value|reason }` — reports, bulk;
- `race` — the first settled (success or error).

**Where in the course:** [26-promises.md](26-promises.md).

---

### 19. Five `fetch`es in parallel?

**Answer.**

```javascript
const results = await Promise.all(urls.map((u) => fetch(u).then((r) => r.json())));
```

Without `Promise.all` — an array of Promises, not results.

**Where in the course:** [27-async-await.md](27-async-await.md), [29-fetch.md](29-fetch.md).

---

### 20. Does `fetch` reject on 500?

**Answer.** **No.** It rejects only on a network failure. HTTP 4xx/5xx — `response.ok === false`. Check manually.

**Where in the course:** [29-fetch.md](29-fetch.md).

---

### 21. Why `AbortController`?

**Answer.** Cancelling a request (a timeout, the user leaving the page, a filter change). `fetch(url, { signal: controller.signal })`, `controller.abort()`.

**Where in the course:** [29-fetch.md](29-fetch.md).

---

## Block 5. Modules and runtime

### 22. ESM vs CommonJS?

**Answer.** ESM: `import`/`export`, static analysis, async loading, `"type":"module"`. CJS: `require`, sync, `module.exports`. Within one project — preferably a single style.

**Where in the course:** [30-es-modules.md](30-es-modules.md).

---

### 23. The event loop in one sentence?

**Answer.** A single-threaded loop: run the synchronous code to the end of the stack, drain the microtasks, take one macrotask, repeat.

**Where in the course:** [24-event-loop.md](24-event-loop.md).

---

### 24. Is JavaScript single-threaded?

**Answer.** **Your JS code** runs in one thread. Parallelism — I/O in other OS/libuv threads, Web Workers, worker_threads. Two `await fetch`es are "parallel" in waiting for the network, not in CPU.

**Where in the course:** [24-event-loop.md](24-event-loop.md).

---

## Block 6. Practice

### 25. Filter without mutation?

**Answer.** `items.filter(predicate)` or `items.filter(...).map(...)` — a new array. Not `splice` on the source if it's shared state.

**Where in the course:** [08-arrays.md](08-arrays.md).

---

### 26. Debounce in words?

**Answer.** A closure holds `timerId`. On a new call — `clearTimeout`, a new `setTimeout` for `fn` after `ms`. The function runs **after a pause** in input (search, resize).

**Where in the course:** [12-closures.md](12-closures.md), [13-lab-closures.md](13-lab-closures.md).

---

### 27. `map` + async without `Promise.all`?

**Answer.** `map` returns an array of **Promises**, not data. `await` on an array of Promises without `all` is useless. You need `await Promise.all(arr.map(async ...))`.

**Where in the course:** [27-async-await.md](27-async-await.md).

---

### 28. JSON.parse without throw?

**Answer.** `try/catch` or a Result object `{ ok, value|error }` — [32-error-handling.md](32-error-handling.md).

---

### 29. Map vs Object for a cache?

**Answer.** Map: any keys (objects), frequent add/delete, `.size`, insertion order. Object: JSON, config literals. A cache keyed by an object — Map.

**Where in the course:** [34-map-set.md](34-map-set.md).

---

### 30. Optional chaining?

**Answer.** `a?.b?.c` — if `a` or `b` is nullish, the expression is `undefined`, with no TypeError. `fn?.()` — a safe call.

**Where in the course:** [19-optional-nullish.md](19-optional-nullish.md).

---

## Block 7. Systems

### 31. JS beyond the browser?

**Answer.** Node (APIs, CLI, tooling), serverless, Electron, React Native, embedded scripting. One language — different runtime APIs.

**Where in the course:** [01-landscape.md](01-landscape.md).

---

### 32. CORS — who blocks it?

**Answer.** The **browser**, the same-origin policy. Node/curl/postman don't block. The server must return `Access-Control-*` headers.

**Where in the course:** [29-fetch.md](29-fetch.md).

---

### 33. Debugging Node?

**Answer.** `node --inspect-brk script.js`, Chrome `chrome://inspect`, `debugger`, `console` with objects, logging the stack via `err.stack`.

**Where in the course:** [36-debugging.md](36-debugging.md).

---

### 34. unhandledRejection?

**Answer.** A rejected Promise without a `.catch` / `try await`. In Node it can terminate the process. Catch it at the top level: `main().catch(...)` and `process.on("unhandledRejection")`.

**Where in the course:** [26-promises.md](26-promises.md), [32-error-handling.md](32-error-handling.md).

---

### 35. After basic — TypeScript or Node?

**Answer (example).** Both are needed; the order depends on the goal:

- **Frontend / fullstack UI** → first **TypeScript** (types on top of JS), in parallel **fetch** to `:8090`, then React.
- **Backend BFF** → **nodejs-basic** right after basic (event loop, HTTP), TypeScript in the second week.

The argument: basic gives you the runtime model; TS catches errors at compile time; Node gives you the server and integration with the mock-exams backend.

**Where in the course:** [javascript-path.md](../javascript-path.md).

---

## Summary

A strong candidate **explains the mechanism**, gives a **counterexample** (`0 ||` vs `0 ??`), and ties it to **prod** (loss of `this`, `fetch` + 500, a shallow-copied config). Go through all 35 out loud over 2–3 sessions.

---

## Checklist before the capstone

- [ ] Answered 5+ questions without peeking
- [ ] Can draw the event loop on a whiteboard
- [ ] Can explain a closure with a counter example
- [ ] Know why `fetch` + 404 doesn't throw

Next step: [39-capstone.md](39-capstone.md).
