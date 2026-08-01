# 27. `async`/`await`

## A scenario from work

You're refactoring a service: three API calls went as a `.then` chain — hard to read and hard to set a breakpoint. You rewrote it with `async/await`, but the page is slow again: you forgot that `await` in a loop waits **one at a time**. In a `map` you wrote `urls.map(async (u) => fetch(u))` and were surprised that `await` on the outside doesn't wait. A top-level `await` in `config.js` broke the tests that `import` it without awaiting.

`async`/`await` is **syntactic sugar** over Promises: linear code with `try/catch` instead of `.then` pyramids.

## What you'll learn

- How to declare `async` functions and what they return
- `await` and pausing until a Promise settles
- `try/catch/finally` around await
- Sequential vs parallel execution
- Errors in loops and `Promise.all` with `map`
- `await` on non-Promise values
- Top-level await in ES modules
- `async` methods in classes and common traps

---

## An async function always returns a Promise

```javascript
async function getAnswer() {
  return 42;
}

const p = getAnswer();
console.log(p instanceof Promise); // true

p.then((v) => console.log(v)); // 42
```

An explicit throw → a rejected Promise:

```javascript
async function fail() {
  throw new Error("boom");
}

fail().catch((e) => console.log(e.message)); // boom
```

`async` without `await` inside — still a Promise (sometimes useful for a uniform API).

---

## await: waiting for settlement

```javascript
async function loadProfile(userId) {
  const user = await fetchUser(userId);
  const orders = await fetchOrders(user.id);
  return { user, orders };
}
```

Up to the first `await` the code runs **synchronously** in the calling stack. After `await` the continuation is a **microtask** ([24-event-loop.md](24-event-loop.md)).

```javascript
async function demo() {
  console.log("1");
  await Promise.resolve();
  console.log("2");
}

console.log("A");
demo();
console.log("B");
// A, 1, B, 2
```

---

## try/catch/finally

```javascript
async function main() {
  try {
    const data = await riskyOperation();
    return data;
  } catch (err) {
    console.error("Handled:", err.message);
    throw err; // or return a fallback
  } finally {
    console.log("always runs");
  }
}
```

A single `try/catch` around several `await`s — the analog of one `.catch` on a chain ([26-promises.md](26-promises.md)).

A synchronous throw before await is also caught:

```javascript
async function f() {
  try {
    throw new Error("sync");
  } catch (e) {
    console.log(e.message);
  }
}
```

---

## Sequential vs parallel

**Sequential** — each step waits for the previous one (slower if the steps are independent):

```javascript
const a = await fetchA();
const b = await fetchB();
```

**Parallel** — start both, then wait:

```javascript
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

Important: an `await` **before** `Promise.all` kills the parallelism:

```javascript
// slow — B starts only after A
const a = await fetchA();
const b = await fetchB();

// fast
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

For three or more — the same pattern, or `Promise.allSettled` for partial failures.

---

## map + async: the classic trap

```javascript
// bad — an array of Promises, not awaited
const results = urls.map(async (url) => {
  const res = await fetch(url);
  return res.json();
});
console.log(results); // [Promise, Promise, ...]

// good
const results = await Promise.all(
  urls.map(async (url) => {
    const res = await fetch(url);
    return res.json();
  })
);
```

`map` with an `async` callback returns an array of Promises; you need `Promise.all` (or `allSettled`).

---

## await on a non-Promise

```javascript
async function f() {
  const x = await 42;
  console.log(x); // 42
}
```

The engine wraps the value in `Promise.resolve`. Useful for uniformity, but redundant for literals.

---

## Loops: for, for...of, while

**One at a time** (often needed for a rate limit):

```javascript
for (const id of ids) {
  await processOne(id);
}
```

**Parallel with a limit** — separate patterns (nodejs-intermediate); naively:

```javascript
await Promise.all(ids.map((id) => processOne(id)));
```

`forEach` with an `async` callback **does not wait** for await:

```javascript
// bad
ids.forEach(async (id) => {
  await processOne(id);
});
// forEach finishes immediately, processOne runs in the background
```

Use `for...of` or `Promise.all`.

---

## Top-level await

In ES modules (Node with `"type": "module"`, Vite, the browser):

```javascript
// config.js
const res = await fetch("http://localhost:8090/health");
const config = await res.json();
export { config };
```

The importing module **waits** for initialization. Handy for config; in tests you may need to mock before the import.

```javascript
// main.js
import { config } from "./config.js";
console.log(config);
```

---

## async methods in classes

```javascript
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async get(path) {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

const api = new ApiClient("http://localhost:8090");
const items = await api.get("/api/v1/items");
```

Connection to [21-classes.md](21-classes.md) and [29-fetch.md](29-fetch.md).

---

## Error handling in parallel batches

```javascript
const results = await Promise.allSettled(
  urls.map((url) => fetchJson(url))
);

const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
const failed = results.filter((r) => r.status === "rejected");
```

Or a single `try/catch` around `Promise.all` — it fails on the first error.

---

## async/await vs plain Promises

| Situation | Preference |
|----------|--------------|
| Linear steps with branching | async/await |
| Transformations without await | a `.then` chain |
| Combinators | `Promise.all` inside async |
| A library pipeline | sometimes then is shorter |

Team style: usually async/await for readability.

---

## Relation to the course

- [26-promises.md](26-promises.md) — the foundation under await.
- [24-event-loop.md](24-event-loop.md) — continuations after await.
- [28-lab-async.md](28-lab-async.md) — output order, retry, loadAll.
- [29-fetch.md](29-fetch.md) — HTTP with await.
- [30-es-modules.md](30-es-modules.md) — top-level await.
- [32-error-handling.md](32-error-handling.md) — recover/rethrow strategies.

The FastAPI stand `:8090` — a typical target for `await fetch` in the nodejs/react labs.

---

## Common mistakes

1. **Sequential await for independent requests** — unnecessary latency.

2. **`map(async ...)` without `Promise.all`** — the results aren't awaited.

3. **`forEach(async ...)`** — doesn't wait for completion.

4. **Forgetting `return` in async** — an implicit `undefined` in the Promise.

5. **try/catch only around one await** — the second will propagate as unhandled.

6. **async in a class constructor** — you can't `await` in `constructor`; use a `static async create()` factory.

7. **Blocking the UI with a long await in a handler** — await doesn't make the work parallel, it just doesn't block the stack between I/O; CPU work between awaits is still sync.

---

## Summary

`async` functions return a Promise; `await` pauses until another Promise settles. `try/catch` replaces `.catch` for linear code. Independent operations — `Promise.all`, not a chain of awaits. `map` with async requires `Promise.all`. Top-level await in modules for configuration. `for...of` loops with await — sequential processing; `forEach` with async — an antipattern.

---

## Checklist

- What does `async () => 5` return?
- How do you run three `fetch`es in parallel?
- The output order in the A, demo(), B example?
- Why does `urls.map(async (u) => fetch(u))` without `all` not wait?
- Where do you catch an error from `await fetch(...)`?
- Can you `await` in a `class constructor`?

Next lesson: [28. Lab: async](28-lab-async.md).
